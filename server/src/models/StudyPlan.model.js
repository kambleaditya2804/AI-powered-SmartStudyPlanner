const mongoose = require('mongoose');

// ─── Topic ────────────────────────────────────────────────────────────────────
const topicSchema = new mongoose.Schema(
  {
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    priority: { type: Number, default: 1, min: 1, max: 5 },   // 1 = low, 5 = critical
    difficulty: { type: Number, default: 3, min: 1, max: 5 },
    confidence: { type: Number, default: 0, min: 0, max: 100 },  // % user feels ready
    estimatedHours: { type: Number, required: true },
    completedHours: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },

    // Spaced repetition (SM-2)
    sr: {
      easeFactor: { type: Number, default: 2.5 },
      interval: { type: Number, default: 1 },   // days until next review
      repetitions: { type: Number, default: 0 },
      nextReviewDate: { type: Date, default: Date.now },
    },
    resources: [{
      videoId: { type: String },
      title: { type: String },
      channel: { type: String },
      thumbnail: { type: String },
      url: { type: String },
    }],
  },
  { timestamps: true }
);

// ─── StudyPlan ────────────────────────────────────────────────────────────────
const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    goal: { type: String, trim: true },          // e.g. "Crack JEE Mains top 1000"
    dailyStudyHours: { type: Number, default: 4 },
    isActive: { type: Boolean, default: true },

    // Aggregated analytics (updated periodically)
    stats: {
      totalHoursPlanned: { type: Number, default: 0 },
      totalHoursCompleted: { type: Number, default: 0 },
      readinessScore: { type: Number, default: 0 }, // 0-100
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

studyPlanSchema.virtual('daysLeft').get(function () {
  return Math.max(0, Math.ceil((this.examDate - Date.now()) / 86400000));
});

// ─── Session (one Pomodoro / study block) ────────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    date: { type: Date, required: true },
    plannedMinutes: { type: Number, required: true },
    completedMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
    notes: { type: String, default: '' },
    mood: { type: Number, min: 1, max: 5 },  // post-session mood rating
  },
  { timestamps: true }
);

// ─── Flashcard ────────────────────────────────────────────────────────────────
const flashcardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    front: { type: String, required: true },
    back: { type: String, required: true },

    // SM-2
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 1 },
    repetitions: { type: Number, default: 0 },
    nextReviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  StudyPlan: mongoose.model('StudyPlan', studyPlanSchema),
  Topic: mongoose.model('Topic', topicSchema),
  Session: mongoose.model('Session', sessionSchema),
  Flashcard: mongoose.model('Flashcard', flashcardSchema),
};
