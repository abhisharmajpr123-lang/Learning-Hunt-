import { Router } from 'express';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { SOURCE, getSyllabus, getTrack, listTracks, trackLabel } from '../data/curriculum.js';

// Mounted at /api/curriculum — CBSE classes, their subjects and the syllabus.
const router = Router();

const NOT_FOUND = { success: false, message: 'That class or subject is not in the CBSE catalogue.' };
const ALREADY_ENROLLED = { success: false, message: 'You are already enrolled in this subject.' };

const run = handler => (req, res, next) => handler(req, res, next).catch(next);

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
