const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config()

const User       = require('../models/User')
const Assignment = require('../models/Assignment')
const Payment    = require('../models/Payment')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/promptment'

// ─── Sample Data ─────────────────────────────────────────
const users = [
  {
    name:       'Super Admin',
    email:      'admin@promptment.app',
    password:   'Admin@123456',
    role:       'admin',
    city:       'Karachi',
    university: 'N/A',
    verified:   true,
    walletBalance: 0,
  },
  {
    name:       'Ahmed Khan',
    email:      'student1@test.com',
    password:   'Test@123456',
    role:       'student',
    city:       'Karachi',
    university: 'FAST NUCES',
    verified:   true,
    walletBalance: 5000,
  },
  {
    name:       'Sara Malik',
    email:      'student2@test.com',
    password:   'Test@123456',
    role:       'student',
    city:       'Lahore',
    university: 'LUMS',
    verified:   true,
    walletBalance: 3200,
  },
  {
    name:       'Bilal Raza',
    email:      'executor1@test.com',
    password:   'Test@123456',
    role:       'executor',
    city:       'Karachi',
    university: 'FAST NUCES',
    verified:   true,
    walletBalance: 12500,
    rating:     4.8,
    totalReviews: 15,
    ratingSum:  72,
    completedAssignments: 15,
    bio:        'Expert in ML, Data Science, and Web Development. 3 years of experience.',
    skills:     ['Python', 'Machine Learning', 'React', 'Node.js', 'Data Analysis'],
  },
  {
    name:       'Zara Ahmed',
    email:      'executor2@test.com',
    password:   'Test@123456',
    role:       'executor',
    city:       'Lahore',
    university: 'LUMS',
    verified:   true,
    walletBalance: 8400,
    rating:     4.6,
    totalReviews: 10,
    ratingSum:  46,
    completedAssignments: 10,
    bio:        'Business analyst and writer. Specializing in economics and business strategy.',
    skills:     ['Economics', 'Business Analysis', 'Report Writing', 'Statistics'],
  },
  {
    name:       'Omar Sheikh',
    email:      'executor3@test.com',
    password:   'Test@123456',
    role:       'executor',
    city:       'Islamabad',
    university: 'NUST',
    verified:   true,
    walletBalance: 6200,
    rating:     4.9,
    totalReviews: 22,
    ratingSum:  107.8,
    completedAssignments: 22,
    bio:        'Engineering student with deep knowledge of circuit design and embedded systems.',
    skills:     ['Circuit Design', 'MATLAB', 'C/C++', 'Arduino', 'Embedded Systems'],
  },
]

const getAssignments = (studentIds, executorIds) => [
  {
    title:       'Machine Learning Classification Model — MNIST Dataset',
    description: 'Build a CNN classification model on MNIST dataset with >98% accuracy. Submit Jupyter notebook with full documentation, confusion matrix, and training graphs.',
    category:    'Computer Science',
    type:        'digital',
    budget:      4500,
    deadline:    new Date(Date.now() + 3 * 24 * 3600000),
    student:     studentIds[0],
    executor:    executorIds[0],
    status:      'inprogress',
  },
  {
    title:       'Economics Essay — Impact of Inflation on Consumer Behavior in Pakistan',
    description: 'Write a 3000-word essay on how rising inflation has affected consumer purchasing patterns in Pakistan (2020-2024). Include citations from peer-reviewed sources.',
    category:    'Economics',
    type:        'digital',
    budget:      2200,
    deadline:    new Date(Date.now() + 5 * 24 * 3600000),
    student:     studentIds[1],
    status:      'pending',
  },
  {
    title:       'Data Structures Lab Report — AVL Trees',
    description: 'Write a complete lab report on AVL tree implementation including code, complexity analysis, and test cases. Follow IEEE format.',
    category:    'Computer Science',
    type:        'digital',
    budget:      1800,
    deadline:    new Date(Date.now() + 2 * 24 * 3600000),
    student:     studentIds[0],
    executor:    executorIds[1],
    status:      'completed',
    aiValidation: {
      checked:        true,
      checkedAt:      new Date(),
      plagiarismScore: 3,
      aiContentScore:  12,
      humanScore:      88,
      passed:          true,
      report:          'Content appears original with minimal AI-generated text. Low plagiarism risk.',
    },
  },
  {
    title:       'Business Strategy Plan — Tech Startup Pitch Deck',
    description: 'Create a 15-slide pitch deck for a fintech startup targeting Pakistani SMEs. Include market analysis, financial projections, and competitive landscape.',
    category:    'Business',
    type:        'digital',
    budget:      6000,
    deadline:    new Date(Date.now() + 7 * 24 * 3600000),
    student:     studentIds[1],
    status:      'pending',
  },
  {
    title:       'Circuit Design Lab — Op-Amp Configurations',
    description: 'Design and simulate inverting, non-inverting, and differential op-amp circuits using LTSpice. Submit simulation files and detailed analysis report.',
    category:    'Engineering',
    type:        'physical',
    budget:      2800,
    deadline:    new Date(Date.now() + 4 * 24 * 3600000),
    student:     studentIds[0],
    city:        'Karachi',
    university:  'FAST NUCES',
    status:      'pending',
  },
  {
    title:       'Calculus Assignment — Integration Techniques',
    description: 'Solve 20 integration problems covering: by parts, substitution, partial fractions. Show all steps clearly.',
    category:    'Mathematics',
    type:        'digital',
    budget:      900,
    deadline:    new Date(Date.now() + 1 * 24 * 3600000),
    student:     studentIds[1],
    executor:    executorIds[2],
    status:      'approved',
    escrowReleased: true,
    escrowReleasedAt: new Date(Date.now() - 1 * 24 * 3600000),
  },
]

// ─── Seeder Function ─────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Assignment.deleteMany({}),
      Payment.deleteMany({}),
    ])
    console.log('🗑️  Cleared existing data')

    // Hash passwords and create users
    const createdUsers = await Promise.all(
      users.map(async (u) => {
        const salt = await bcrypt.genSalt(12)
        u.password = await bcrypt.hash(u.password, salt)
        u.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        return User.create(u)
      })
    )

    console.log(`👥 Created ${createdUsers.length} users`)

    const adminUser    = createdUsers.find(u => u.role === 'admin')
    const studentUsers = createdUsers.filter(u => u.role === 'student')
    const executorUsers = createdUsers.filter(u => u.role === 'executor')

    const studentIds  = studentUsers.map(u => u._id)
    const executorIds = executorUsers.map(u => u._id)

    // Create assignments
    const assignmentData = getAssignments(studentIds, executorIds)
    const createdAssignments = await Assignment.insertMany(assignmentData)
    console.log(`📚 Created ${createdAssignments.length} assignments`)

    // Create sample payment for approved assignment
    const approvedAssignment = createdAssignments.find(a => a.status === 'approved')
    if (approvedAssignment) {
      await Payment.create({
        student:        studentIds[1],
        executor:       executorIds[2],
        assignment:     approvedAssignment._id,
        amount:         900,
        platformFee:    45,
        executorPayout: 855,
        method:         'easypaisa',
        status:         'released',
        escrow: {
          held:       true,
          heldAt:     new Date(Date.now() - 3 * 24 * 3600000),
          released:   true,
          releasedAt: new Date(Date.now() - 1 * 24 * 3600000),
        },
      })
      console.log('💰 Created sample payment')
    }

    console.log('\n🎉 Database seeded successfully!\n')
    console.log('─'.repeat(50))
    console.log('Test Credentials:')
    console.log('─'.repeat(50))
    console.log('Admin:    admin@promptment.app   / Admin@123456')
    console.log('Student1: student1@test.com      / Test@123456')
    console.log('Student2: student2@test.com      / Test@123456')
    console.log('Executor1:executor1@test.com     / Test@123456')
    console.log('Executor2:executor2@test.com     / Test@123456')
    console.log('Executor3:executor3@test.com     / Test@123456')
    console.log('─'.repeat(50))

    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding error:', err.message)
    process.exit(1)
  }
}

seed()
