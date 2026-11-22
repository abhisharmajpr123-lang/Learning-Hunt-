import { Router } from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import { requireAuth } from '../middleware/auth.js';
import { validateSubject } from '../utils/validation.js';

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

router.get('/', async (_req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: subjects.length, subjects: subjects.map(serialize) });
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
    await req.subject.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
