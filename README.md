# Residency Determination Mini System (RDS Assistant)

An interactive **Residency Determination chatbot** for UC Riverside,
built with a modern **full-stack TypeScript** architecture.\
This project demonstrates a realistic academic workflow for evaluating
residency status using automated logic, clean UI design, and
production-style engineering patterns.

Designed as a portfolio-quality project with:

- **React + State Machine chatbot UI**
- **Express + Zod decision engine**
- **Vitest + React Testing Library unit tests**
- **Playwright end-to-end UI automation**
- **Full CI pipeline (GitHub Actions)**

## 🌟 Demo Preview

Chatbot Interaction

---

<img src="docs/ui-preview.png" width="500">

## 🔧 Tech Stack

### **Frontend**

- React + TypeScript
- Vite
- State Machine (custom hook)
- React Testing Library (RTL)
- Vitest
- Playwright (UI automation)

### **Backend**

- Express.js (TypeScript)
- Zod validation
- Jest + Supertest

### **CI Pipeline**

- GitHub Actions (unit, API, UI tests)

## 📁 Directory Structure
```
.
├── backend/
│ ├── src/
│ │ ├── core/ # Decision logic, explanation engine
│ │ ├── routes/ # Express routes
│ │ └── index.ts # Express app entry
│ └── tests/ # Jest unit & API test suites
│
├── frontend/
│ ├── src/
│ │ ├── components/ # React UI components
│ │ ├── hooks/ # useChatStateMachine
│ │ ├── constants/ # Shared constants
│ │ └── App.tsx
│ └── tests/ # Vitest unit tests & # Playwright UI tests
│
├── .github/workflows/
│ └── ci.yml # Consolidated CI pipeline
│
└── README.md
```

## 🧠 Core Features

- Automated residency decision engine\
- Explainable decisions\
- ChatGPT-style guided user flow\
- Frontend state machine\
- Full-stack test coverage\
- CI automation

## 🧪 Testing

### Backend

    npm run test

### Frontend Unit Tests

    npm run test:unit

### Playwright UI Tests

    npm run test:ui

## ▶️ Running Locally

**Backend**

    cd backend
    npm install
    npm run dev

**Frontend**

    cd frontend
    npm install
    npm run dev

## 👤 Author

Chaoran (Shaobangzhu)

Demo only --- not official residency determination.
