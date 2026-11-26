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

Signup and login now run against the real authentication API in `server/`. Credentials are checked server-side, the JWT is kept in the browser and re-verified through `GET /api/auth/me` on every reload, and each portal is a protected route. Subject, course and activity content inside the portals is still sample data.

## Signing in

There are no shared demo passwords any more. Start the API and the frontend, open http://localhost:5173 and create an account on the signup screen. You are signed in straight away and land in the student portal.

New accounts are always students, because `User.role` defaults to `student` in `server/models/User.js`. Teacher and developer roles are assigned on the server: create the account, then set its role in MongoDB.

```bash
mongosh learnhunt --eval 'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "teacher" } })'
```

Sign in again after changing the role. The browser never sends a role with signup or login: the API decides which portal a token unlocks, and the router sends you to the portal that matches `user.role`.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
cp .env.example .env   # then set a random 32+ character JWT_SECRET
npm run dev            # frontend on http://localhost:5173
npm run server         # API on http://localhost:4000 (needs MongoDB)
```

`JWT_SECRET` must be at least 32 characters; the server refuses to start otherwise. Generate one with `openssl rand -hex 32`. `.env` is gitignored — only `.env.example` is committed.

Signing in needs both processes running: the API on port 4000 and the frontend on 5173. The frontend calls `VITE_API_URL` (default `http://localhost:4000`), and the API's `CLIENT_ORIGIN` must match the frontend origin or CORS blocks the request.

## Tests

```bash
npm test
```

Runs 48 tests: signup/login validation, JWT and `requireRole` unit tests, search/pagination helper tests, an integration test that exercises signup → login → protected `/me` → tampered/missing token → rate limiting (failed attempts only) against the real Express app, a second integration test covering the subject CRUD endpoints (401s, ownership 403s, validation 400s, duplicate 409s and 404s), a third covering nested courses, sections and lessons (numbering, empty states, ownership, search, filters and pagination), and a fourth covering course enrolment (student-only access, duplicate and unpublished `409`s, per-student lists and unenrolling) against an in-memory MongoDB.

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
- Authentication: bcrypt password hashing and JWT Bearer tokens with server-side `requireAuth` checks; helmet security headers, failed-attempt-only rate limiting on login and signup and `Cache-Control: no-store` on auth responses
- Frontend session: a small `src/lib/api.js` client, an `AuthProvider` that hydrates from `/api/auth/me`, and react-router-dom routes guarded by `RequireAuth` and `user.role`
- API: subject CRUD at `/api/subjects` and nested course CRUD at `/api/courses` and `/api/subjects/:subjectId/courses`, all behind `requireAuth`, with owning-teacher-or-developer checks on create, update and delete
- Student enrolment: `POST`/`DELETE /api/courses/:courseId/enroll` and `GET /api/enrollments/mine`, student-only and backed by a unique `student + course` index
- Search, filtering and pagination on the subject and course list endpoints, with page metadata (`total`, `page`, `limit`, `totalPages`)
- Testing: `node --test` with `mongodb-memory-server`

## Role responsibilities

- **Developer:** user access, subject catalogue, teacher assignment and platform reports.
- **Teacher:** assigned subjects, courses, lessons, quizzes, assignments, tests and learner progress.
- **Student:** choose subjects, browse courses, watch lessons, complete assessments and track personal progress.

The separate login portals are a demo convenience. In production, the server determines the authenticated user's role; public users must never be able to grant themselves developer access.

## Next steps

1. Replace the sample student scores and activity feed with database-backed lesson progress and submissions, starting from the enrolments that now exist.
2. Teacher authoring screens for courses, sections and lessons — the APIs already exist.
3. Move the student's subject interest selection into a `subjectSelections` collection; course enrolment is already server-side.

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
- [x] Helmet headers, login and signup rate limiting (10 failed attempts / 2 minutes each; successful requests are not counted) and `Cache-Control: no-store` on auth responses
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

## Day 9 — Live catalogue in the portals
- [x] The sample subject and course arrays are gone; every subject list reads `GET /api/subjects` through `src/hooks/useCatalogue.js`
- [x] Search (`q`), category and published filters run on the server, debounced by 300 ms
- [x] Pagination controls built from `totalPages`, `hasNextPage` and `hasPreviousPage`, with a "Showing 1–6 of N" summary
- [x] A subject card expands into its courses from `GET /api/subjects/:subjectId/courses`
- [x] Course outline screen at `/{role}/courses/:id`: numbered sections and numbered lessons, using the course-wide `courseNumber` the API derives from array order
- [x] Loading, empty and error states (with a retry) on every live screen, so an API outage is visible instead of silent
- [x] The teacher portal asks for `GET /api/subjects?teacher=me`; the developer add-subject form posts to `POST /api/subjects` and refreshes the catalogue
- [x] Portal URLs stay role-aware: `/student/courses/:id` is reachable only by a student, and the sidebar keeps its section highlighted

The portal shows whatever MongoDB contains, so an empty database shows empty states. Create a subject from the developer portal (or `POST /api/subjects` with a token) to populate the catalogue.
- See [Day 7 API and test notes](./README-DAY7.md).

## Day 10 — Course enrolment on the server
- [x] `Enrollment` model (`student`, `course`, `subject`, `status`) with a unique `student + course` index
- [x] Student-only `POST`/`DELETE /api/courses/:courseId/enroll` and `GET /api/enrollments/mine`
- [x] Only published courses can be enrolled in; a duplicate enrolment is `409` and leaving a course you never joined is `404`
- [x] `GET /api/enrollments/mine` returns the course summary — subject, level, sections, lessons and duration — for each enrolment
- [x] `My learning` page in the student portal, with loading, empty and error states
- [x] Enrol / Leave control on the course outline screen; enrolment state is read from the server on every visit
- [x] 5 new integration tests; `npm test` → 48 passing
