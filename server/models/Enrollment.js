import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  // Denormalised so a student's enrolments can be grouped by subject without a second hop.
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

// A student enrolls in a given course once; the API turns a repeat into a 409.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, createdAt: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);
