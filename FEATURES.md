# Learn Hunt — Feature Plan

## Track A: Learning Management System

### Day 1 foundation — current prototype
- [x] React + Vite application scaffold
- [x] Dark, responsive learner dashboard
- [x] Browse sample courses
- [x] Search and filter by category
- [x] Demo course enrolment interaction
- [x] My Learning navigation view
- [ ] Persist enrolments in a database

### Core LMS features
- [ ] Student registration and login
- [ ] Instructor registration and login
- [ ] JWT-based authentication and protected routes
- [ ] Role-based permissions (student / instructor / admin)
- [ ] Instructor course creation, editing, publishing, and deletion
- [ ] Course sections and lessons (video, text, and resources)
- [ ] Course catalogue with search and filters
- [ ] Student course enrolment
- [ ] Lesson completion tracking
- [ ] Course progress dashboard

### Heavy feature: quizzes and certificates
- [ ] Instructor quiz builder
- [ ] Multiple-choice questions and answer options
- [ ] Automatic quiz grading
- [ ] Score and pass/fail summary
- [ ] Certificate eligibility after course completion
- [ ] Downloadable PDF certificate

## Quality goals
- Responsive on mobile, tablet, and desktop
- Accessible labels and keyboard-friendly controls
- Clear loading, empty, and error states
- Validate user input on both client and server
- Keep secrets in environment variables; never commit `.env`
- Add tests for authentication, enrolment, progress, and grading

## Current implementation note

Items marked complete above are present in the frontend prototype only. Sample courses and progress are hard-coded. They are not backed by accounts or a database yet.
