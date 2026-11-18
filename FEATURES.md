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

### Core product features
- [x] Simulated demo login (not production authentication)
- [x] Student subject selection and discovery
- [x] Sample learning activity feed and progress breakdown
- [x] Teacher assessment workspace and learner progress view (demo)
- [x] Developer subject catalogue and user/report views (demo)
- [ ] Real registration and secure authentication
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
The frontend is a demo built with fictional sample data and React state. Demo sign-in is not real authentication, and most changes reset on refresh. No backend or database is connected yet.
