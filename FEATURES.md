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
- [x] Helmet security headers, login rate limiting and `Cache-Control: no-store` on auth responses
- [x] Unit tests plus a MongoDB in-memory integration test for the full auth flow

### Core product features
- [x] Simulated demo login (not production authentication)
- [x] Student subject selection and discovery
- [x] Sample learning activity feed and progress breakdown
- [x] Teacher assessment workspace and learner progress view (demo)
- [x] Developer subject catalogue and user/report views (demo)
- [x] Real registration and secure authentication
- [ ] Server-side role-based authorization
- [ ] MongoDB persistence for users, subjects and selections
- [ ] Teacher course/lesson authoring and media storage
- [ ] Student enrolment and lesson playback tracking
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
The frontend is still a demo built with fictional sample data and React state, so its sign-in form is simulated and most changes reset on refresh. The backend API in `server/` is real: signup, login and JWT-protected routes run against MongoDB, tested through an in-memory database. Connecting the UI to that API, and enforcing role permissions on individual routes, are the remaining steps.
