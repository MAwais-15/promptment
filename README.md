# 🚀 Promptment — Futuristic Student Assignment Marketplace

> AI-powered | Escrow Payments | Real-Time Chat | Role-Based Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-brightgreen?style=flat-square)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-blue?style=flat-square)](https://socket.io)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Payment Flow](#payment-flow)
- [AI Validation](#ai-validation)

---

## 🌐 Overview

**Promptment** is a full-stack, production-ready marketplace connecting students with skilled executors for academic assignments. Built with a futuristic UI, real-time communication, AI-powered verification, and a secure escrow payment system.

---

## ✨ Features

### 👩‍🎓 Student Panel
- Post digital & physical assignments
- Set budget, deadline, upload requirements
- Browse & select from applicant executors
- Real-time status tracking (Pending → Approved)
- Chat with executor
- Review AI-validated submissions
- Approve work → auto-release escrow

### 🛠️ Executor Panel
- Browse & filter available assignments
- Location-based matching for physical tasks
- Apply with custom message
- Upload completed work
- Real-time notifications
- Wallet & earnings dashboard

### 🛡️ Admin Panel
- Full user management (ban/unban)
- Assignment monitoring & approvals
- AI validation score review
- Payment dashboard & commission tracking
- Real-time activity logs
- Fraud detection alerts

### 💬 Real-Time Features
- Socket.io chat with typing indicators
- Online presence tracking
- Push notifications for all events

### 💰 Payment System
- **Escrow**: funds held until approval
- **Crypto**: BTC, ETH, USDT (TRC20/ERC20)
- **Local**: EasyPaisa, JazzCash
- **Bank**: Transfer, IBAN
- **Platform fee**: 5% on all transactions

### 🤖 AI Validation
- Plagiarism detection
- Human vs AI content scoring
- Auto-pass/fail with report
- OpenAI GPT integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Next.js 14)           │
│  Landing │ Student │ Executor │ Admin Panel  │
│  Tailwind CSS │ Framer Motion │ Zustand      │
└────────────────────┬────────────────────────┘
                     │ REST API + WebSocket
┌────────────────────▼────────────────────────┐
│              BACKEND (Express.js)            │
│  Auth │ Assignments │ Payments │ Chat        │
│  Socket.io │ Multer │ Cloudinary             │
└────────────────────┬────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼────────────────────────┐
│              MongoDB Atlas                   │
│  Users │ Assignments │ Payments │ Chat       │
│  Notifications │ Reviews │ Activity Logs     │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
promptment/
├── frontend/                     # Next.js 14 App
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── student/
│   │   │   ├── layout.tsx        # Student shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── post/page.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   └── payments/page.tsx
│   │   ├── executor/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── browse/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       └── users/page.tsx
│   ├── components/
│   │   ├── shared/Sidebar.tsx
│   │   └── chat/ChatPage.tsx
│   ├── lib/api.ts                # Axios client
│   ├── store/authStore.ts        # Zustand auth
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                      # Node.js + Express
    └── src/
        ├── server.js             # Entry point
        ├── config/
        │   ├── db.js             # MongoDB connection
        │   └── cloudinary.js
        ├── models/
        │   ├── User.js
        │   ├── Assignment.js
        │   ├── Payment.js
        │   ├── Chat.js
        │   └── Notification.js
        ├── controllers/
        │   ├── authController.js
        │   ├── assignmentController.js
        │   ├── paymentController.js
        │   ├── chatController.js
        │   └── adminController.js
        ├── routes/
        │   ├── auth.js
        │   ├── assignments.js
        │   ├── payments.js
        │   ├── chat.js
        │   ├── admin.js
        │   ├── users.js
        │   ├── notifications.js
        │   └── uploads.js
        ├── middleware/
        │   ├── auth.js           # JWT protect
        │   ├── errorHandler.js
        │   └── upload.js         # Multer + Cloudinary
        ├── socket/
        │   └── socketHandler.js  # Socket.io events
        └── utils/
            ├── logger.js         # Winston
            ├── email.js          # Nodemailer
            ├── aiValidation.js   # OpenAI integration
            ├── activityLogger.js
            └── seeder.js         # DB seeder
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Cloudinary account
- OpenAI API key (optional, for AI validation)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/promptment.git
cd promptment

# Install all dependencies
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Test Credentials

| Role       | Email                    | Password      |
|------------|--------------------------|---------------|
| Admin      | admin@promptment.app     | Admin@123456  |
| Student 1  | student1@test.com        | Test@123456   |
| Student 2  | student2@test.com        | Test@123456   |
| Executor 1 | executor1@test.com       | Test@123456   |
| Executor 2 | executor2@test.com       | Test@123456   |
| Executor 3 | executor3@test.com       | Test@123456   |

---

## 🔌 API Reference

### Auth
| Method | Endpoint                     | Access  |
|--------|------------------------------|---------|
| POST   | /api/auth/register           | Public  |
| POST   | /api/auth/login              | Public  |
| GET    | /api/auth/me                 | Private |
| POST   | /api/auth/forgot-password    | Public  |
| POST   | /api/auth/reset-password     | Public  |
| POST   | /api/auth/refresh            | Public  |

### Assignments
| Method | Endpoint                          | Access          |
|--------|-----------------------------------|-----------------|
| GET    | /api/assignments                  | Authenticated   |
| POST   | /api/assignments                  | Student         |
| GET    | /api/assignments/my               | Student         |
| GET    | /api/assignments/:id              | Authenticated   |
| POST   | /api/assignments/:id/apply        | Executor        |
| POST   | /api/assignments/:id/accept       | Student         |
| PUT    | /api/assignments/:id/start        | Executor        |
| POST   | /api/assignments/:id/submit       | Executor        |
| POST   | /api/assignments/:id/approve      | Student/Admin   |
| POST   | /api/assignments/:id/reject       | Student/Admin   |

### Payments
| Method | Endpoint                          | Access    |
|--------|-----------------------------------|-----------|
| POST   | /api/payments/escrow              | Student   |
| POST   | /api/payments/:id/confirm         | Admin     |
| POST   | /api/payments/:id/release         | Admin     |
| GET    | /api/payments/transactions        | Auth      |
| GET    | /api/payments/wallet              | Auth      |
| POST   | /api/payments/withdraw            | Auth      |

### Admin
| Method | Endpoint                          | Access  |
|--------|-----------------------------------|---------|
| GET    | /api/admin/stats                  | Admin   |
| GET    | /api/admin/users                  | Admin   |
| PUT    | /api/admin/users/:id/ban          | Admin   |
| GET    | /api/admin/approvals              | Admin   |
| POST   | /api/admin/assignments/:id/approve| Admin   |
| GET    | /api/admin/payments               | Admin   |
| GET    | /api/admin/logs                   | Admin   |

---

## 💳 Payment Flow

### Digital Assignments
```
Student deposits → Escrow held → Executor works →
AI validates → Admin approves → Payment released (95%)
Platform fee: 5%
```

### Physical Assignments
```
Student & executor meet → Executor marks complete →
Student confirms → 5% commission deducted from executor wallet
```

---

## 🤖 AI Validation

After work submission, the system automatically:
1. Sends content to OpenAI GPT-4o-mini
2. Gets plagiarism score (0–100, lower = better)
3. Gets AI content score (0–100, lower = more human)
4. Assignment **passes** if: plagiarism < 15% AND human score > 60%
5. Admin reviews report before final approval

---

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcryptjs (12 rounds)
- Role-based route protection
- Rate limiting (200 req/15min global, 20 req/15min auth)
- MongoDB query sanitization
- Helmet.js security headers
- CORS protection
- File type validation

---

## 📱 UI/UX

- **Design**: Glassmorphism + dark/light mode
- **Typography**: Syne (display) + DM Sans (body)
- **Colors**: Brand violet-indigo gradient
- **Animations**: Framer Motion + CSS keyframes
- **Mobile-first**: Fully responsive, drawer navigation

---

## 📄 License

MIT © 2024 Promptment
