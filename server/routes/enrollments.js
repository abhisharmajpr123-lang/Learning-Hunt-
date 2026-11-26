import { Router } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Mounted at explicit prefixes so only these paths require a token:
// /api/courses/:courseId/enroll and /api/enrollments/mine.
export const courseEnrollmentRouter = Router();
export const enrollmentRouter = Router();

const COURSE_NOT_FOUND = { success: false, message: 'Course not found.' };
const ALREADY_ENROLLED = { success: false, message: 'You are already enrolled in this course.' };

const run = handler => (req, res, next) => handler(req, res, next).catch(next);

/** The course shape the student portal renders in a My learning row. */
function summarizeCourse(course, subject) {
  const sections = course.sections || [];
  return {
    id: String(course.id),
    title: course.title,
    level: course.level,
    published: course.published,
    sectionCount: sections.length,
    lessonCount: sections.reduce((sum, section) => sum + section.lessons.length, 0),
    totalDurationMinutes: sections.reduce(
      (sum, section) => sum + section.lessons.reduce((minutes, lesson) => minutes + (lesson.durationMinutes || 0), 0),
      0
    ),
    subject: subject ? { id: String(subject.id), name: subject.name, category: subject.category } : null
  };
}

function serializeEnrollment(enrollment, course, subject) {
  return {
    id: String(enrollment.id),
    status: enrollment.status,
    enrolledAt: enrollment.createdAt,
    course: summarizeCourse(course, subject)
  };
}

async function loadCourse(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.courseId)) return res.status(404).json(COURSE_NOT_FOUND);
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json(COURSE_NOT_FOUND);
  req.course = course;
  return next();
}

// Enrolment is a learner action; teachers and developers manage content instead.
// The guards sit on each route because this router shares /api/courses with the
// course routes, which a teacher must still be able to read.
const studentOnly = [requireAuth, requireRole('student')];

enrollmentRouter.get('/mine', studentOnly, run(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).sort({ createdAt: 1 });
  const [courses, subjects] = await Promise.all([
    Course.find({ _id: { $in: enrollments.map(item => item.course) } }),
    Subject.find({ _id: { $in: enrollments.map(item => item.subject) } })
  ]);
  const courseById = new Map(courses.map(course => [String(course.id), course]));
  const subjectById = new Map(subjects.map(subject => [String(subject.id), subject]));

  // A course deleted since enrolment no longer appears in the learner's list.
  const items = enrollments
    .filter(enrollment => courseById.has(String(enrollment.course)))
    .map(enrollment =>
      serializeEnrollment(
        enrollment,
        courseById.get(String(enrollment.course)),
        subjectById.get(String(enrollment.subject))
      )
    );

  return res.status(200).json({ success: true, count: items.length, total: items.length, enrollments: items });
}));

courseEnrollmentRouter.post('/:courseId/enroll', studentOnly, run(loadCourse), run(async (req, res) => {
  const course = req.course;
  if (!course.published) {
    return res.status(409).json({ success: false, message: 'This course is not published yet.' });
  }

  const existing = await Enrollment.findOne({ student: req.user.id, course: course.id }).select('_id');
  if (existing) return res.status(409).json(ALREADY_ENROLLED);

  try {
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course.id,
      subject: course.subject
    });
    const subject = await Subject.findById(course.subject);
    return res.status(201).json({
      success: true,
      message: `Enrolled in ${course.title}`,
      enrollment: serializeEnrollment(enrollment, course, subject)
    });
  } catch (error) {
    // The unique index also catches two enrol clicks that arrive together.
    if (error?.code === 11000) return res.status(409).json(ALREADY_ENROLLED);
    throw error;
  }
}));

courseEnrollmentRouter.delete('/:courseId/enroll', studentOnly, run(loadCourse), run(async (req, res) => {
  const removed = await Enrollment.findOneAndDelete({ student: req.user.id, course: req.course.id });
  if (!removed) return res.status(404).json({ success: false, message: 'You are not enrolled in this course.' });
  return res.status(204).end();
}));
