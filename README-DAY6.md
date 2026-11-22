# Learn Hunt — Day 6

## CRUD APIs for the main entity: subjects

Subjects are the core Learn Hunt entity: students browse them, teachers author inside them and the
developer console manages the catalogue. Every subject endpoint requires `Authorization: Bearer <token>`
and returns `401` for a missing, malformed, expired or tampered token.

| Method | Path | Auth | Who can call it | Result |
| --- | --- | --- | --- | --- |
| POST | `/api/subjects` | Bearer | any signed-in user (becomes the owning teacher) | `201 { subject }`, `400` validation, `409` duplicate |
| GET | `/api/subjects` | Bearer | any signed-in user | `200 { count, subjects }` |
| GET | `/api/subjects/:id` | Bearer | any signed-in user | `200 { subject }`, `404` unknown/malformed id |
| PATCH | `/api/subjects/:id` | Bearer | owning teacher or developer | `200 { subject }`, `400`, `403`, `404`, `409` |
| DELETE | `/api/subjects/:id` | Bearer | owning teacher or developer | `204`, `403`, `404` |

### Model

`server/models/Subject.js`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, trimmed, 2–80 characters |
| `category` | string | required, trimmed, 2–40 characters |
| `description` | string | optional, max 500 characters, default `""` |
| `teacher` | ObjectId → `User` | required; set from the token, never from the request body |
| `published` | boolean | default `false` |

`name` + `category` is a unique compound index, so a second "Physics / Science" gets `409` instead of
silently duplicating the catalogue. The same name in another category is allowed.

### Ownership rule

`PATCH` and `DELETE` load the subject, then allow the request only when `req.user.role === 'developer'`
or `String(subject.teacher) === req.user.id`. Anyone else gets `403`. The `teacher` field can never be
set by a request body — it always comes from the verified token, so a student cannot reassign or claim
a subject.

### Examples

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"teacher@example.com","password":"StrongPass123"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")

# create
curl -s -X POST http://localhost:4000/api/subjects \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Mathematics","category":"Science","description":"Algebra and calculus.","published":true}'

# list / read
curl -s http://localhost:4000/api/subjects -H "authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/subjects/<id> -H "authorization: Bearer $TOKEN"

# update / delete
curl -s -X PATCH http://localhost:4000/api/subjects/<id> \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"published":false}'
curl -s -X DELETE http://localhost:4000/api/subjects/<id> -H "authorization: Bearer $TOKEN" -o /dev/null -w '%{http_code}\n'

# no token at all
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/api/subjects   # 401
```

## Tests

`npm test` → **25 passing**, exit 0.

- New `server/tests/subjects.integration.test.js` (5 tests) boots the real app against an in-memory
  MongoDB and checks: `401` on all four endpoints without a token → create `201` with `teacher` taken
  from the token → list/detail visible to a second user → owner `PATCH` updates only the sent fields →
  owner `DELETE` `204` then `404` → `400` for invalid input → `409` for a duplicate name+category →
  second user `403` on patch and delete → developer can patch and delete → `404` for unknown and
  malformed ids.
- `server/tests/validation.test.js` gained 4 `validateSubject` unit tests (trimming, incomplete input,
  over-long fields and a non-boolean `published`, partial update).
- The Day 5 auth tests are unchanged and still green.

## Not in this commit

- No frontend wiring — `src/App.jsx` still renders its local sample catalogue. Day 8 connects signup
  and login screens, and the list/detail screens come on Day 9.
- No pagination or search on the list endpoint; that is Day 7, together with the second entity.
- `Course`/`Lesson` and enrolment are still unimplemented, so `DELETE` has no dependent records to
  guard yet.
