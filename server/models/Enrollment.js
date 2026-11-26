import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // A course enrolment carries `course`; a CBSE subject enrolment carries `track`
  // and `subjectKey` instead. One collection keeps "My learning" in one read.
  kind: { type: String, enum: ['course', 'subject'], default: 'course', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
  // Denormalised so a student's enrolments can be grouped by subject without a second hop.
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
  track: { type: String, trim: true },
  subjectKey: { type: String, trim: true },
  subjectName: { type: String, trim: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

// A student enrolls in a given course once; the API turns a repeat into a 409.
enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } }
);
// The same rule for CBSE subjects: one row per class + subject, per student.
enrollmentSchema.index(
  { student: 1, track: 1, subjectKey: 1 },
  { unique: true, partialFilterExpression: { track: { $exists: true } } }
);
enrollmentSchema.index({ student: 1, createdAt: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);
