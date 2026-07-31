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
Deployment: Vercel frontend + Render backend + MongoDB Atlas for POC; AWS for production-grade portfolio deployment
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

Estimated time: 0.5 to 1.5 days

Goals:

- Confirm target architecture.
- List existing API behavior that must remain compatible.
- Decide whether to migrate in place or create a fresh NestJS backend folder.
- Document environment variables and deployment assumptions.
- Set up GitHub Projects as the project management system for the upgrade.
- Convert each phase into an Epic and break each Epic into trackable Tasks, Bugs, Chores, and Docs work items.
- Set up the GitHub Wiki as the long-form project knowledge base.

Deliverables:

- Finalized migration plan.
- Current API contract snapshot.
- Initial task list.
- GitHub Projects workflow with Kanban and Archived boards.
- Epic-level project structure matching the upgrade phases.
- Initial GitHub Wiki home page and documentation outline.

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

### Phase 5: UI/UX Design and Productization in Figma

Estimated time: 2 to 4 days

Goals:

- Convert rough ChatGPT-generated sketches and product ideas into editable, maintainable Figma files.
- Define the user flows before implementing the upgraded frontend.
- Create a design foundation that can support future features without turning the UI into ad hoc screens.
- Simulate a more realistic company workflow: product idea -> design exploration -> design system -> frontend implementation -> test coverage.
- Make the project easier to demo and explain as a serious product, not only a technical prototype.

Recommended Figma scope:

- Information architecture for student and admin workflows.
- User flow diagrams for login, decision submission, decision history, admin review, and stats dashboard.
- Low-fidelity wireframes for key pages.
- High-fidelity mockups for the main flows.
- Component library for buttons, inputs, status badges, tables, modals/drawers, navigation, and cards.
- Design tokens for color, typography, spacing, and status states.
- Responsive layouts for desktop and mobile.
- Empty, loading, error, unauthorized, and success states.

Deliverables:

- Figma project file.
- Product flow map.
- UI component library.
- Page-level mockups for student and admin workflows.
- Responsive design variants.
- Basic design system documentation.
- Implementation checklist for the frontend upgrade.

Notes:

- This phase should happen before the frontend rebuild so React implementation follows a clear product direction.
- Figma does not need to become over-designed; the goal is clarity, maintainability, and realistic product workflow.
- The interview story should be: "I translated AI-assisted rough ideas into a structured product design system before implementation."
- This phase strengthens future feature expansion because new workflows can reuse existing design tokens and components.

### Phase 6: Frontend Upgrade for Real Workflows

Estimated time: 3 to 5 days

Goals:

- Add authenticated app shell.
- Add decision history page.
- Add admin dashboard.
- Add loading, error, empty, and unauthorized states.
- Keep the chatbot flow as the main student-facing workflow.
- Implement the upgraded frontend from the Figma design system and page mockups.

Deliverables:

- Login/register views.
- Student decision history.
- Admin decision table.
- Decision detail view.
- Stats summary UI.
- Frontend components aligned with the Figma component library.

Notes:

- Avoid making the app look like a marketing site.
- Prioritize operational clarity: filters, tables, status badges, and concise detail panels.
- Keep implementation consistent with the design tokens and reusable components defined in Phase 5.

### Phase 7: Testing, Quality Reporting, and CI/CD Hardening

Estimated time: 3 to 4 days

Goals:

- Update backend tests to use Nest testing utilities.
- Add service tests for residency logic and decision orchestration.
- Add API/e2e tests for auth and decision history.
- Update Playwright tests for the new authenticated flows.
- Update GitHub Actions for MongoDB test support.
- Add Allure Report to visualize the testing workflow and quality signals.
- Make the test framework an explicit portfolio strength, not just a hidden CI detail.
- Show that the project is supported by an industry-style quality gate across backend, frontend, API, and E2E layers.

Deliverables:

- NestJS unit tests.
- API integration tests.
- Frontend component tests.
- Playwright E2E tests.
- Allure Report configuration for relevant test layers.
- Allure artifacts generated in CI.
- GitHub Actions workflow step to publish or upload Allure results.
- Test result history if using GitHub Pages or a similar static report target.
- Test categories or labels that separate backend unit, API integration, frontend unit, and E2E coverage.
- CI passing with MongoDB support.

Notes:

- For CI, use either `mongodb-memory-server` or a GitHub Actions MongoDB service.
- Mock OpenAI in automated tests.
- Allure should make the quality workflow visible: what was tested, what failed, how long it took, and which layer failed.
- This phase should highlight the owner's SDET background: the same engineer can build frontend, backend, AI integration, CI/CD, and a maintainable test framework.
- The interview story should be: "I do not only deliver features; I build the quality system that keeps delivery stable."

### Phase 8: Redis Performance and Reliability Enhancement

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

### Phase 9: AWS Production Deployment Migration

Estimated time: 3 to 5 days

Goals:

- Keep Vercel + Render as the fast proof-of-concept deployment path.
- Add an AWS deployment path that is more interview-grade and closer to production infrastructure.
- Show that the project can be deployed beyond platform-as-a-service defaults.
- Document the tradeoffs between POC deployment and cloud production deployment.

Recommended AWS target architecture:

```text
Frontend:
  React build -> S3 static website bucket -> CloudFront CDN

Backend:
  NestJS API -> Docker image -> ECS Fargate service
  Alternative simpler path: Elastic Beanstalk Node.js environment

Database:
  MongoDB Atlas
  Alternative AWS-native option: Amazon DocumentDB, only if compatibility tradeoffs are acceptable

Secrets/config:
  AWS Systems Manager Parameter Store or AWS Secrets Manager

Networking:
  VPC
  Public Application Load Balancer
  Private ECS tasks where possible
  Security groups for controlled inbound traffic

CI/CD:
  GitHub Actions -> build/test -> Docker image -> ECR -> ECS deploy
  GitHub Actions -> frontend build -> S3 sync -> CloudFront invalidation

Observability:
  CloudWatch logs
  Health checks
  Basic alarms for backend availability
```

Recommended implementation path:

1. Containerize the NestJS backend with a production Dockerfile.
2. Push backend images to Amazon ECR.
3. Deploy the backend to ECS Fargate behind an Application Load Balancer.
4. Store `MONGODB_URI`, `OPENAI_API_KEY`, JWT secrets, and Redis config in Parameter Store or Secrets Manager.
5. Build the React frontend and deploy static assets to S3.
6. Put CloudFront in front of the S3 frontend.
7. Configure frontend environment variables to call the AWS backend URL.
8. Add CloudWatch logging for the backend service.
9. Update GitHub Actions to support AWS deployment.
10. Document rollback steps and environment setup.

Deliverables:

- Backend Dockerfile.
- ECR repository.
- ECS Fargate service or Elastic Beanstalk environment.
- Application Load Balancer endpoint for the backend.
- S3 bucket for frontend hosting.
- CloudFront distribution.
- GitHub Actions deployment workflow for AWS.
- AWS environment variable and secrets documentation.
- Updated architecture diagram showing both POC and AWS deployment paths.

Notes:

- ECS Fargate is more impressive and closer to real production infrastructure.
- Elastic Beanstalk is simpler and still valid if time is limited.
- MongoDB Atlas can remain the database provider because it is common in MERN projects and avoids DocumentDB compatibility surprises.
- AWS deployment should be added after the application architecture is stable. Do not combine it with the NestJS/MongoDB migration in the same phase.
- The interview story should focus on why Vercel + Render were useful for quick validation and why AWS was added for production-grade deployment experience.

### Phase 10: Production Polish and Interview Packaging

Estimated time: 2 to 4 days

Goals:

- Improve README.
- Update architecture diagrams.
- Add API documentation.
- Add deployment guide.
- Add tradeoff notes explaining Express/SQLite to NestJS/MongoDB migration.
- Prepare interview talking points.
- Polish GitHub Wiki pages so the project has a clear public knowledge base.

Deliverables:

- Updated README.
- Updated docs diagrams.
- Environment variable guide.
- API contract table.
- Demo script.
- Interview talking-points document.
- Published GitHub Wiki pages for architecture, setup, roadmap, testing, deployment, and demo guidance.

### Vibe Coding Execution Roadmap

This roadmap turns the larger upgrade plan and `docs/rough.chatgpt.ui.design.png` into a GitHub Projects-friendly execution track. The goal is to keep the project runnable after each milestone while steadily evolving it from a small chatbot prototype into a complete student/admin MERN-style product.

This track should be used as the day-to-day implementation plan. The broader phase plan above remains the long-term architecture direction, especially for NestJS, Redis, AWS, and interview packaging.

Working principles:

- Build in vertical slices that are visible, testable, and demoable.
- Keep the current `POST /api/decision` contract stable until the new workflows are ready.
- Avoid combining database migration, auth, admin analytics, and frontend redesign in one large change.
- Move one or two major GitHub Project items into `In Progress` at a time.
- Treat each milestone as complete only after code, tests, and docs are updated.

Recommended GitHub Project:

- Project name: `RDS Assistant Product Upgrade`
- Board views:
  - `Kanban`: active delivery work.
  - `Roadmap`: milestones grouped by product phase.
  - `Archive`: closed or no-longer-active work.
- Fields:
  - `Status`: `Todo`, `In Progress`, `Review`, `Done`, `Closed`
  - `Type`: `Epic`, `Task`, `Bug`, `Chore`, `Docs`, `Design`, `Test`
  - `Area`: `Backend`, `Frontend`, `Database`, `Auth`, `Admin`, `CI/CD`, `Docs`, `Design`
  - `Priority`: `P0`, `P1`, `P2`
  - `Milestone`: `M0` through `M7`
  - `Size`: `S`, `M`, `L`

#### M0: Baseline Lock

Goal:

- Freeze the current behavior so the upgrade has a stable reference point.

Recommended GitHub Project items:

- `Epic`: Baseline audit and migration guardrails
- `Task`: Snapshot current `POST /api/decision` request and response contract
- `Task`: Document current frontend chatbot state machine
- `Task`: Identify SQLite-specific files, dependencies, and deployment assumptions
- `Test`: Run and record current backend, frontend, and Playwright test status
- `Docs`: Add migration notes from Express/SQLite prototype to MERN upgrade

Definition of done:

- The current API contract is documented.
- Current test commands and expected results are known.
- SQLite-specific replacement points are listed before implementation begins.

#### M1: MongoDB Migration

Goal:

- Replace SQLite persistence with MongoDB/Mongoose while preserving the existing user-facing decision flow.

Recommended GitHub Project items:

- `Epic`: MongoDB persistence migration
- `Chore`: Add Mongoose dependency and MongoDB configuration
- `Task`: Create `DecisionRecord` Mongoose schema
- `Task`: Replace SQLite decision persistence with MongoDB persistence
- `Task`: Convert decision persistence flow to async
- `Test`: Add MongoDB persistence tests
- `Chore`: Update GitHub Actions for MongoDB test support
- `Docs`: Replace SQLite setup notes with MongoDB Atlas setup notes

Definition of done:

- `POST /api/decision` returns the same response shape as before.
- Decision records are saved to MongoDB.
- CI can run backend tests without depending on a production database.
- `better-sqlite3` can be removed after verification.

#### M2: Auth Foundation

Goal:

- Add the login and role foundation required by the student and admin designs.

Recommended GitHub Project items:

- `Epic`: JWT authentication and role-based access
- `Task`: Create `User` data model
- `Task`: Add login endpoint
- `Task`: Add optional registration or seeded demo users
- `Task`: Add JWT authentication middleware or guards
- `Task`: Add `student` and `admin` roles
- `Test`: Add auth API tests
- `Docs`: Document demo credentials and auth flow

Definition of done:

- Student and admin users can authenticate.
- Backend routes can identify the current user and role.
- Demo credentials are documented for local and interview use.

#### M3: Student Chat Experience

Goal:

- Implement the student-facing experience shown in the rough design: authenticated chat shell, decision card, and chat history.

Recommended GitHub Project items:

- `Epic`: Student residency assistant experience
- `Design`: Convert rough student chat screen into frontend component checklist
- `Task`: Build login screen based on the design direction
- `Task`: Build authenticated student app shell with sidebar
- `Task`: Add new chat and chat history UI
- `Task`: Associate saved decision records with the logged-in student
- `Task`: Render decision card with status, key factors, and disclaimer
- `Test`: Add Playwright student login and decision flow

Definition of done:

- A student can log in, complete a residency flow, receive a decision, and see recent history.
- The UI visually matches the intent of `docs/rough.chatgpt.ui.design.png`.
- Empty, loading, and error states are present for the main flow.

#### M4: Admin Dashboard

Goal:

- Implement the admin management dashboard shown in the rough design.

Recommended GitHub Project items:

- `Epic`: Admin management dashboard
- `Task`: Add admin-only decision listing endpoint
- `Task`: Add filtering by status, date range, and user
- `Task`: Add decision statistics endpoint
- `Task`: Build dashboard metric cards
- `Task`: Build status distribution chart
- `Task`: Build decision trends chart
- `Task`: Build recent decisions table
- `Task`: Build top factors section
- `Test`: Add admin API and UI tests

Definition of done:

- Admin users can view total decisions, status distribution, recent submissions, trends, and top factors.
- Student users cannot access admin-only APIs or pages.
- Dashboard data comes from MongoDB, not hard-coded UI fixtures.

#### M5: Product UI Polish

Goal:

- Turn the upgraded screens into a cohesive product experience rather than a collection of functional pages.

Recommended GitHub Project items:

- `Epic`: Product UI polish
- `Design`: Define reusable UI tokens from the rough design
- `Task`: Standardize layout, spacing, typography, status colors, buttons, badges, and cards
- `Task`: Add responsive desktop and mobile behavior
- `Task`: Add accessible labels and keyboard-friendly flows
- `Task`: Refine loading, empty, unauthorized, and error states
- `Test`: Add visual smoke checks with Playwright screenshots

Definition of done:

- Login, student chat, history, and admin dashboard feel like one coherent product.
- Text does not overflow or overlap on desktop or mobile.
- Core workflows remain fast and easy to demo.

#### M6: CI/CD and Quality

Goal:

- Make the upgraded project reliable enough for pull requests, demos, and deployment.

Recommended GitHub Project items:

- `Epic`: Quality and delivery pipeline
- `Task`: Update backend CI for MongoDB-backed tests
- `Task`: Mock OpenAI consistently in automated tests
- `Task`: Add backend tests for decision, auth, persistence, and admin APIs
- `Task`: Add frontend unit tests for new auth, student, and admin screens
- `Task`: Add Playwright flows for student and admin journeys
- `Docs`: Update testing strategy and CI/CD documentation

Definition of done:

- Pull requests run backend tests, frontend tests, and Playwright E2E tests.
- Tests do not require paid OpenAI calls.
- Test failures clearly identify the failing layer.

#### M7: Portfolio Packaging

Goal:

- Package the finished upgrade so it is easy to understand in interviews.

Recommended GitHub Project items:

- `Epic`: Portfolio launch package
- `Docs`: Rewrite README as upgraded MERN product documentation
- `Docs`: Add architecture overview
- `Docs`: Add MongoDB data model page
- `Docs`: Add API reference
- `Docs`: Add demo script
- `Docs`: Add architecture decision records for major tradeoffs
- `Task`: Update screenshots after the UI upgrade
- `Task`: Confirm production deployment environment variables

Definition of done:

- The project can be demoed in under five minutes.
- The architecture can be explained in under two minutes.
- README, docs, GitHub Project, and screenshots tell the same product story.

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

Estimated time: 2.5 to 3.5 weeks part-time

Includes:

- NestJS backend.
- MongoDB/Mongoose.
- Decision history APIs.
- Admin stats APIs.
- Authentication and authorization.
- Figma-based UI/UX design and product flow planning.
- Frontend history/admin workflows.
- Solid test coverage.
- Allure Report for visualizing backend, frontend, API, and E2E test results.
- Updated documentation.
- Vercel + Render can still be used as the fast demo deployment.

### Portfolio-grade version

Estimated time: 4.5 to 6.5 weeks part-time

Includes:

- Everything in the interview-ready version.
- Maintainable Figma design system for future feature expansion.
- Redis caching and rate limiting for selected backend workflows.
- AWS production deployment with S3, CloudFront, ECS Fargate or Elastic Beanstalk, ECR, CloudWatch, and GitHub Actions.
- Strong UI polish.
- Mature quality dashboard with Allure history and CI artifacts.
- Better observability/logging.
- More realistic residency domain fields.
- File/document metadata workflow.
- More complete deployment and demo story.

## 8. Recommended Execution Strategy

The recommended path has two layers:

1. The product delivery path used for day-to-day vibe coding.
2. The architecture maturity path used for longer-term portfolio depth.

For day-to-day implementation, use the `Vibe Coding Execution Roadmap` as the primary sequence:

1. Lock the baseline.
2. Migrate persistence from SQLite to MongoDB.
3. Add auth and roles.
4. Build the student chat experience from the rough design.
5. Build the admin dashboard from the rough design.
6. Polish the product UI.
7. Harden tests, CI/CD, and quality reporting.
8. Package the project for portfolio and interview use.

This order creates visible product progress quickly while keeping each milestone small enough to implement, review, and test.

For longer-term architecture maturity, the project can still follow the larger phase plan:

1. Migrate Express to NestJS after the current MERN-style foundation is stable.
2. Expand history/admin APIs.
3. Add Allure reporting and deeper quality dashboards.
4. Add Redis only for concrete needs such as AI explanation caching or rate limiting.
5. Add AWS production-style deployment after the application architecture is stable.
6. Polish documentation, GitHub Wiki pages, and interview packaging last.

This approach avoids turning the first upgrade into a full rewrite. It also keeps the project demoable after each meaningful change.

## 9. Interview Positioning

This project should be presented as:

> A production-oriented residency determination assistant built with React, NestJS, MongoDB, and Node.js. It combines deterministic business rules, AI-generated explanations, persistent audit history, role-based access, and CI/CD deployment.

Strong interview themes:

- Migrating from a lightweight Express/SQLite prototype to a modular NestJS/MongoDB backend.
- Keeping deterministic business logic separate from AI-generated explanations.
- Designing MongoDB schemas around audit-friendly decision records.
- Building secure role-based workflows for students and admins.
- Turning AI-assisted sketches into maintainable Figma product flows, reusable UI components, and implementation-ready designs.
- Testing backend logic, API behavior, frontend components, and end-to-end user flows.
- Building an Allure-powered quality reporting workflow that makes test coverage, failures, and execution history visible.
- Managing the project through GitHub Projects with phase-level Epics, feature Tasks, Bugs, Chores, Docs, and a visible delivery workflow.
- Maintaining a GitHub Wiki as a searchable project knowledge base for architecture, roadmap, testing, deployment, and interview demos.
- Deploying a separated frontend/backend architecture with CI/CD.
- Using Redis selectively for AI cost control, endpoint protection, and performance.
- Migrating from Vercel + Render POC deployment to AWS production-style infrastructure.

Personal positioning:

> Strong full-stack engineer with product sense and SDET depth: able to turn rough ideas into maintainable product design, then build the frontend, backend, AI integration, CI/CD, and automated quality framework needed to deliver the product reliably.

## 10. Project Management Strategy

GitHub Projects should be used as the source of truth for planning, tracking, reviewing, and archiving the upgrade work.

Why this matters:

- It makes a solo side project look and behave more like a real engineering project.
- It shows the ability to break large technical goals into manageable delivery units.
- It creates a visible audit trail from planning to implementation to review to closure.
- It helps interviewers understand the scope, sequencing, and completion status of the work.

Project structure:

- Each phase is represented as an Epic.
- Each Epic contains feature-level Tasks.
- Work item types include `Task`, `Bug`, `Chore`, `Docs`, `Design`, and `Test`.
- Larger features can be split into smaller implementation, test, documentation, and deployment tasks.
- Milestones should map to the `M0` through `M7` delivery roadmap so the board can show both active work and product progress.

Workflow states:

- `Todo`
- `In Progress`
- `Review`
- `Done`
- `Closed`

Board setup:

- `Kanban` board shows active delivery states: `Todo`, `In Progress`, `Review`, and `Done`.
- `Archived` board shows `Closed` items only.
- `Done` means the work is implemented and reviewable in the active project board.
- `Closed` means the work is fully completed, no longer active, and moved to the archive view.

Recommended item mapping:

- `Epic`: one upgrade phase, such as NestJS migration, MongoDB migration, Figma productization, or AWS deployment.
- `Task`: a feature or implementation unit inside an Epic.
- `Bug`: a defect found during implementation, testing, or demo preparation.
- `Chore`: setup, dependency, configuration, cleanup, or infrastructure work.
- `Docs`: README, architecture diagram, API documentation, demo script, or interview notes.
- `Design`: Figma, wireframe, design-token, product-flow, or visual QA work.
- `Test`: unit, integration, API, E2E, CI, or quality-reporting work.

Recommended operating model:

- Start every phase by creating or reviewing its Epic.
- Move only one or two major Tasks into `In Progress` at a time.
- Use the M0-M7 roadmap to decide what is active now and what stays in backlog.
- Use `Review` for code review, design review, test evidence review, or self-review before completion.
- Move work to `Done` after implementation and verification.
- Move completed work to `Closed` when it no longer needs to appear on the active Kanban board.

Interview message:

> I managed this as a real product delivery effort in GitHub Projects. Each phase was an Epic, features were broken into trackable Tasks, and Bugs, Chores, and Docs were handled through a visible workflow from Todo to Review to Done and finally Archived.

## 11. GitHub Wiki Documentation Strategy

The GitHub Wiki should be used as the project's long-form documentation hub. It should help interviewers, future collaborators, and the project owner understand the product, architecture, delivery process, and quality system without reading every source file first.

Recommended Wiki pages:

- `Home`: overview, live demo links, repository links, current project status, and navigation to the most important pages.
- `Product Vision`: what the residency determination assistant does, target users, core workflows, and non-official-disclaimer positioning.
- `Roadmap`: phase-based upgrade plan from Express/SQLite to NestJS/MongoDB, Redis, AWS, and future improvements.
- `Architecture Overview`: frontend, backend, database, AI integration, CI/CD, and deployment diagrams.
- `Backend Architecture`: NestJS modules, controllers, services, DTOs, guards, schemas, and error handling strategy.
- `Frontend Architecture`: React structure, state management, API layer, component organization, and design-system alignment.
- `Data Model`: MongoDB schemas, indexes, relationships, audit history, and sample documents.
- `API Reference`: REST endpoints, request/response examples, auth requirements, error responses, and status codes.
- `Auth and Roles`: student/admin roles, JWT flow, protected endpoints, and security assumptions.
- `AI Integration`: OpenAI usage, prompt strategy, fallback behavior, mocked CI behavior, and cost-control notes.
- `Testing Strategy`: backend unit, API integration, frontend unit, Playwright E2E, Allure Report, test data, and quality gates.
- `CI/CD Workflow`: GitHub Actions pipeline, test stages, artifacts, Allure publishing, and deployment triggers.
- `Deployment Guide`: Vercel + Render POC deployment and AWS production-style deployment with S3, CloudFront, ECR, ECS, ALB, and CloudWatch.
- `Project Management`: GitHub Projects setup, Epic/Task/Bug/Chore/Docs types, Kanban board, Archived board, and workflow rules.
- `Figma Design System`: Figma file links, user flows, design tokens, component library, responsive rules, and implementation checklist.
- `Demo Script`: 5-minute interview demo path, talking points, and backup screenshots.
- `Decision Records`: architecture decision records explaining major tradeoffs, such as NestJS over Express, MongoDB over SQLite, REST over GraphQL, and AWS over PaaS-only deployment.
- `Known Limitations`: what is intentionally simplified, what is not official residency advice, and what would be improved in a production university system.
- `Future Improvements`: GraphQL, document upload, observability, analytics, advisor workflow, and more realistic residency rules.

Recommended Wiki boundaries:

- README should stay short and act as the project landing page.
- `docs/plan.md` should remain the detailed upgrade plan.
- GitHub Projects should track execution status.
- Wiki should explain the system, decisions, operations, and demo story in a browsable format.

Recommended Wiki operating model:

- Add or update Wiki pages at the end of each phase.
- Link completed Epics from GitHub Projects to relevant Wiki pages.
- Keep screenshots, architecture diagrams, Allure report links, and Figma links discoverable from the Wiki.
- Use the Wiki as the interviewer's guided map through the project.

Interview message:

> I used GitHub Wiki as the project's knowledge base, separating quick-start README content from deeper architecture, testing, deployment, design, and project-management documentation. This makes the project easier to review like a real engineering product.

## 12. Product Design Strategy

The upgraded project should use Figma as a lightweight product design system before the larger frontend rebuild.

Why this matters:

- It turns rough AI-assisted sketches into editable design artifacts.
- It creates a reusable visual and interaction foundation for future features.
- It makes frontend implementation faster because page structure, states, and components are already decided.
- It simulates a realistic company workflow where design, implementation, and testing are connected.
- It improves the project demo because the interviewer can see both product thinking and engineering execution.

Recommended design artifacts:

- Product flow map for student and admin workflows.
- Figma page structure for wireframes, high-fidelity screens, components, and design tokens.
- Component library covering inputs, buttons, status badges, tables, cards, dialogs, navigation, and detail panels.
- Interaction states for loading, empty, error, success, unauthorized, and validation feedback.
- Responsive variants for desktop and mobile.
- Frontend implementation checklist derived from the Figma file.

Scope control:

- Do not spend too much time chasing visual perfection before implementation.
- Focus on flows, component consistency, accessibility, and maintainability.
- Keep the design system practical enough that it directly maps to React components.

Interview message:

> I used ChatGPT to explore rough ideas, then converted them into a maintainable Figma design system before implementation. This let me work more like a product engineering team: define flows, standardize components, implement consistently, and test the result.

## 13. Quality Engineering Strategy

The upgraded project should explicitly demonstrate that quality is part of the system design, not an afterthought.

Recommended quality layers:

- Backend unit tests for deterministic residency rules and service orchestration.
- Backend API/integration tests for validation, auth, persistence, and error handling.
- Frontend unit/component tests for UI state, form behavior, and decision rendering.
- Playwright E2E tests for complete user workflows.
- Mocked OpenAI tests to keep CI deterministic and cost-controlled.
- MongoDB test isolation through `mongodb-memory-server` or a dedicated test database.
- Allure Report to visualize test execution, failure categories, duration, and historical trends.

Recommended Allure report structure:

- `backend-unit`
- `backend-api`
- `frontend-unit`
- `frontend-e2e`
- `auth-flow`
- `decision-flow`
- `admin-flow`

CI quality gate expectations:

- Tests run automatically on every pull request.
- Allure results are uploaded as CI artifacts.
- Optional GitHub Pages publishing keeps historical Allure reports available.
- Failed tests should clearly identify the failing layer and workflow.
- OpenAI calls are mocked in CI so test results remain stable.

Interview message:

> I can own the product end to end: frontend, backend, database, AI integration, deployment, CI/CD, and the testing framework that protects release quality. My SDET background helps me think about failure modes, observability, repeatability, and quality gates while still writing production application code.

## 14. Future Improvements

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

## 15. Key Risks and Mitigations

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

### Risk: Project management overhead slows delivery

Mitigation:

- Keep GitHub Projects lightweight and delivery-oriented.
- Use Epics for phases and Tasks for real implementation units.
- Avoid creating tickets that do not change design, code, tests, docs, or deployment.
- Archive completed work regularly so the active Kanban board stays readable.
- Use the board to clarify priorities, not to create bureaucracy.

### Risk: Wiki becomes stale or duplicates README/docs

Mitigation:

- Use README as the short landing page.
- Use `docs/plan.md` as the detailed upgrade plan.
- Use GitHub Projects for execution tracking.
- Use Wiki for long-form architecture, operations, testing, deployment, and demo documentation.
- Update Wiki pages at phase boundaries instead of after every tiny code change.

### Risk: Figma design phase becomes too large

Mitigation:

- Treat Figma as an implementation accelerator, not a separate art project.
- Prioritize user flows, reusable components, states, and responsive structure.
- Time-box the initial design phase to 2 to 4 days.
- Move nice-to-have visual polish to the final packaging phase.
- Keep every Figma component traceable to a planned React component or page.

### Risk: Redis adds infrastructure complexity without enough value

Mitigation:

- Add Redis only for concrete use cases such as AI explanation caching and rate limiting.
- Keep the first Redis feature small and easy to explain.
- Make the app continue working if Redis is temporarily unavailable.

### Risk: AWS deployment becomes too large and slows product work

Mitigation:

- Keep Vercel + Render as the working POC deployment while AWS is being added.
- Choose Elastic Beanstalk if interview timing is tight.
- Choose ECS Fargate if the goal is a stronger cloud infrastructure story.
- Deploy the stable app to AWS only after NestJS, MongoDB, auth, and tests are already working.
- Document AWS architecture and tradeoffs even if the first AWS deployment is intentionally simple.

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

## 16. Suggested Definition of Done

The upgraded project can be considered interview-ready when:

- GitHub Projects tracks the work through phase-level Epics and typed work items.
- GitHub Wiki documents the system architecture, roadmap, testing strategy, deployment guide, and demo flow.
- The backend runs on NestJS.
- MongoDB stores decision records.
- The frontend can submit and view decision history.
- At least one admin workflow exists.
- Auth and role-based access are working.
- Figma design artifacts exist for the main product flows, reusable components, and responsive states.
- Redis is used for a small, justified performance or reliability feature if targeting the portfolio-grade version.
- AWS deployment is documented and working if targeting the portfolio-grade version.
- CI passes backend, frontend, and E2E tests.
- Allure Report is generated from CI so the testing workflow is visible and demoable.
- README clearly explains architecture, setup, testing, deployment, and tradeoffs.
- You can demo the project in under 5 minutes and explain the architecture in under 2 minutes.
