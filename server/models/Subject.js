import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  category: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  published: { type: Boolean, default: false }
}, { timestamps: true });

// One catalogue entry per name within a category.
subjectSchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
