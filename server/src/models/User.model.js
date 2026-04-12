const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: { type: String, default: '' },

    // Onboarding / preferences
    preferences: {
      studyStartTime: { type: String, default: '09:00' }, // 'HH:MM'
      studyEndTime:   { type: String, default: '22:00' },
      dailyGoalHours: { type: Number, default: 4 },
      learningStyle:  { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading'], default: 'visual' },
      breakInterval:  { type: Number, default: 25 }, // minutes (Pomodoro)
    },

    // Gamification
    xp:     { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastStudiedAt: { type: Date },

    isOnboarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
