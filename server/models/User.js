import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['student', 'teacher', 'developer'], default: 'student' },
  // Study setup and learning progress saved to the account, so signing out and
  // back in restores them.
  study: {
    selected: { type: [String], default: [] },
    classes: { type: mongoose.Schema.Types.Mixed, default: {} },
    completed: { type: [String], default: [] },
    activities: { type: [{ type: mongoose.Schema.Types.Mixed }], default: [] },
    rewards: {
      xp: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastActive: { type: String, default: null },
      daily: {
        date: { type: String, default: null },
        video: { type: Number, default: 0 },
        quiz: { type: Number, default: 0 },
        assignment: { type: Number, default: 0 },
        test: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
      }
    }
  }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
