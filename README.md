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

The current frontend uses fictional local data and simulated sign-in. No real authentication, database, file upload or persistent storage is connected yet.

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
npm run dev
```

To verify a production bundle:

```bash
npm run build
npm run preview
```

## Stack

- React 18 + Vite 6
- JavaScript, CSS and lucide-react
- Planned backend: Node.js + Express
- Planned database: MongoDB + Mongoose
- Planned authentication: password hashing, JWT/session cookies and server-enforced role permissions

## Role responsibilities

- **Developer:** user access, subject catalogue, teacher assignment and platform reports.
- **Teacher:** assigned subjects, courses, lessons, quizzes, assignments, tests and learner progress.
- **Student:** choose subjects, browse courses, watch lessons, complete assessments and track personal progress.

The separate login portals are a demo convenience. In production, the server determines the authenticated user's role; public users must never be able to grant themselves developer access.

## Next steps

1. Day 5: Login endpoint, secure session/JWT handling and server-enforced role access.
2. Connect subject, course, lesson and assessment APIs to the frontend.
3. Replace sample student scores/activity with database-backed events.

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

The authentication API is implemented but needs a local MongoDB connection for endpoint smoke tests. Frontend gamification uses localStorage demo data and is not server verified.
