# Learn Hunt — Feature Plan

## Track A: Learning Management System

### Day 1 — Plan
- [x] Problem statement, product scope and MVP feature list
- [x] GitHub repository and project foundation

### Day 2 — Database schema and wireframes
- [x] MongoDB collections and relationships in `docs/database-schema.md`
- [x] Four key wireframes in `docs/wireframes.md`
- [x] Three role-specific portals: developer, teacher and student
- [x] Light minimal responsive design
- [x] Demo subject discovery and selection
- [x] Demo activity/progress views for videos, quizzes, assignments and tests
- [x] Teacher assessment workspace and student progress table
- [x] Developer catalogue, user and report views

### Day 5 — Login API and protected routes
- [x] `POST /api/auth/login` returns a JWT for valid credentials
- [x] `requireAuth` middleware blocks requests without a valid Bearer token
- [x] Protected `GET /api/auth/me` returns 401 without a token and user data with one
- [x] Identical `401` for unknown email and wrong password (no account enumeration)
- [x] Helmet security headers, login and signup rate limiting on failed attempts only (10 per 2 minutes each) and `Cache-Control: no-store` on auth responses
- [x] Unit tests plus a MongoDB in-memory integration test for the full auth flow

### Day 6 — CRUD APIs for the main entity
- [x] `Subject` model with a unique `name` + `category` index and a `teacher` owner
- [x] `POST /api/subjects`, `GET /api/subjects`, `GET /api/subjects/:id`, `PATCH /api/subjects/:id` and `DELETE /api/subjects/:id`, all behind `requireAuth`
- [x] Ownership: only the owning teacher or a developer can update or delete a subject
- [x] The `teacher` field comes from the verified token, never from the request body
- [x] Validation for subject input plus `409` on duplicate names within a category
- [x] Integration tests covering the CRUD flow, 401s, 403s, 400s, 404s and 409

### Day 7 — Related entities, search and pagination
- [x] `Course` model related to `Subject`, with embedded ordered sections and lessons
- [x] Nested course APIs: `POST`/`GET /api/subjects/:subjectId/courses`, all behind `requireAuth`
- [x] Course preview API returning numbered sections and lessons, plus an `outline` on list items
- [x] Automatic lesson numbering (`Lesson 1, 2, 3…`) with a course-wide lesson number
- [x] Empty-state message for a course with no lessons
- [x] Case-insensitive search (`q`) with escaped regex input
- [x] Filters for level, subject, category and published state
- [x] Pagination with `page`/`limit` and `total`, `totalPages`, `hasNextPage`, `hasPreviousPage` metadata
- [x] Sections and lessons can be added incrementally; deleting a subject removes its courses
- [x] Integration tests for courses, sections, lessons, ownership, empty states, search and pagination

### Day 8 — Frontend setup, routing and auth screens
- [x] `src/lib/api.js` API client with a normalized error type and the auth endpoints
- [x] `AuthProvider` stores the JWT and hydrates the session from `GET /api/auth/me` on reload
- [x] Real signup and login screens wired to `POST /api/auth/signup` and `POST /api/auth/login`; signup signs you in afterwards
- [x] Server errors, including field-level validation messages, are shown on the form
- [x] react-router-dom routes with a `RequireAuth` guard and role-aware portals at `/{role}/{page}`
- [x] A signed-out visitor is redirected to `/login`; a role that does not own the URL is redirected to its own portal
- [x] Sign out clears the token and returns to the login screen
- [x] The localStorage demo login and the shared demo passwords are gone

### Day 9 — Live data in the portals
- [x] Sample subject and course arrays removed; subject lists read `GET /api/subjects`
- [x] Server-side search (`q`) plus category and published filters, debounced in the toolbar
- [x] Pagination controls driven by the API's `totalPages` / `hasNextPage` / `hasPreviousPage`
- [x] Each subject expands into its courses from `GET /api/subjects/:subjectId/courses`
- [x] Course outline at `/{role}/courses/:id` with numbered sections and lessons from `GET /api/courses/:id`
- [x] Loading, empty and error states with retry on every live screen
- [x] Teacher portal reads `teacher=me`; the developer add-subject form posts to the API

### Day 10 — Course enrolment on the server
- [x] `Enrollment` model (`student`, `course`, `subject`, `status`) with a unique student + course index
- [x] Student-only `POST`/`DELETE /api/courses/:courseId/enroll` and `GET /api/enrollments/mine`
- [x] Only published courses can be enrolled in; a repeat enrolment is `409` and leaving a course you are not in is `404`
- [x] `GET /api/enrollments/mine` returns each enrolled course with its subject, level, section and lesson counts and duration
- [x] `My learning` page in the student portal with loading, empty and error states
- [x] Enrol / leave control on the course outline screen; enrolment state comes from the server, not localStorage
- [x] 5 integration tests covering roles, duplicates, unpublished courses, per-student lists and unenrolling

### Core product features
- [x] Real signup and login against the API, with role-aware portal routing
- [x] Student subject selection and discovery over the live catalogue
- [x] Paginated subject list with search and filters, and a course outline screen in every portal
- [x] Sample learning activity feed and progress breakdown
- [x] Teacher assessment workspace and learner progress view (demo)
- [x] Developer subject catalogue and user/report views (demo)
- [x] Real registration and secure authentication
- [ ] Server-side role-based authorization
- [x] MongoDB persistence for users, subjects, courses and course enrolments
- [ ] Subject interest selection still lives in localStorage beside server-side enrolment
- [x] Teacher course/lesson authoring through the API (no media upload yet)
- [x] Student course enrolment
- [ ] Lesson playback tracking and server-calculated course progress
- [ ] Quiz grading, assignment review and test workflows
- [ ] Server-calculated progress and analytics
- [ ] PDF certificate generation

## Heavy feature (Days 11–12)
- [ ] Quiz module with automatic grading
- [ ] Downloadable PDF certificate after required lessons and final quiz are completed

## Quality goals
- Responsive on mobile, tablet and desktop
- Accessible labels and keyboard-friendly controls
- Validate input on client and server
- Keep secrets in environment variables; never commit `.env`
- Store password hashes only, never plaintext passwords
- Enforce role and ownership checks on every protected API
- Calculate scores and progress on the server
- Add tests for authentication, enrolment, progress and grading

## Current implementation note
Subjects, courses and course enrolment are live: the portals read the catalogue from the API, a student can enrol in a published course and see it under My learning, and the developer screen writes subjects back. What is still fictional is learner evidence — activity, quiz scores and progress bars are React/localStorage demo data. Lesson progress, subject authoring screens and moving the subject interest selection server-side are the remaining steps.
