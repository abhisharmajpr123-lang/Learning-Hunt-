import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

// Mounted at /api/study — the signed-in student's chosen subjects and class picks,
// stored on the account so they survive signing out and back in.
const router = Router();

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const MAX_ENTRIES = 60;

/** Keep only well-formed subject ids and { trackId, label } class choices. */
function cleanStudy(body = {}) {
  const selected = Array.isArray(body.selected)
    ? body.selected.filter(id => typeof id === 'string' && OBJECT_ID.test(id))
    : [];

  const incoming = body.classes && typeof body.classes === 'object' && !Array.isArray(body.classes)
    ? body.classes
    : {};
  const classes = {};
  for (const [subjectId, choice] of Object.entries(incoming)) {
    if (!OBJECT_ID.test(subjectId)) continue;
    if (typeof choice?.trackId !== 'string' || typeof choice?.label !== 'string') continue;
    classes[subjectId] = { trackId: choice.trackId.slice(0, 40), label: choice.label.slice(0, 40) };
  }

  return { selected: [...new Set(selected)].slice(0, MAX_ENTRIES), classes };
}

router.use(requireAuth);
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const run = handler => (req, res, next) => handler(req, res, next).catch(next);

router.get('/', run(async (req, res) => {
  // requireAuth just read this user, so the document exists.
  const user = await User.findById(req.user.id).select('study');
  return res.status(200).json({
    success: true,
    study: { selected: user.study.selected, classes: user.study.classes }
  });
}));

router.put('/', run(async (req, res) => {
  const study = cleanStudy(req.body);
  await User.updateOne(
    { _id: req.user.id },
    { $set: { 'study.selected': study.selected, 'study.classes': study.classes } }
  );
  return res.status(200).json({ success: true, message: 'Your study setup is saved.', study });
}));

export default router;
