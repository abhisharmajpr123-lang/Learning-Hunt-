# Learn Hunt — Day 2 wireframes

Design: light minimal UI, white surfaces, soft blue accents, clear typography. The three portals share a design system but have different navigation and permissions.

## 1. Login / role selection

```text
┌──────────────────────────────┬──────────────────────────────────────┐
│ Learn Hunt                   │ WELCOME BACK                         │
│                              │ Sign in to Learn Hunt                 │
│ Make progress that matters.  │                                      │
│                              │ [ Student ] [ Teacher ] [ Developer ]│
│ ✓ Learn at your own pace     │ Email address                        │
│ ✓ See your progress clearly  │ [________________________________]  │
│ ✓ Keep subjects organised    │ Password                              │
│                              │ [________________________________]  │
│                              │ [             Sign in             ]  │
└──────────────────────────────┴──────────────────────────────────────┘
```

In production, the server determines the role after authentication. A public user cannot grant themselves developer privileges.

## 2. Subject discovery / selection (student)

```text
┌───────────────┬────────────────────────────────────────────────────┐
│ STUDENT       │ Learn Hunt / Explore subjects                       │
│ Overview      │ EXPLORE SUBJECTS                                   │
│ My subjects   │ Choose the subjects you want to learn.              │
│ Explore   ◀   │ [ Search subjects...           ] [ Category ▼ ]    │
│ My progress   │                                                    │
│               │ [ Mathematics ] [ Physics ] [ Chemistry ]           │
│               │ [ teacher · lessons · learners · Choose subject ]  │
│               │ [ Web development ] [ Computer science ] [ English ]│
└───────────────┴────────────────────────────────────────────────────┘
```

Subject selection is separate from course enrolment. Students can select/unselect subjects and browse published subjects.

## 3. Subject / learning activity

```text
┌───────────────┬────────────────────────────────────────────────────┐
│ STUDENT       │ My subjects / Physics                              │
│ Overview      │ PHYSICS · Teacher: Priya Sharma                    │
│ My subjects ◀ │ Course: Mechanics — motion and force                │
│ Explore       │                                                    │
│ My progress   │ [ Video player / article / PDF resource ]          │
│               │ Lesson 1 ✓  Lesson 2 ▶  Lesson 3 ○                 │
│               │ [ Mark lesson complete ]                           │
│               │ Quiz · Assignment · Test                            │
└───────────────┴────────────────────────────────────────────────────┘
```

## 4. Student progress dashboard

```text
┌───────────────┬────────────────────────────────────────────────────┐
│ STUDENT       │ My progress                                        │
│ Overview      │ MY LEARNING INSIGHTS                               │
│ My subjects   │ [ Videos 4/6 ] [ Overall 67% ] [ Quiz avg 85% ]    │
│ Explore       │ [ Assignments 7/10 ]                                │
│ My progress ◀ │                                                    │
│               │ Recent activity                                    │
│               │ ▶ Video watched · Physics                          │
│               │ ✓ Quiz · Mathematics · 8/10                        │
│               │ ▤ Assignment · Web Development · Awaiting review   │
│               │ ✓ Test · Chemistry · 76%                            │
└───────────────┴────────────────────────────────────────────────────┘
```

## Role dashboards

- **Developer:** platform-wide user counts, subject catalogue, draft/publish status, role access and reports.
- **Teacher:** assigned subjects, student progress, recent submissions and assessment creation (quiz/assignment/test).
- **Student:** subject selection, course list, learning activity, assessment results and personal progress.

## Responsive behaviour

On narrow screens the sidebar becomes a slide-in menu, cards collapse to one column and wide tables scroll horizontally.
