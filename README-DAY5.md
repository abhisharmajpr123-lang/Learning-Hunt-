# Learn Hunt — Day 5

## Login API with JWT and protected routes

- `POST /api/auth/login` checks the email/password and returns a signed JWT.
- `GET /api/auth/me` is a protected route: `401` without a token, user data with one.
- Tokens are signed with `JWT_SECRET` (HS256) and expire after `JWT_EXPIRES_IN` (default `1d`).
- `requireAuth` middleware accepts only `Authorization: Bearer <token>`, verifies the signature/expiry,
  then reloads the user so deleted accounts lose access immediately.
- Wrong email and wrong password return the same `401 Invalid email or password.` so the endpoint
  does not reveal which accounts exist.
- The API refuses to start if `JWT_SECRET` is missing or shorter than 32 characters.
- Auth responses send `Cache-Control: no-store` (plus `Pragma: no-cache`) so tokens are never cached.
- Helmet sets security headers (`X-Content-Type-Options`, CSP, no `X-Powered-By`).
- `POST /api/auth/login` is rate limited to 10 **failed** attempts per 2 minutes per IP; the 11th returns `429`. Successful logins are not counted, so normal use cannot lock an account out.

### Endpoints

| Method | Path | Auth | Result |
| --- | --- | --- | --- |
| GET | `/health` | none | `200 { success: true }` |
| POST | `/api/auth/signup` | none | `201` user, `400` validation, `409` duplicate |
| POST | `/api/auth/login` | none | `200 { token, tokenType, expiresIn, user }`, `400` validation, `401` bad credentials, `429` rate limited |
| GET | `/api/auth/me` | Bearer | `200 { user }`, `401` missing/expired/unknown token |

### Login response

```json
{
  "success": true,
  "message": "Signed in successfully",
  "token": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "1d",
  "user": { "id": "...", "name": "Demo Student", "email": "student@example.com", "role": "student" }
}
```

## Start
1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`
   (for example `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. `npm install`
3. Start MongoDB locally, then `npm run server`.
4. `npm test` runs the auth tests; the integration test starts its own in-memory MongoDB, so no local database is needed.
5. Frontend demo: `npm run dev`.

## Postman smoke tests
- `POST /api/auth/login` with a valid account → `200` and a token.
- Same email, wrong password → `401`, same message as an unknown email.
- `GET /api/auth/me` with no header → `401`.
- `GET /api/auth/me` with `Authorization: Bearer <token>` → `200` with that user.
- `GET /api/auth/me` with a tampered token → `401`.

## Tests
`npm test` → 16 passing (5 signup validation + 8 login/JWT/middleware + 3 integration), including
"protected route returns 401 without a token" and "protected route returns data with a valid token".

The integration test (`server/tests/auth.integration.test.js`) boots a real Express app against an
in-memory MongoDB and walks the whole flow: signup → bcrypt hash in the database → duplicate signup
`409` → wrong password `401` → login → `/me` with the token → `/me` without a token `401` → tampered
token `401` → rate limiting `429` → `no-store` and helmet headers.

## LinkedIn — Day 5 progress post
Post on Day 5 with `#ALTABuilder30`, tag `@ALTA School of Technology`.

> Day 5/30 of #ALTABuilder30 — authentication is real now 🔐
>
> Building **Learn Hunt**, a three-role learning platform (student, teacher, developer).
>
> Yesterday signup stored bcrypt-hashed passwords. Today I added login that returns a signed JWT and middleware that guards every private route:
> → wrong password and unknown email give the same 401, so the API does not leak which accounts exist
> → the token is verified on every request, then the user is reloaded from the database so a deleted account is locked out immediately
> → no `JWT_SECRET` under 32 characters = the server refuses to boot
>
> Hardened it too: rate-limited login, helmet headers, and no-store caching on auth responses.
>
> 16 tests green, including a real end-to-end signup → login → protected route run against an in-memory MongoDB. Frontend screens for this land on Day 8.
>
> DSA streak still alive 🧩 @ALTA School of Technology #ALTABuilder30 #WebDevelopment #JWT #MERN

## What I built and what I understood
- **Built:** `server/utils/token.js` (sign/verify with expiry), `server/middleware/auth.js`
  (`requireAuth`), `server/middleware/rateLimit.js`, `POST /api/auth/login`, `GET /api/auth/me`,
  `validateLogin`, plus unit and integration tests.
- **Understood:** the JWT carries only `sub` and `role`, so any other profile data must be fetched
  from MongoDB — a token is proof of "who logged in", not a copy of the user record. A stolen token
  stays valid until it expires, which is why the expiry is short and why the middleware re-checks that
  the user still exists.
