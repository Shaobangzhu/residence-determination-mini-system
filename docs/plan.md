# Project Upgrade Plan

## 1. Current Project Status

This project is currently a full-stack TypeScript residency determination assistant with a React frontend and an Express backend.

### Current architecture

```text
Frontend: React + Vite + TypeScript
Backend: Node.js + Express + TypeScript
Database: SQLite via better-sqlite3
AI integration: OpenAI API
Testing: Jest, Supertest, Vitest, Playwright
Deployment: Vercel frontend + Render backend
CI/CD: GitHub Actions
```

### Current strengths

- The frontend and backend are already separated cleanly.
- The decision logic is isolated under `backend/src/core`, which makes it testable and portable.
- The AI explanation feature is separated from deterministic decision logic, so AI failure does not block the core decision response.
- SQLite persistence is encapsulated behind `persistence.ts` and `decision-record.service.ts`, which makes database migration easier.
- Existing tests cover backend unit/API behavior, frontend utilities/components, and browser-level UI flow.
- The project already has CI/CD and deployment documentation, which gives it a stronger interview story than a simple CRUD demo.

### Current limitations

- The backend uses Express directly, so the architecture is still relatively lightweight for a production-style backend.
- SQLite is suitable for a demo, but less aligned with a MERN interview target.
- The app currently focuses mostly on submitting one residency decision, with limited read/history/admin workflows.
- There is no authentication or role-based access control yet.
- There is no formal MongoDB data model, indexing strategy, or admin reporting workflow.
- Error handling, configuration validation, logging, and observability can be made more production-grade.

## 2. Target State

The target version should become a portfolio-grade, MERN-inspired full-stack project:

```text
Frontend: React + Vite + TypeScript
Backend: NestJS + TypeScript
Database: MongoDB Atlas + Mongoose
Runtime: Node.js
API style: REST
Auth: JWT-based authentication and role-based access control
Testing: Unit, integration, API, and E2E tests
Deployment: Vercel frontend + Render backend + MongoDB Atlas
CI/CD: GitHub Actions
```

Strictly speaking, replacing Express route handlers with NestJS means the project is no longer a classic "Express app" at the application-code level. However, NestJS can run on the Express adapter under the hood, so the project can be presented as:

> A MERN-inspired full-stack application with a NestJS backend running on Node.js and Express under the hood.

This is a reasonable and interview-friendly positioning because many employers care more about Node.js, MongoDB, API design, testing, and deployment skills than whether every route is handwritten in Express.

## 3. Proposed Backend Target Architecture

Recommended NestJS backend structure:

```text
backend/
  src/
    main.ts
    app.module.ts

    health/
      health.controller.ts

    decision/
      decision.module.ts
      decision.controller.ts
      decision.service.ts
      dto/
        create-decision.dto.ts
      schemas/
        decision-record.schema.ts

    residency/
      residency.module.ts
      residency.service.ts
      residency.types.ts

    ai/
      ai.module.ts
      ai.service.ts

    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      guards/
      strategies/
      dto/

    users/
      users.module.ts
      users.service.ts
      schemas/
        user.schema.ts

    common/
      filters/
      interceptors/
      pipes/
      decorators/
```

### Responsibility split

- `DecisionController`: HTTP API endpoints such as submit decision, list decisions, get decision detail, and get stats.
- `DecisionService`: application orchestration for validation, decision computation, AI explanation, and persistence.
- `ResidencyService`: deterministic residency rule engine.
- `AiService`: OpenAI API integration and fallback behavior.
- `DecisionRecord` schema: MongoDB persistence model.
- `AuthModule`: JWT login, registration, guards, and role checks.
- `CommonModule`: shared exception handling, logging, validation, and response utilities.

## 4. Proposed MongoDB Data Model

### Decision record

```ts
{
  input: {
    age: number,
    monthsInCA: number,
    hasCADriverLicense: boolean,
    registeredToVoteInCA: boolean,
    filesCATaxes: boolean
  },
  decision: {
    status: "resident" | "nonresident" | "needs_review",
    reasons: string[]
  },
  explanations: {
    system: string,
    ai?: string
  },
  createdBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### User

```ts
{
  email: string,
  passwordHash: string,
  name: string,
  role: "student" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### Recommended indexes

- `decision.status`
- `createdAt`
- `createdBy`
- `email` as a unique index for users

## 5. API Target Scope

### Public/system endpoints

- `GET /api/health`

### Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Decision endpoints

- `POST /api/decision`
- `GET /api/decisions`
- `GET /api/decisions/:id`
- `GET /api/decisions/stats`
- `DELETE /api/decisions/:id` for admin users only

### Frontend workflows

- Student submits a residency decision request.
- Student can view their own previous decision records.
- Admin can view all decision records.
- Admin can filter by status/date and view aggregate stats.

## 6. Phase Plan and Time Estimate

The estimate assumes part-time work while preparing for interviews. A focused full-time schedule can compress the timeline.

### Phase 0: Planning and Baseline Audit

Estimated time: 0.5 to 1 day

Goals:

- Confirm target architecture.
- List existing API behavior that must remain compatible.
- Decide whether to migrate in place or create a fresh NestJS backend folder.
- Document environment variables and deployment assumptions.

Deliverables:

- Finalized migration plan.
- Current API contract snapshot.
- Initial task list.

### Phase 1: NestJS Backend Foundation

Estimated time: 1 to 2 days

Goals:

- Replace the Express backend entrypoint with NestJS.
- Recreate existing health endpoints.
- Recreate `POST /api/decision`.
- Keep existing deterministic decision logic intact.
- Keep OpenAI explanation behavior intact.

Deliverables:

- NestJS app bootstrapped in `backend`.
- `AppModule`, `DecisionModule`, `ResidencyModule`, `AiModule`, and `HealthController`.
- Existing frontend still able to submit a decision request.

Notes:

- This phase should avoid adding MongoDB and auth at the same time.
- The goal is to prove that the Express-to-Nest migration works first.

### Phase 2: MongoDB and Mongoose Migration

Estimated time: 1 to 2 days

Goals:

- Add MongoDB Atlas connection.
- Replace SQLite persistence with Mongoose.
- Create `DecisionRecord` schema.
- Convert persistence flow to async.
- Remove `better-sqlite3` dependency after the migration is verified.

Deliverables:

- MongoDB-backed decision record persistence.
- `MONGODB_URI` environment variable documented.
- Backend tests updated for async persistence.

Notes:

- Store `reasons` as an array, not as JSON string.
- Use Mongoose timestamps instead of manually setting `created_at`.

### Phase 3: Decision History and Admin APIs

Estimated time: 2 to 3 days

Goals:

- Add decision history APIs.
- Add pagination, sorting, and filtering.
- Add stats aggregation endpoint.
- Improve API response consistency.

Deliverables:

- `GET /api/decisions`
- `GET /api/decisions/:id`
- `GET /api/decisions/stats`
- Query support for `status`, `page`, `limit`, and date range.

Notes:

- This phase turns the project from a one-shot chatbot into a real data-backed application.
- This is one of the most valuable phases for interviews.

### Phase 4: Authentication and Authorization

Estimated time: 2 to 4 days

Goals:

- Add JWT authentication.
- Add user registration/login.
- Add role-based authorization for student and admin workflows.
- Associate decision records with users.

Deliverables:

- `AuthModule`
- `UsersModule`
- JWT strategy and guards.
- Role guard for admin-only endpoints.
- Frontend login/session state.

Notes:

- Use password hashing with bcrypt or argon2.
- Keep demo credentials documented for interview demos.

### Phase 5: Frontend Upgrade for Real Workflows

Estimated time: 3 to 5 days

Goals:

- Add authenticated app shell.
- Add decision history page.
- Add admin dashboard.
- Add loading, error, empty, and unauthorized states.
- Keep the chatbot flow as the main student-facing workflow.

Deliverables:

- Login/register views.
- Student decision history.
- Admin decision table.
- Decision detail view.
- Stats summary UI.

Notes:

- Avoid making the app look like a marketing site.
- Prioritize operational clarity: filters, tables, status badges, and concise detail panels.

### Phase 6: Testing and CI/CD Hardening

Estimated time: 2 to 3 days

Goals:

- Update backend tests to use Nest testing utilities.
- Add service tests for residency logic and decision orchestration.
- Add API/e2e tests for auth and decision history.
- Update Playwright tests for the new authenticated flows.
- Update GitHub Actions for MongoDB test support.

Deliverables:

- NestJS unit tests.
- API integration tests.
- Frontend component tests.
- Playwright E2E tests.
- CI passing with MongoDB support.

Notes:

- For CI, use either `mongodb-memory-server` or a GitHub Actions MongoDB service.
- Mock OpenAI in automated tests.

### Phase 7: Redis Performance and Reliability Enhancement

Estimated time: 1 to 2 days

Goals:

- Add Redis only after the main NestJS, MongoDB, auth, and admin workflows are stable.
- Use Redis for one or two concrete backend concerns instead of adding it as a decorative technology.
- Improve API performance, cost control, and abuse protection.

Recommended Redis use cases:

- Cache AI explanations by normalized decision input and decision result.
- Add TTL-based caching, such as 24 hours, to avoid repeated OpenAI calls for identical evaluations.
- Add rate limiting for high-cost endpoints such as `POST /api/decision`.
- Optionally cache admin dashboard stats if aggregation becomes expensive.

Deliverables:

- Redis connection module.
- AI explanation cache service.
- Cache key design documented.
- TTL behavior documented.
- Rate limit configuration for decision submission.
- Tests for cache hit, cache miss, and fallback behavior.

Notes:

- Redis should not be introduced before MongoDB and auth are stable.
- The best interview story is not "I added Redis"; it is "I used Redis to reduce repeated AI cost and protect an expensive endpoint."
- Keep the feature small and measurable.

### Phase 8: Production Polish and Interview Packaging

Estimated time: 2 to 4 days

Goals:

- Improve README.
- Update architecture diagrams.
- Add API documentation.
- Add deployment guide.
- Add tradeoff notes explaining Express/SQLite to NestJS/MongoDB migration.
- Prepare interview talking points.

Deliverables:

- Updated README.
- Updated docs diagrams.
- Environment variable guide.
- API contract table.
- Demo script.
- Interview talking-points document.

## 7. Overall Timeline

### Minimum viable upgrade

Estimated time: 5 to 8 days

Includes:

- NestJS migration.
- MongoDB persistence.
- Existing decision API preserved.
- Basic tests updated.
- README updated.

### Strong interview-ready version

Estimated time: 2 to 3 weeks part-time

Includes:

- NestJS backend.
- MongoDB/Mongoose.
- Decision history APIs.
- Admin stats APIs.
- Authentication and authorization.
- Frontend history/admin workflows.
- Solid test coverage.
- Updated documentation.

### Portfolio-grade version

Estimated time: 3 to 5 weeks part-time

Includes:

- Everything in the interview-ready version.
- Redis caching and rate limiting for selected backend workflows.
- Strong UI polish.
- Better observability/logging.
- More realistic residency domain fields.
- File/document metadata workflow.
- More complete deployment and demo story.

## 8. Recommended Execution Strategy

The recommended path is:

1. Migrate Express to NestJS first.
2. Add MongoDB second.
3. Add history/admin APIs third.
4. Add auth fourth.
5. Upgrade frontend workflows fifth.
6. Harden tests and CI/CD sixth.
7. Add Redis caching/rate limiting seventh.
8. Polish documentation and interview packaging last.

This order keeps the project working after each phase and avoids mixing too many moving parts at once.

## 9. Interview Positioning

This project should be presented as:

> A production-oriented residency determination assistant built with React, NestJS, MongoDB, and Node.js. It combines deterministic business rules, AI-generated explanations, persistent audit history, role-based access, and CI/CD deployment.

Strong interview themes:

- Migrating from a lightweight Express/SQLite prototype to a modular NestJS/MongoDB backend.
- Keeping deterministic business logic separate from AI-generated explanations.
- Designing MongoDB schemas around audit-friendly decision records.
- Building secure role-based workflows for students and admins.
- Testing backend logic, API behavior, frontend components, and end-to-end user flows.
- Deploying a separated frontend/backend architecture with CI/CD.
- Using Redis selectively for AI cost control, endpoint protection, and performance.

## 10. Future Improvements

### GraphQL

GraphQL is not recommended for the main migration because the current API shape is a good fit for REST:

- Submit a decision.
- View decision history.
- View one decision record.
- View admin stats.
- Authenticate users.

GraphQL can be considered later if the product grows into more complex data access patterns, such as:

- Multiple clients, such as web, mobile, and advisor portal.
- Flexible admin dashboards that query nested user, decision, evidence, and advisor data.
- Complex filtering and partial-field selection requirements.
- Aggregating several backend data sources behind one API.

Recommended future GraphQL scope:

- Add a separate `/graphql` endpoint while keeping REST APIs stable.
- Start with read-heavy queries for decision records, users, and dashboard stats.
- Avoid moving login and simple command-style mutations to GraphQL unless there is a clear product need.
- Document why REST remains the default API style and why GraphQL is optional.

## 11. Key Risks and Mitigations

### Risk: Migration becomes a full rewrite

Mitigation:

- Keep the existing decision logic intact during the NestJS migration.
- Preserve the existing frontend API contract until the backend is stable.

### Risk: MongoDB integration breaks tests

Mitigation:

- Mock OpenAI.
- Use a test database or `mongodb-memory-server`.
- Keep database tests separate from pure business logic tests.

### Risk: Auth delays the core migration

Mitigation:

- Add auth only after NestJS and MongoDB are stable.
- Keep decision submission working without auth during early migration phases if needed.

### Risk: Redis adds infrastructure complexity without enough value

Mitigation:

- Add Redis only for concrete use cases such as AI explanation caching and rate limiting.
- Keep the first Redis feature small and easy to explain.
- Make the app continue working if Redis is temporarily unavailable.

### Risk: GraphQL becomes resume-driven architecture

Mitigation:

- Keep GraphQL in Future Improvements until REST becomes limiting.
- Introduce it only for read-heavy, nested, or multi-client query needs.
- Avoid replacing stable REST endpoints without a clear reason.

### Risk: Project becomes too large for interview demos

Mitigation:

- Prepare a short demo path:
  1. Login.
  2. Submit a residency decision.
  3. View AI/system explanation.
  4. Open history.
  5. Show admin stats.
  6. Briefly explain backend architecture and tests.

## 12. Suggested Definition of Done

The upgraded project can be considered interview-ready when:

- The backend runs on NestJS.
- MongoDB stores decision records.
- The frontend can submit and view decision history.
- At least one admin workflow exists.
- Auth and role-based access are working.
- Redis is used for a small, justified performance or reliability feature if targeting the portfolio-grade version.
- CI passes backend, frontend, and E2E tests.
- README clearly explains architecture, setup, testing, deployment, and tradeoffs.
- You can demo the project in under 5 minutes and explain the architecture in under 2 minutes.
