# Learn Hunt — Day 4

## Authentication API
- `POST /api/auth/signup`: creates a student account
- `GET /health`: API health check
- Signup input validation (name, email and password strength)
- Passwords are hashed with bcryptjs (12 rounds) before storage
- Duplicate email prevention and consistent JSON errors
- The signup endpoint intentionally does not accept a role; new users default to student. Teacher/developer role assignment must remain restricted.

## Start
1. Copy `.env.example` to `.env` and set `MONGODB_URI`.
2. Install dependencies: `npm install`
3. Start MongoDB locally (or use a secured connection string).
4. Start API: `npm run server`
5. Start frontend in another terminal: `npm run dev`

## Postman smoke tests
- `GET http://localhost:4000/health` → 200
- `POST http://localhost:4000/api/auth/signup` with JSON body:
  ```json
  { "name": "Demo Student", "email": "student@example.com", "password": "StrongPass123" }
  ``` → 201
- Repeat the signup with the same email → 409
- Use a malformed email or weak password → 400
- Confirm the response never includes the password or password hash.

## Frontend gamification (demo/local only)
- XP rewards: lesson +20, quiz +30, assignment +50, test +40
- Levels: every 250 XP
- Daily missions: complete 2 lessons, attempt 1 quiz, and complete 3 activities
- Streak counts active learning days
- Badges: first steps, quiz explorer, consistency, learning hero
- Topic insights classify recorded scores as needs attention (<75), review (75–89), and strong (90+)
- XP, streak, mission counts, completed lessons, subject selection and activity feed are saved in browser localStorage

These frontend rewards are local demo state, not server-verified. Scores and activity are sample/demo records until connected to a backend.
