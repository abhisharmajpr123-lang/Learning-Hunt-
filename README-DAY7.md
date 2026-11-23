# Day 7 — Related entities, search and pagination

Day 7 adds the second entity (`Course`) with a real one-to-many relationship to `Subject`, nested sections and lessons, and search, filtering and pagination on the list APIs.

## Data model

```
Subject (1) ──── (many) Course
                          └── sections[]   (ordered)
                                └── lessons[] (ordered)
```

`server/models/Course.js` stores sections and lessons as embedded subdocuments:

| Field | Rules |
|---|---|
| `title` | 2–120 characters, required, trimmed |
| `description` | up to 500 characters, defaults to `""` |
| `level` | `beginner` \| `intermediate` \| `advanced`, defaults to `beginner` |
| `subject` | ObjectId ref `Subject`, required |
| `teacher` | ObjectId ref `User`, always taken from the token, never the body |
| `published` | boolean, defaults to `false` |
| `sections[]` | up to 20 per course; each has `title` (2–100) and `lessons[]` |
| `lessons[]` | up to 50 per section; `title` (2–140), `content` (≤2000), `durationMinutes` (0–600) |

Courses are removed with their subject, so no course can point at a deleted subject.

## Lesson numbering

Lesson and section numbers are **derived from array order** in the serializer, not stored:

- `section.number` is the section's position in the course (1, 2, 3…).
- `lesson.number` is the lesson's position inside its section (1, 2, 3…).
- `lesson.courseNumber` is the lesson's position in the whole course, so the UI can say "Lesson 4 of 9".

Because the numbers are computed on read, adding or removing a lesson can never leave a gap or duplicate.

## Endpoints

All endpoints require `Authorization: Bearer <token>`.

### Related entity: courses under a subject

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/subjects/:subjectId/courses` | Lists that subject's courses; supports the query params below |
| `POST` | `/api/subjects/:subjectId/courses` | Creates a course; only the subject's owning teacher or a developer (`403` otherwise) |

`POST` accepts `title`, `description`, `level`, `published` and an optional `sections` array of `{ title, lessons: [{ title, content, durationMinutes }] }`, so a whole outline can be created in one request.

### Course preview and management

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/courses` | All courses with search, filters and pagination |
| `GET` | `/api/courses/:id` | Full preview: numbered sections and lessons, plus counts |
| `PATCH` | `/api/courses/:id` | Owner or developer only; partial update of `title`, `description`, `level`, `published` |
| `DELETE` | `/api/courses/:id` | Owner or developer only; `204` |
| `POST` | `/api/courses/:id/sections` | Adds a section, numbered automatically |
| `POST` | `/api/courses/:id/sections/:sectionId/lessons` | Adds a lesson, numbered automatically |

### Query parameters (`GET /api/courses`, `GET /api/subjects/:subjectId/courses`, `GET /api/subjects`)

| Param | Meaning |
|---|---|
| `q` | Case-insensitive search. Courses match title and description; subjects match name, category and description. Regex characters are escaped. |
| `level` | Course level filter (`beginner`, `intermediate`, `advanced`) |
| `subject` | Course list only: restrict to one subject id |
| `category` | Subject list only: exact category, case-insensitive |
| `published` | `true` or `false` |
| `teacher=me` | Subject list only: only subjects you own |
| `page` | Whole number ≥ 1, defaults to 1 |
| `limit` | Whole number 1–50, defaults to 10 |

List responses keep `success`, `count` (items in this page) and the `subjects` / `courses` array, and add `total` plus:

```json
{
  "pagination": {
    "total": 12,
    "page": 2,
    "limit": 5,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## Course preview and empty states

- List items carry `sectionCount`, `lessonCount`, `totalDurationMinutes` and an `outline`
  (`[{ number, title, lessonCount, lessons: [{ number, title }] }]`), so sections and lessons can be
  previewed without opening the course.
- `GET /api/courses/:id` returns the full numbered `sections` tree plus a human-readable `message`.
  A course with no lessons returns `isEmpty: true` and
  `message: "This course has no lessons yet."`, which is what the UI shows as its empty state.

## Example

```bash
# create a course with two sections
curl -X POST http://localhost:4000/api/subjects/$SUBJECT_ID/courses \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"title":"Algebra Foundations","level":"beginner","sections":[{"title":"Getting Started","lessons":[{"title":"What is a variable?"}]}]}'

# search page 2
curl "http://localhost:4000/api/courses?q=algebra&page=2&limit=5" -H "authorization: Bearer $TOKEN"

# add a lesson to the first section (becomes Lesson 2 automatically)
curl -X POST http://localhost:4000/api/courses/$COURSE_ID/sections/$SECTION_ID/lessons \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"title":"Expressions","durationMinutes":15}'
```

## Errors

- `400` validation failure (field errors in `errors[]`), including bad `page`/`limit`/`level` values
- `401` missing, malformed or expired token
- `403` course or subject owned by another teacher
- `404` unknown or malformed course, subject or section id
- `409` unchanged from Day 6 (duplicate subject name within a category)

## Tests

```bash
npm test
```

Day 7 adds 16 tests: 7 course integration tests (401s, nested create with numbering, empty state,
incremental sections/lessons, ownership, validation, search/filter/pagination) and 5 pagination
and search helper tests. Full suite: **41 passing, 0 failing**.
