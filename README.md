# Learn Hunt

Learn Hunt is a dark-themed learning management system (LMS) built to help students discover courses, enrol, study lessons, and track their progress.

## Current status

**Track A — Day 1 foundation**

The current frontend is an interactive React + Vite prototype. It includes:
- Responsive dark learner dashboard
- Course discovery cards and category filters
- Course search
- Enrolment interaction and a My Learning view
- Continue-learning panel with progress presentation
- Mobile navigation

The course catalogue and learner metrics are currently sample data held in the frontend. Authentication, persistent storage, instructor tools, lesson playback, quizzes, grading, and certificates are planned next; they are not implemented yet.

## Tech stack

- React 18
- Vite 6
- JavaScript
- CSS
- lucide-react icons

Planned backend: Node.js, Express, MongoDB, and JWT authentication.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## Main project structure

```text
Learning-Hunt-/
├── index.html
├── package.json
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
└── README.md
```

## Product roles

- **Learner:** browse courses, enrol, complete lessons, take quizzes, and view progress.
- **Instructor:** create and manage courses, sections, lessons, quizzes, and learner progress.

## Roadmap

1. Project foundation and responsive learner dashboard
2. Authentication and role-based access
3. Course and lesson management
4. Enrolment and progress tracking
5. Quiz module, automatic grading, and downloadable completion certificate

See [FEATURES.md](./FEATURES.md) for the feature checklist.

## Important

This is a learning project prototype. Do not enter real passwords or personal information. Backend security and production deployment will be added in later stages.
