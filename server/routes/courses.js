import { Router } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import { requireAuth } from '../middleware/auth.js';
import { COURSE_LEVELS, validateCourse, validateLesson, validateSectionInput } from '../utils/validation.js';
import { paginationMeta, parsePagination, searchPattern } from '../utils/query.js';

// /api/courses — read and manage courses directly.
export const courseRouter = Router();
// /api/subjects/:subjectId/courses — the related-entity routes.
export const subjectCourseRouter = Router({ mergeParams: true });

const COURSE_NOT_FOUND = { success: false, message: 'Course not found.' };
const SUBJECT_NOT_FOUND = { success: false, message: 'Subject not found.' };
const SECTION_NOT_FOUND = { success: false, message: 'Section not found.' };
const COURSE_FORBIDDEN = {
  success: false,
  message: 'Only the owning teacher or a developer can change this course.'
};

const run = handler => (req, res, next) => handler(req, res, next).catch(next);

function canManage(document, user) {
  return user.role === 'developer' || String(document.teacher) === String(user.id);
}

function serializeSection(section, index, lessonsBefore) {
  return {
    id: String(section.id),
    number: index + 1,
    title: section.title,
    lessonCount: section.lessons.length,
    lessons: section.lessons.map((lesson, lessonIndex) => ({
      // Numbers are derived from array order, so they can never drift.
      id: String(lesson.id),
      number: lessonIndex + 1,
      courseNumber: lessonsBefore + lessonIndex + 1,
      title: lesson.title,
      content: lesson.content,
      durationMinutes: lesson.durationMinutes
    }))
  };
}

function outlineFor(sections) {
  return sections.map((section, index) => ({
    number: index + 1,
    title: section.title,
    lessonCount: section.lessons.length,
    lessons: section.lessons.map((lesson, lessonIndex) => ({
      number: lessonIndex + 1,
      title: lesson.title
    }))
  }));
}

function totalsFor(sections) {
  const lessonCount = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const totalDurationMinutes = sections.reduce(
    (sum, section) => sum + section.lessons.reduce((minutes, lesson) => minutes + (lesson.durationMinutes || 0), 0),
    0
  );
  return { sectionCount: sections.length, lessonCount, totalDurationMinutes };
}

function serializeCourse(course, { detail = false } = {}) {
  const sections = course.sections || [];
  const totals = totalsFor(sections);
  const course$ = {
    id: String(course.id),
    title: course.title,
    description: course.description,
    level: course.level,
    subject: String(course.subject),
    teacher: String(course.teacher),
    published: course.published,
    ...totals,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };

  if (!detail) {
    // The list carries a lightweight outline so a course can be previewed without opening it.
    course$.outline = outlineFor(sections);
    return course$;
  }

  let lessonsBefore = 0;
  course$.sections = sections.map((section, index) => {
    const serialized = serializeSection(section, index, lessonsBefore);
    lessonsBefore += section.lessons.length;
    return serialized;
  });
  course$.isEmpty = totals.lessonCount === 0;
  course$.message = course$.isEmpty
    ? 'This course has no lessons yet.'
    : `${totals.sectionCount} ${totals.sectionCount === 1 ? 'section' : 'sections'}, ${totals.lessonCount} lessons.`;
  return course$;
}

async function findSubjectOr404(subjectId) {
  if (!mongoose.isValidObjectId(subjectId)) return null;
  return Subject.findById(subjectId);
}

async function loadCourse(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json(COURSE_NOT_FOUND);
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json(COURSE_NOT_FOUND);
    req.course = course;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function listCourses(req, res, subjectId = null) {
  const { errors: pageErrors, page, limit, skip } = parsePagination(req.query);
  const errors = [];
  const filter = {};

  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (search) {
    const pattern = searchPattern(search);
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  if (subjectId) {
    filter.subject = subjectId;
  } else if (req.query.subject !== undefined) {
    if (!mongoose.isValidObjectId(req.query.subject)) errors.push('Subject filter must be a valid id.');
    else filter.subject = req.query.subject;
  }

  if (req.query.level !== undefined) {
    const level = String(req.query.level).trim().toLowerCase();
    if (!COURSE_LEVELS.includes(level)) errors.push(`Level must be one of: ${COURSE_LEVELS.join(', ')}.`);
    else filter.level = level;
  }

  if (req.query.published !== undefined) {
    const published = String(req.query.published).trim().toLowerCase();
    if (published !== 'true' && published !== 'false') errors.push('Published must be true or false.');
    else filter.published = published === 'true';
  }

  if (errors.length || pageErrors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [...errors, ...pageErrors] });
  }

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  return res.status(200).json({
    success: true,
    count: courses.length,
    total,
    pagination: paginationMeta({ page, limit, total }),
    courses: courses.map(course => serializeCourse(course))
  });
}

courseRouter.use(requireAuth);
subjectCourseRouter.use(requireAuth);

subjectCourseRouter.get('/', run(async (req, res, next) => {
  const subject = await findSubjectOr404(req.params.subjectId);
  if (!subject) return res.status(404).json(SUBJECT_NOT_FOUND);
  return listCourses(req, res, subject.id);
}));

subjectCourseRouter.post('/', run(async (req, res) => {
  const subject = await findSubjectOr404(req.params.subjectId);
  if (!subject) return res.status(404).json(SUBJECT_NOT_FOUND);
  if (!canManage(subject, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Only the owning teacher or a developer can add courses to this subject.'
    });
  }

  const { errors, clean } = validateCourse(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  const course = await Course.create({ ...clean, subject: subject.id, teacher: req.user.id });
  return res.status(201).json({ success: true, message: 'Course created', course: serializeCourse(course, { detail: true }) });
}));

courseRouter.get('/', run((req, res) => listCourses(req, res)));

courseRouter.get('/:id', loadCourse, (req, res) =>
  res.status(200).json({ success: true, course: serializeCourse(req.course, { detail: true }) })
);

courseRouter.patch('/:id', loadCourse, run(async (req, res) => {
  if (!canManage(req.course, req.user)) return res.status(403).json(COURSE_FORBIDDEN);

  const { errors, clean } = validateCourse(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  if (!Object.keys(clean).length) {
    return res.status(400).json({ success: false, message: 'Provide at least one field to update.' });
  }

  Object.assign(req.course, clean);
  await req.course.save();
  return res.status(200).json({ success: true, message: 'Course updated', course: serializeCourse(req.course, { detail: true }) });
}));

courseRouter.delete('/:id', loadCourse, run(async (req, res) => {
  if (!canManage(req.course, req.user)) return res.status(403).json(COURSE_FORBIDDEN);
  await req.course.deleteOne();
  return res.status(204).end();
}));

courseRouter.post('/:id/sections', loadCourse, run(async (req, res) => {
  if (!canManage(req.course, req.user)) return res.status(403).json(COURSE_FORBIDDEN);

  const { errors, clean } = validateSectionInput(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  req.course.sections.push({ title: clean.title, lessons: [] });
  await req.course.save();
  const number = req.course.sections.length;
  return res.status(201).json({
    success: true,
    message: `Section ${number} added`,
    course: serializeCourse(req.course, { detail: true })
  });
}));

courseRouter.post('/:id/sections/:sectionId/lessons', loadCourse, run(async (req, res) => {
  if (!canManage(req.course, req.user)) return res.status(403).json(COURSE_FORBIDDEN);

  const section = req.course.sections.id(req.params.sectionId);
  if (!section) return res.status(404).json(SECTION_NOT_FOUND);

  const { errors, clean } = validateLesson(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  section.lessons.push(clean);
  await req.course.save();

  const savedSection = req.course.sections.find(item => String(item.id) === String(section.id));
  return res.status(201).json({
    success: true,
    message: `Lesson ${savedSection.lessons.length} added`,
    course: serializeCourse(req.course, { detail: true })
  });
}));
