const axios  = require('axios')
const logger = require('./logger')
const Assignment = require('../models/Assignment')

// ─── Run AI Validation on submission ─────────────────────
exports.runAIValidation = async (assignment) => {
  if (!assignment.submittedFiles?.length) return

  logger.info(`🤖 Running AI validation for assignment: ${assignment._id}`)

  try {
    // Combine file names for context (in prod, extract actual text content)
    const fileContext = assignment.submittedFiles.map(f => f.name).join(', ')
    const prompt      = buildValidationPrompt(assignment.title, assignment.description, fileContext)

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model:      'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          {
            role:    'system',
            content: 'You are an academic integrity checker. Respond ONLY with JSON.',
          },
          {
            role:    'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const raw    = response.data.choices[0].message.content
    const result = JSON.parse(raw)

    const passed =
      (result.plagiarism_score || 0) <= 15 &&
      (result.human_score || 0) >= 60

    await Assignment.findByIdAndUpdate(assignment._id, {
      aiValidation: {
        checked:         true,
        checkedAt:       new Date(),
        plagiarismScore: result.plagiarism_score || 0,
        aiContentScore:  result.ai_content_score || 0,
        humanScore:      result.human_score || 100,
        passed,
        report:          result.summary || '',
        provider:        'openai',
      },
    })

    logger.info(`✅ AI validation done: plagiarism=${result.plagiarism_score}% human=${result.human_score}% passed=${passed}`)

    return { passed, plagiarismScore: result.plagiarism_score, humanScore: result.human_score }
  } catch (err) {
    logger.error(`AI validation error: ${err.message}`)

    // Fallback: mark as unchecked but don't block
    await Assignment.findByIdAndUpdate(assignment._id, {
      'aiValidation.checked':  true,
      'aiValidation.checkedAt': new Date(),
      'aiValidation.passed':   null, // null = inconclusive
      'aiValidation.report':   'Validation service temporarily unavailable.',
    })
  }
}

// ─── Prompt Builder ───────────────────────────────────────
function buildValidationPrompt(title, description, files) {
  return `
You are reviewing a submitted academic assignment.

Assignment Title: "${title}"
Description: "${description}"
Submitted Files: ${files}

Based on typical academic submission patterns and the assignment context, estimate:
1. Plagiarism risk (0-100, where 0 = original, 100 = fully plagiarized)
2. AI-generated content likelihood (0-100, where 0 = human, 100 = fully AI)
3. Human-written likelihood (0-100, inverse of AI score)
4. Brief summary of your assessment

Respond in this exact JSON format:
{
  "plagiarism_score": <0-100>,
  "ai_content_score": <0-100>,
  "human_score": <0-100>,
  "summary": "<2-3 sentence assessment>"
}
`.trim()
}

// ─── Simple text-based check (fallback without API) ───────
exports.quickTextCheck = (text) => {
  const aiPhrases = [
    'as an AI language model', 'I cannot provide', 'it is worth noting',
    'in conclusion, it is', 'furthermore, it is important', 'it is essential to note',
  ]
  const aiScore = aiPhrases.filter(p => text.toLowerCase().includes(p)).length * 15
  return {
    plagiarismScore: 0,
    aiContentScore:  Math.min(aiScore, 95),
    humanScore:      Math.max(100 - aiScore, 5),
    passed:          aiScore < 30,
  }
}
