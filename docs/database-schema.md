# Learn Hunt — MongoDB schema (Day 2)

Proposed backend schema for MongoDB + Mongoose. The React demo currently uses local sample data; these collections are not connected.

## Principles
- Three explicit roles: `developer`, `teacher`, `student`.
- A teacher may manage only assigned subjects/courses; a student may access only their own learning records.
- Use ObjectId references for independently queried entities.
- Store password hashes only (Argon2id or bcrypt); never plaintext passwords.
- Calculate grades and progress on the server, not from client-submitted percentages.
- Developer accounts are provisioned by a trusted process, never public self-registration.

## Collections

### users
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Required |
| `email` | String | Required, lowercase, unique |
| `passwordHash` | String | Required secure hash |
| `role` | String | Enum: developer, teacher, student |
| `status` | String | active, suspended |
| `avatarUrl` | String | Optional |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

### subjects
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name`, `slug` | String | Required; slug unique |
| `description` | String | Required |
| `category` | String | Science, Technology, Languages, etc. |
| `teacherIds` | ObjectId[] | References teacher users |
| `status` | String | draft, published, archived |
| `createdBy` | ObjectId | Reference to users |
| `createdAt`, `updatedAt` | Date | Timestamps |

### courses
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `subjectId` | ObjectId | Reference to subjects |
| `title`, `description` | String | Required |
| `instructorId` | ObjectId | Reference to teacher user |
| `level` | String | beginner, intermediate, advanced |
| `thumbnailUrl` | String | Optional |
| `status` | String | draft, published, archived |

### lessons
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `courseId` | ObjectId | Reference to courses |
| `title` | String | Required |
| `contentType` | String | video, article, resource |
| `contentUrl` | String | Media/resource location |
| `durationSeconds` | Number | Non-negative |
| `position` | Number | Lesson order |
| `isPreview` | Boolean | Defaults false |

### subjectSelections
- `studentId`: ObjectId reference to a student user.
- `subjectId`: ObjectId reference to a subject.
- `selectedAt`: Date; `status`: active, paused, removed.
- Unique compound index: `{ studentId: 1, subjectId: 1 }`.

This is deliberately separate from enrolment: choosing a subject expresses interest; enrolling in a course grants access to that course.

### enrollments
- `studentId`, `courseId`: ObjectId references.
- `status`: active, completed, withdrawn.
- `enrolledAt`, optional `completedAt`: Date.
- Unique compound index: `{ studentId: 1, courseId: 1 }`.

#### enrollments as implemented (Day 10)
`server/models/Enrollment.js` uses Mongoose field names `student`, `course` and `subject` instead of `studentId`/`courseId`, plus `status` (`active` | `completed`) and timestamps. The unique `{ student: 1, course: 1 }` index is in place. `subject` is denormalised from the course so a learner's enrolment list can name the subject without a second lookup.

### lessonProgress
- `studentId`, `lessonId`: ObjectId references.
- `watchedSeconds`: Number; `completed`: Boolean.
- `lastViewedAt`, optional `completedAt`: Date.
- Unique compound index: `{ studentId: 1, lessonId: 1 }`.

### assessments
- `subjectId`: required ObjectId; optional `courseId`: ObjectId.
- `teacherId`: ObjectId reference to teacher user.
- `type`: quiz, assignment or test.
- `title`, `instructions`, `dueAt`, `maxScore`, `publishedAt`.
- `questions`: quiz/test question array. Correct answer keys remain server-side.

### assessmentSubmissions
- `assessmentId`, `studentId`: ObjectId references.
- `answers`: submitted responses; `fileUrls`: optional assignment attachments.
- `score`, `feedback`, `status`: submitted, graded, returned.
- `submittedAt`, `gradedAt`: Date.
- Score is set by server grading or authorised teacher only.

### certificates (later milestone)
- `studentId`, `courseId`: ObjectId references.
- Unique `certificateCode`, `issuedAt`, `assetUrl`.
- Issue only after server-verified lesson completion and final assessment pass.

## Relationships
- Teacher user 1 → many subjects and courses.
- Subject 1 → many courses and assessments.
- Course 1 → many lessons and enrollments.
- Student many ↔ many subjects through subjectSelections.
- Student many ↔ many courses through enrollments.
- Student 1 → many lessonProgress records and assessmentSubmissions.
- Assessment 1 → many assessmentSubmissions.

## Recommended indexes
- users: unique `{ email: 1 }`.
- subjects: unique `{ slug: 1 }`; `{ status: 1, category: 1 }`.
- courses: `{ subjectId: 1, status: 1 }`; `{ instructorId: 1 }`.
- lessons: `{ courseId: 1, position: 1 }`.
- subjectSelections: unique `{ studentId: 1, subjectId: 1 }`.
- enrollments: unique `{ studentId: 1, courseId: 1 }`.
- lessonProgress: unique `{ studentId: 1, lessonId: 1 }`.
- assessments: `{ subjectId: 1, type: 1, publishedAt: -1 }`.
- assessmentSubmissions: `{ assessmentId: 1, studentId: 1 }`.
- certificates: unique `{ certificateCode: 1 }`.

## Progress calculation
Keep raw evidence in lessonProgress and assessmentSubmissions. Derive progress from required completed lessons and required final assessment. Show video completion, quiz scores, assignment review and test performance separately rather than hiding them inside one unexplained score.
