import { Router } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import { requireAuth } from '../middleware/auth.js';
import { validateSubject } from '../utils/validation.js';
import { escapeRegex, paginationMeta, parsePagination, searchPattern } from '../utils/query.js';

const router = Router();

const NOT_FOUND = { success: false, message: 'Subject not found.' };
const DUPLICATE = { success: false, message: 'A subject with this name already exists in that category.' };

function serialize(subject) {
  return {
    id: String(subject.id),
    name: subject.name,
    category: subject.category,
    description: subject.description,
    teacher: String(subject.teacher),
    published: subject.published,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt
  };
}

function canManage(subject, user) {
  return user.role === 'developer' || String(subject.teacher) === String(user.id);
}

async function loadSubject(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json(NOT_FOUND);
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json(NOT_FOUND);
    req.subject = subject;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Every subject endpoint requires a valid Bearer token.
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  const { errors, clean } = validateSubject(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  try {
    const subject = await Subject.create({ ...clean, teacher: req.user.id });
    return res.status(201).json({ success: true, message: 'Subject created', subject: serialize(subject) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(DUPLICATE);
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  const { errors: pageErrors, page, limit, skip } = parsePagination(req.query);
  const errors = [];
  const filter = {};

  // Case-insensitive search across name, category and description.
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (search) {
    const pattern = searchPattern(search);
    filter.$or = [{ name: pattern }, { category: pattern }, { description: pattern }];
  }

  if (req.query.category !== undefined) {
    const category = String(req.query.category).trim();
    if (category.length < 2 || category.length > 40) errors.push('Category filter must be 2–40 characters.');
    else filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  }

  if (req.query.published !== undefined) {
    const published = String(req.query.published).trim().toLowerCase();
    if (published !== 'true' && published !== 'false') errors.push('Published must be true or false.');
    else filter.published = published === 'true';
  }

  if (req.query.teacher === 'me') filter.teacher = req.user.id;

  if (errors.length || pageErrors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [...errors, ...pageErrors] });
  }

  try {
    const [total, subjects] = await Promise.all([
      Subject.countDocuments(filter),
      Subject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);
    return res.status(200).json({
      success: true,
      count: subjects.length,
      total,
      pagination: paginationMeta({ page, limit, total }),
      subjects: subjects.map(serialize)
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', loadSubject, (req, res) => res.status(200).json({ success: true, subject: serialize(req.subject) }));

router.patch('/:id', loadSubject, async (req, res, next) => {
  if (!canManage(req.subject, req.user)) {
    return res.status(403).json({ success: false, message: 'Only the owning teacher or a developer can update this subject.' });
  }

  const { errors, clean } = validateSubject(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  if (!Object.keys(clean).length) {
    return res.status(400).json({ success: false, message: 'Provide at least one field to update.' });
  }

  try {
    Object.assign(req.subject, clean);
    await req.subject.save();
    return res.status(200).json({ success: true, message: 'Subject updated', subject: serialize(req.subject) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(DUPLICATE);
    return next(error);
  }
});

router.delete('/:id', loadSubject, async (req, res, next) => {
  if (!canManage(req.subject, req.user)) {
    return res.status(403).json({ success: false, message: 'Only the owning teacher or a developer can delete this subject.' });
  }

  try {
    // Courses belong to a subject, so they go with it.
    await Course.deleteMany({ subject: req.subject.id });
    await req.subject.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
