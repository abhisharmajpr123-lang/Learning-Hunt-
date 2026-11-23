# Learn Hunt

Learn Hunt is a Learning Management System (LMS) prototype for ALTA BUILDER 30 Track A. Students choose subjects, study lessons and track progress. Teachers manage learning content and assessments; developers manage platform access and the subject catalogue.

## Day 2 — Design + interactive demo

- [x] MongoDB collections and relationships: [database schema](./docs/database-schema.md)
- [x] Four key wireframes: [wireframes](./docs/wireframes.md)
- [x] Three role-specific portals: developer, teacher and student
- [x] Light minimal responsive UI
- [x] Demo subject discovery and selection
- [x] Sample video, quiz, assignment and test activity tracking
- [x] Teacher assessment workspace and learner progress view
- [x] Developer subject catalogue, user management and reports

The frontend still uses fictional local data and simulated sign-in. A real authentication API (signup, login and JWT-protected routes) now lives in `server/`, but the UI is not wired to it yet and learning data is not persisted.

## Demo accounts

| Portal | Email | Password |
|---|---|---|
| Developer | `dev@learnhunt.demo` | `Dev@123` |
| Teacher | `teacher@learnhunt.demo` | `Teach@123` |
| Student | `student@learnhunt.demo` | `Study@123` |

These credentials are for this demo only. Never use them for a real account.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
cp .env.example .env   # then set a random 32+ character JWT_SECRET
npm run dev            # frontend on http://localhost:5173
npm run server         # API on http://localhost:4000 (needs MongoDB)
```

`JWT_SECRET` must be at least 32 characters; the server refuses to start otherwise. Generate one with `openssl rand -hex 32`. `.env` is gitignored — only `.env.example` is committed.

## Tests

```bash
npm test
```

Runs 41 tests: signup/login validation, JWT and `requireRole` unit tests, search/pagination helper tests, an integration test that exercises signup → login → protected `/me` → tampered/missing token → rate limiting against the real Express app, a second integration test covering the subject CRUD endpoints (401s, ownership 403s, validation 400s, duplicate 409s and 404s), and a third covering nested courses, sections and lessons (numbering, empty states, ownership, search, filters and pagination) against an in-memory MongoDB.

`npm test` and `npm run build` also run on every push and pull request through GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

To verify a production bundle:

```bash
npm run build
npm run preview
```

## Stack

- React 18 + Vite 6
- JavaScript, CSS and lucide-react
- Backend: Node.js + Express in `server/`
- Database: MongoDB + Mongoose
- Authentication: bcrypt password hashing and JWT Bearer tokens with server-side `requireAuth` checks; helmet security headers, login rate limiting and `Cache-Control: no-store` on auth responses
- API: subject CRUD at `/api/subjects` and nested course CRUD at `/api/courses` and `/api/subjects/:subjectId/courses`, all behind `requireAuth`, with owning-teacher-or-developer checks on create, update and delete
- Search, filtering and pagination on the subject and course list endpoints, with page metadata (`total`, `page`, `limit`, `totalPages`)
- Testing: `node --test` with `mongodb-memory-server`

## Role responsibilities

- **Developer:** user access, subject catalogue, teacher assignment and platform reports.
- **Teacher:** assigned subjects, courses, lessons, quizzes, assignments, tests and learner progress.
- **Student:** choose subjects, browse courses, watch lessons, complete assessments and track personal progress.

The separate login portals are a demo convenience. In production, the server determines the authenticated user's role; public users must never be able to grant themselves developer access.

## Next steps

1. Day 8: wire the signup/login forms to the API, store the token and add a routing layout; Day 9 adds list and detail screens reading live data.
2. Show the Day 7 course outline and numbered lessons in the UI (the API already returns them).
3. Replace sample student scores/activity with database-backed events, then role-specific dashboards.

## What I built and what I understood

I separated a student's subject selection from course enrolment. Learning evidence is stored as individual lesson progress and assessment submissions so video completion, quiz scores, assignment reviews and test results can be reported separately. The current React demo simulates these flows with local state; MongoDB and real authentication are later milestones.

## Day 4 — Authentication + learning intelligence
- [x] User model with student/teacher/developer roles (student is the safe signup default)
- [x] Signup API with input validation and duplicate-email handling
- [x] bcrypt password hashing (12 rounds), password excluded from default query selection
- [x] Health endpoint and Postman smoke-test plan
- [x] Student demo: XP, levels, daily missions, streak and badges
- [x] Score-based topic insights and local progress persistence
- See [Day 4 API and test notes](./README-DAY4.md).

The authentication API is implemented and covered by an in-memory MongoDB integration test. Frontend gamification uses localStorage demo data and is not server verified.

## Day 5 — Login API + protected routes
- [x] `POST /api/auth/login` validates credentials and returns a signed JWT
- [x] Tokens carry only the user id and role, and expire (`JWT_EXPIRES_IN`, default `1d`)
- [x] `requireAuth` returns 401 for missing, malformed, expired or tampered tokens, and reloads the user from MongoDB
- [x] `GET /api/auth/me` returns 401 without a token and user data with one
- [x] Same `401 Invalid email or password.` for unknown email and wrong password
- [x] Server fails fast when `JWT_SECRET` is missing or under 32 characters
- [x] Helmet headers, login rate limiting (10 attempts / 15 minutes) and `Cache-Control: no-store` on auth responses
- See [Day 5 API and test notes](./README-DAY5.md).

## Day 6 — CRUD APIs for the main entity
- [x] `Subject` model: name, category, description, owning teacher and published flag, with a unique name + category index
- [x] `POST /api/subjects`, `GET /api/subjects`, `GET /api/subjects/:id`, `PATCH /api/subjects/:id`, `DELETE /api/subjects/:id` — all behind `requireAuth`
- [x] The owning teacher (from the token) or a developer may update or delete; everyone else gets `403`
- [x] `400` validation, `409` duplicate name within a category, `404` for unknown or malformed ids
- [x] 4 new `validateSubject` unit tests and 5 subject integration tests; `npm test` → 25 passing
- See [Day 6 API and test notes](./README-DAY6.md).

## Day 7 — Related entities, search and pagination
- [x] `Course` model related to `Subject` (one subject has many courses), with embedded ordered `sections` and `lessons`
- [x] `POST /api/subjects/:subjectId/courses` and `GET /api/subjects/:subjectId/courses` — the related-entity APIs, behind `requireAuth`
- [x] Course preview: `GET /api/courses/:id` returns numbered sections and lessons; list items carry an `outline` plus section/lesson counts and total duration
- [x] Lesson numbering is automatic (`Lesson 1, 2, 3…` per section, plus a course-wide `courseNumber`), derived from array order so it can never drift
- [x] Empty-state handling: a course without lessons returns `isEmpty: true` and `message: "This course has no lessons yet."`
- [x] Case-insensitive `q` search on subjects (name, category, description) and courses (title, description), with escaped regex input
- [x] Filters: `level`, `subject`, `category`, `published`, `teacher=me`
- [x] Pagination with `page`, `limit` (max 50) and metadata: `total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPreviousPage`
- [x] Sections and lessons can be added to an existing course, and deleting a subject deletes its courses
- [x] 7 new course integration tests and 5 query-helper tests; `npm test` → 41 passing
- See [Day 7 API and test notes](./README-DAY7.md).
