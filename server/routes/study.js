import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

// Mounted at /api/study — the signed-in student's chosen subjects, class picks and
// learning progress, stored on the account so they survive signing out and back in.
const router = Router();

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVITY_TYPES = new Set(['video', 'quiz', 'assignment', 'test']);
const MAX_SELECTED = 60;
const MAX_COMPLETED = 500;
const MAX_ACTIVITIES = 100;

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const count = (value, max = 1000) =>
  Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 0), max) : 0;
const object = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

/** Keep only well-formed subject ids and { trackId, label } class choices. */
function cleanSelection(body = {}) {
  const selected = Array.isArray(body.selected)
    ? body.selected.filter(id => typeof id === 'string' && OBJECT_ID.test(id))
    : [];

  const classes = {};
  for (const [subjectId, choice] of Object.entries(object(body.classes))) {
    if (!OBJECT_ID.test(subjectId)) continue;
    if (typeof choice?.trackId !== 'string' || typeof choice?.label !== 'string') continue;
    classes[subjectId] = { trackId: choice.trackId.slice(0, 40), label: choice.label.slice(0, 40) };
  }

  return { selected: [...new Set(selected)].slice(0, MAX_SELECTED), classes };
}

/** Keep completed lesson ids, the recent activity feed and the XP/streak counters. */
function cleanProgress(body = {}) {
  const progress = object(body.progress);

  const completed = Array.isArray(progress.completed)
    ? progress.completed.filter(id => typeof id === 'string' && id.trim() && id.length <= 40)
    : [];

  const activities = Array.isArray(progress.activities)
    ? progress.activities.flatMap(item => {
        if (!item || typeof item !== 'object' || !ACTIVITY_TYPES.has(item.type)) return [];
        return [{
          id: Number.isFinite(item.id) ? item.id : text(item.id, 40),
          type: item.type,
          title: text(item.title, 120),
          subject: text(item.subject, 60),
          detail: text(item.detail, 120),
          date: text(item.date, 40),
          score: Number.isFinite(item.score) ? count(item.score, 100) : null,
          createdAt: count(item.createdAt, 1e15)
        }];
      })
    : [];

  const rewards = object(progress.rewards);
  const daily = object(rewards.daily);

  return {
    completed: [...new Set(completed)].slice(0, MAX_COMPLETED),
    activities: activities.slice(0, MAX_ACTIVITIES),
    rewards: {
      xp: count(rewards.xp, 1e6),
      streak: count(rewards.streak, 1e5),
      lastActive: DAY.test(rewards.lastActive) ? rewards.lastActive : null,
      daily: {
        date: DAY.test(daily.date) ? daily.date : null,
        video: count(daily.video),
        quiz: count(daily.quiz),
        assignment: count(daily.assignment),
        test: count(daily.test),
        total: count(daily.total)
      }
    }
  };
}

function cleanStudy(body = {}) {
  return { ...cleanSelection(body), ...cleanProgress(body) };
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
  return res.status(200).json({ success: true, study: user.study });
}));

router.put('/', run(async (req, res) => {
  const study = cleanStudy(req.body);
  await User.updateOne({ _id: req.user.id }, { $set: { study } });
  return res.status(200).json({ success: true, message: 'Your study setup is saved.', study });
}));

export default router;
