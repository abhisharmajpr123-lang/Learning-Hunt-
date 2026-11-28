import { Router } from 'express';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { SOURCE, getSyllabus, getTrack, listTracks, trackLabel } from '../data/curriculum.js';
import { searchVideos } from '../lib/youtube.js';

// Mounted at /api/curriculum — CBSE classes, their subjects and the syllabus.
const router = Router();

const NOT_FOUND = { success: false, message: 'That class or subject is not in the CBSE catalogue.' };
const ALREADY_ENROLLED = { success: false, message: 'You are already enrolled in this subject.' };

const run = handler => (req, res, next) => handler(req, res, next).catch(next);

const UNIT_MISSING = { success: false, message: 'That unit is not in this syllabus.' };

/**
 * The syllabus and unit the route names, or the 404 body that fits what is wrong:
 * an unknown class/subject reads differently from an out-of-range unit index.
 */
function findUnit(req) {
  const syllabus = getSyllabus(req.params.trackId, req.params.subjectId);
  if (!syllabus) return { missing: NOT_FOUND };
  const index = Number(req.params.unitIndex);
  if (!Number.isInteger(index) || index < 0 || !syllabus.units[index]) {
    return { missing: UNIT_MISSING };
  }
  return { syllabus, index, unit: syllabus.units[index] };
}

/** "Unit II · Algebra" becomes "Algebra": the number adds nothing to a search. */
const unitTopic = title =>
  title.replace(/^Class \d+ · /, '').replace(/^Unit [^·]+ · /, '').trim();

const unitQuery = (syllabus, unit) =>
  `${unitTopic(unit.title)} ${syllabus.subject.name} ${syllabus.track.label} CBSE`;

const chapterQuery = (syllabus, chapter) =>
  `${chapter} ${syllabus.subject.name} ${syllabus.track.label} CBSE`;

const searchUrl = query =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

// Chapter names search far better than a unit title ("Natural Phenomena" finds
// Class 8 lightning, "Light — Reflection and Refraction" finds the right chapter),
// but a search per chapter of a long unit gets rate-limited. First, middle and last
// chapters cover the unit in three searches that can run at once.
const MAX_CHAPTER_SEARCHES = 3;
const VIDEOS_PER_CHAPTER = 4;
const MAX_VIDEOS = 12;

function chaptersToSearch(chapters) {
  const indexes =
    chapters.length <= MAX_CHAPTER_SEARCHES
      ? chapters.map((_, index) => index)
      : [...new Set([0, Math.floor((chapters.length - 1) / 2), chapters.length - 1])];
  return indexes.map(index => chapters[index]);
}

/** Take one video from each chapter in turn, so no single chapter fills the grid. */
function interleave(lists) {
  const videos = [];
  const seen = new Set();
  const longest = Math.max(0, ...lists.map(list => list.length));
  for (let position = 0; position < longest && videos.length < MAX_VIDEOS; position += 1) {
    for (const list of lists) {
      const video = list[position];
      if (!video || seen.has(video.id)) continue;
      seen.add(video.id);
      videos.push(video);
      if (videos.length >= MAX_VIDEOS) break;
    }
  }
  return videos;
}

/** The subject shape a My learning row renders for a CBSE enrolment. */
export function serializeSubjectEnrollment(enrollment) {
  return {
    id: String(enrollment.id),
    kind: 'subject',
    status: enrollment.status,
    enrolledAt: enrollment.createdAt,
    subject: {
      id: enrollment.subjectKey,
      name: enrollment.subjectName,
      trackId: enrollment.track,
      trackLabel: trackLabel(enrollment.track)
    }
  };
}

router.use(requireAuth);

router.get('/', (_req, res) => {
  res.status(200).json({ success: true, tracks: listTracks(), source: SOURCE });
});

router.get('/:trackId', (req, res) => {
  const track = getTrack(req.params.trackId);
  if (!track) return res.status(404).json(NOT_FOUND);
  return res.status(200).json({ success: true, track, source: SOURCE });
});

router.get('/:trackId/:subjectId', (req, res) => {
  const syllabus = getSyllabus(req.params.trackId, req.params.subjectId);
  if (!syllabus) return res.status(404).json(NOT_FOUND);
  return res.status(200).json({ success: true, ...syllabus });
});

// Unit metadata is local data, so the unit page paints immediately instead of
// waiting for YouTube.
router.get('/:trackId/:subjectId/units/:unitIndex', (req, res) => {
  const found = findUnit(req);
  if (found.missing) return res.status(404).json(found.missing);

  return res.status(200).json({
    success: true,
    unit: { index: found.index, title: found.unit.title, chapters: found.unit.chapters },
    track: found.syllabus.track,
    subject: found.syllabus.subject
  });
});

// YouTube lessons for a unit: a few chapter searches, run together and merged.
router.get('/:trackId/:subjectId/units/:unitIndex/videos', run(async (req, res) => {
  const found = findUnit(req);
  if (found.missing) return res.status(404).json(found.missing);

  const lists = await Promise.all(
    chaptersToSearch(found.unit.chapters).map(chapter =>
      searchVideos(chapterQuery(found.syllabus, chapter), VIDEOS_PER_CHAPTER)
    )
  );

  res.set('Cache-Control', 'no-store');
  return res.status(200).json({
    success: true,
    videos: interleave(lists),
    searchUrl: searchUrl(unitQuery(found.syllabus, found.unit))
  });
}));

// Enrolling in a CBSE subject is a learner action, like course enrolment.
const studentOnly = requireRole('student');

router.post('/:trackId/:subjectId/enrol', studentOnly, run(async (req, res) => {
  const syllabus = getSyllabus(req.params.trackId, req.params.subjectId);
  if (!syllabus) return res.status(404).json(NOT_FOUND);

  const existing = await Enrollment.findOne({
    student: req.user.id,
    track: syllabus.track.id,
    subjectKey: syllabus.subject.id
  }).select('_id');
  if (existing) return res.status(409).json(ALREADY_ENROLLED);

  try {
    const enrollment = await Enrollment.create({
      student: req.user.id,
      kind: 'subject',
      track: syllabus.track.id,
      subjectKey: syllabus.subject.id,
      subjectName: syllabus.subject.name
    });
    return res.status(201).json({
      success: true,
      message: `Enrolled in ${syllabus.subject.name} · ${syllabus.track.label}`,
      enrollment: serializeSubjectEnrollment(enrollment)
    });
  } catch (error) {
    // The unique index also catches two enrol clicks that arrive together.
    if (error?.code === 11000) return res.status(409).json(ALREADY_ENROLLED);
    throw error;
  }
}));

router.delete('/:trackId/:subjectId/enrol', studentOnly, run(async (req, res) => {
  const syllabus = getSyllabus(req.params.trackId, req.params.subjectId);
  if (!syllabus) return res.status(404).json(NOT_FOUND);

  const removed = await Enrollment.findOneAndDelete({
    student: req.user.id,
    track: syllabus.track.id,
    subjectKey: syllabus.subject.id
  });
  if (!removed) return res.status(404).json({ success: false, message: 'You are not enrolled in this subject.' });
  return res.status(204).end();
}));

export default router;
