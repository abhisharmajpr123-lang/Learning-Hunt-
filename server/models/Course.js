import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  content: { type: String, default: '', trim: true, maxlength: 2000 },
  durationMinutes: { type: Number, default: 0, min: 0, max: 600 }
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  // Array order is the lesson order; lesson numbers are derived from it.
  lessons: { type: [lessonSchema], default: [] }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  published: { type: Boolean, default: false },
  sections: { type: [sectionSchema], default: [] }
}, { timestamps: true });

courseSchema.index({ subject: 1, createdAt: -1 });

export default mongoose.model('Course', courseSchema);
