# Onboarding Guide: Residency Determination Mini System

## 🎯 Project Overview

This is a **full-stack TypeScript chatbot application** that helps UC Riverside students determine their residency status for tuition purposes. It's a demo system that simulates a realistic Student Information System workflow, combining:

- **Automated rule-based decision logic** (deterministic residency rules)
- **AI-generated explanations** (GPT-4o-mini for natural language)
- **SQLite data persistence** (audit trail of all decisions)
- **Modern React chat UI** (conversational interface)
- **Production-grade CI/CD** (automated testing and deployment)

**Important**: This is a demo system only and does not provide official residency determination.

---

## 🏗️ Architecture Overview

### High-Level Flow

```
User → React Chat UI → Express API → Decision Engine + AI → SQLite DB
                                    ↓
                              Decision Response → Chat UI
```

### Tech Stack

**Frontend** (Vercel)
- React 19 + TypeScript
- Vite (build tool)
- Custom chat UI components
- State machine pattern for conversation flow
- Vitest + Playwright for testing

**Backend** (Render)
- Node.js + Express 5
- TypeScript
- SQLite (better-sqlite3) for persistence
- OpenAI API (GPT-4o-mini) for AI explanations
- Zod for input validation
- Jest + Supertest for testing

**Database**
- SQLite (file-based, perfect for demos)
- Single table: `decision_records` (stores all decision history)

---

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point
│   │   ├── routes/
│   │   │   └── decision.route.ts # POST /api/decision endpoint
│   │   ├── core/
│   │   │   ├── decision.ts       # Core residency determination logic
│   │   │   ├── explain.ts        # System-generated explanations
│   │   │   └── types.ts          # Zod schemas + TypeScript types
│   │   ├── services/
│   │   │   ├── decision-compute.service.ts  # Orchestrates decision + explanations
│   │   │   └── decision-record.service.ts  # Database persistence layer
│   │   ├── ai.ts                 # OpenAI integration
│   │   ├── db.ts                 # SQLite setup + migrations
│   │   └── persistence.ts       # Database CRUD operations
│   └── tests/
│       ├── unit/                 # Jest unit tests
│       └── api/                  # Supertest API tests
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Root component (renders ChatPage)
│   │   ├── components/
│   │   │   ├── ChatPage.tsx      # Main chat container
│   │   │   ├── MessageList.tsx   # Renders chat messages
│   │   │   ├── ChatInputBar.tsx  # Input field + send button
│   │   │   └── DecisionCard.tsx  # Displays decision results
│   │   ├── hooks/
│   │   │   └── useChatStateMachine.ts  # Conversation state management
│   │   ├── api/
│   │   │   └── decisionApi.ts    # Backend API client
│   │   ├── utils/
│   │   │   └── decisionHelpers.ts  # Pure helper functions
│   │   └── types/                # TypeScript type definitions
│   └── tests/
│       ├── unit/                 # Vitest component/utility tests
│       └── ui/                   # Playwright E2E tests
```

---

## 🔄 Core Workflow

### 1. **User Interaction Flow**

The conversation follows a state machine pattern:

```
welcome → askAge → askMonths → askCADriver → askVote → askTax → evaluating → done
```

**Questions asked:**
1. Age (number)
2. Months in California (number)
3. Has CA driver's license? (yes/no)
4. Registered to vote in CA? (yes/no)
5. Files CA taxes? (yes/no)

After the last question, the system calls the backend API and displays a decision card.

### 2. **Backend Decision Logic**

Located in `backend/src/core/decision.ts`:

**Residency Rules:**
- **Resident**: 12+ months in CA AND 2+ California ties (driver's license, voter registration, tax filing)
- **Nonresident**: < 6 months in CA OR < 2 California ties
- **Needs Review**: Everything else (6-12 months with 2+ ties)

**California Ties** (counted):
- CA driver's license/state ID
- Registered to vote in CA
- Files CA state taxes

### 3. **Explanation Generation**

Two types of explanations are generated:

1. **System Explanation** (`core/explain.ts`): Deterministic, rule-based explanation
2. **AI Explanation** (`ai.ts`): GPT-4o-mini generates natural language explanation (optional, can fail gracefully)

### 4. **Data Persistence**

Every decision is saved to SQLite (`decision_records` table) with:
- Student input fields
- Decision result (status + reasons)
- System explanation
- AI explanation (if available)
- Timestamp

---

## 🔌 API Endpoints

### `POST /api/decision`

**Request Body:**
```typescript
{
  age: number;
  monthsInCA: number;
  hasCADriverLicense: boolean;
  registeredToVoteInCA: boolean;
  filesCATaxes: boolean;
}
```

**Query Parameters:**
- `explain` (default: `true`) - Include explanations in response

**Response:**
```typescript
{
  decision: {
    status: 'resident' | 'nonresident' | 'needs_review';
    reasons: string[];
  };
  explanations?: string;        // System explanation
  aiExplanation?: string;        // AI-generated explanation
}
```

### `GET /health` & `GET /api/health`

Health check endpoints for deployment monitoring.

---

## 🧪 Testing Strategy

### Backend Tests (Jest)

- **Unit Tests** (`tests/unit/`): Test core decision logic and explanation generation
- **API Tests** (`tests/api/`): Test Express routes with Supertest

Run: `npm run test:unit` or `npm run test:api` (from `backend/`)

### Frontend Tests

- **Unit Tests** (Vitest): Component and utility function tests
- **E2E Tests** (Playwright): Full browser-based user interaction tests

Run: `npm run test:unit` or `npm run test:ui` (from `frontend/`)

### CI/CD Pipeline

GitHub Actions runs all tests on:
- Every pull request
- Every push to `main` (then deploys if tests pass)

---

## 🚀 Deployment

### Frontend (Vercel)
- Automatically deploys from `main` branch
- Uses `VITE_API_BASE_URL` environment variable to target backend
- Global CDN for fast static asset delivery

### Backend (Render)
- Deploys as a Web Service
- Builds with `npm run build`, runs with `npm start`
- Requires `OPENAI_API_KEY` environment variable for AI explanations
- SQLite database file persists on the server

---

## 💻 Development Workflow

### Local Setup

**Backend:**
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173 (default Vite port)
```

**Environment Variables:**

Backend (`.env`):
- `PORT` (optional, defaults to 3000)
- `OPENAI_API_KEY` (required for AI explanations)
- `DB_PATH` (optional, defaults to `rds.db`)

Frontend (`.env`):
- `VITE_API_BASE_URL` (defaults to `http://localhost:3000`)

### Running Tests

**Backend:**
```bash
cd backend
npm run test:unit    # Unit tests
npm run test:api     # API tests
npm test             # All tests
```

**Frontend:**
```bash
cd frontend
npm run test:unit    # Vitest unit tests
npm run test:ui      # Playwright E2E tests
```

---

## 🔑 Key Concepts

### State Machine Pattern

The frontend uses a state machine (`useChatStateMachine`) to manage conversation flow. Each step corresponds to a question, and the state transitions are explicit and predictable.

### Separation of Concerns

- **Core Logic** (`core/`): Pure functions, no side effects
- **Services** (`services/`): Business logic orchestration
- **Routes** (`routes/`): HTTP request handling
- **Persistence** (`persistence.ts`): Database operations

### Error Handling

- Input validation uses Zod schemas (returns 400 on invalid input)
- AI explanation failures are non-blocking (system explanation always available)
- Database write failures are logged but don't fail the request

### Type Safety

The codebase is fully typed with TypeScript. Shared types are defined in:
- `backend/src/core/types.ts` (Zod schemas + TypeScript types)
- `frontend/src/types/` (frontend-specific types)

---

## 🐛 Common Issues & Solutions

1. **AI explanations not working**: Check `OPENAI_API_KEY` is set in backend `.env`
2. **Frontend can't reach backend**: Verify `VITE_API_BASE_URL` points to correct backend URL
3. **Database errors**: Ensure SQLite file has write permissions
4. **Tests failing**: Make sure all dependencies are installed (`npm install` in both directories)

---

## 📚 Next Steps for New Engineers

1. **Run the app locally** - Get both frontend and backend running
2. **Read the core decision logic** - Understand `backend/src/core/decision.ts`
3. **Trace a request** - Follow a decision request from UI → API → DB
4. **Run the tests** - Understand what's being tested
5. **Make a small change** - Try modifying a question or adding a new field
6. **Review the CI/CD pipeline** - Check `.github/workflows/cicd.yml` (if present)

---

## 📝 Code Style & Patterns

- **TypeScript strict mode** enabled
- **Functional programming** preferred (pure functions where possible)
- **Explicit error handling** (no silent failures)
- **Comprehensive comments** for complex logic
- **Consistent naming**: camelCase for variables, PascalCase for types/components

---

## 🔗 Related Documentation

- See `README.md` for deployment architecture and CI/CD details
- Check test files for usage examples
- Review type definitions for API contracts

---

**Questions?** Check the code comments or review the test files for examples of how components are used.
