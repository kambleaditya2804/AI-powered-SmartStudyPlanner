/**
 * Schedule Generation Engine
 *
 * Algorithm:
 * 1. Calculate available days until exam
 * 2. Rank topics by: priority Ã— difficulty Ã— (1 - confidence/100)
 * 3. Distribute hours across days using a weighted round-robin
 * 4. Group into daily sessions (Pomodoro blocks)
 * 5. Add revision buffers in the last 20% of days
 */

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;
const BLOCK_MINUTES = POMODORO_MINUTES + BREAK_MINUTES; // 30 min per block

/**
 * Score a topic for scheduling priority.
 * Higher score = scheduled earlier and more frequently.
 */
const scoreTopic = (topic) => {
  const confidenceFactor = 1 - (topic.confidence || 0) / 100;
  const remainingHours = Math.max(0, topic.estimatedHours - (topic.completedHours || 0));
  return topic.priority * topic.difficulty * confidenceFactor * remainingHours;
};

/**
 * Convert hours to Pomodoro blocks.
 */
const hoursToPomodoroBlocks = (hours) => Math.round((hours * 60) / BLOCK_MINUTES);

/**
 * Generate an array of available study dates from today until exam.
 */
const getStudyDates = (examDate, excludeWeekends = false) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const current = new Date(today);
  while (current < exam) {
    const day = current.getDay();
    if (!excludeWeekends || (day !== 0 && day !== 6)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

/**
 * Main schedule generator.
 *
 * @param {Object} plan       - StudyPlan document
 * @param {Array}  topics     - Array of Topic documents
 * @param {Object} options    - { excludeWeekends, revisionBufferPercent }
 * @returns {Array}           - Array of session objects ready for DB insertion
 */
const generateSchedule = (plan, topics, options = {}) => {
  const {
    excludeWeekends = false,
    revisionBufferPercent = 0.2,
  } = options;

  const incompleteTopic = topics.filter(t => !t.isCompleted && t.estimatedHours > t.completedHours);
  if (incompleteTopic.length === 0) return [];

  const dates = getStudyDates(plan.examDate, excludeWeekends);
  if (dates.length === 0) return [];

  const dailyHours = plan.dailyStudyHours || 4;
  const dailyBlocks = hoursToPomodoroBlocks(dailyHours);

  // Split dates: learning phase vs revision phase
  const revisionStartIdx = Math.floor(dates.length * (1 - revisionBufferPercent));
  const learningDates = dates.slice(0, revisionStartIdx);
  const revisionDates = dates.slice(revisionStartIdx);

  // Score and sort topics
  const scoredTopics = incompleteTopic
    .map(t => ({ ...t.toObject(), score: scoreTopic(t), _id: t._id }))
    .sort((a, b) => b.score - a.score);

  const sessions = [];

  // â”€â”€ Learning phase: weighted distribution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const topicBlocksNeeded = scoredTopics.map(t => ({
    topic: t,
    blocksRemaining: hoursToPomodoroBlocks(Math.max(0, t.estimatedHours - (t.completedHours || 0))),
  }));

  for (const date of learningDates) {
    let blocksLeft = dailyBlocks;
    let topicIdx = 0;

    while (blocksLeft > 0 && topicIdx < topicBlocksNeeded.length) {
      // Skip exhausted topics
      while (topicIdx < topicBlocksNeeded.length && topicBlocksNeeded[topicIdx].blocksRemaining <= 0) {
        topicIdx++;
      }
      if (topicIdx >= topicBlocksNeeded.length) break;

      const entry = topicBlocksNeeded[topicIdx];

      // Allocate max 2 hours (4 blocks) per topic per day to ensure variety
      const maxBlocksToday = Math.min(4, entry.blocksRemaining, blocksLeft);
      const plannedMinutes = maxBlocksToday * BLOCK_MINUTES;

      sessions.push({
        user: plan.user,
        plan: plan._id,
        topic: entry.topic._id,
        date: new Date(date),
        plannedMinutes,
        status: 'pending',
      });

      entry.blocksRemaining -= maxBlocksToday;
      blocksLeft -= maxBlocksToday;
      topicIdx++;
    }
  }

  // â”€â”€ Revision phase: cycle through all topics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let revTopicIdx = 0;
  for (const date of revisionDates) {
    let blocksLeft = dailyBlocks;

    while (blocksLeft > 0) {
      const topic = scoredTopics[revTopicIdx % scoredTopics.length];
      const blocksForTopic = Math.min(2, blocksLeft); // 1 hour max per topic in revision
      const plannedMinutes = blocksForTopic * BLOCK_MINUTES;

      sessions.push({
        user: plan.user,
        plan: plan._id,
        topic: topic._id,
        date: new Date(date),
        plannedMinutes,
        status: 'pending',
      });

      blocksLeft -= blocksForTopic;
      revTopicIdx++;
    }
  }

  return sessions;
};

/**
 * Calculate readiness score (0â€“100) based on topic confidence and completion.
 */
const calcReadinessScore = (topics) => {
  if (!topics.length) return 0;
  const total = topics.reduce((sum, t) => {
    const completion = Math.min(100, (t.completedHours / t.estimatedHours) * 100) || 0;
    return sum + (completion * 0.6 + (t.confidence || 0) * 0.4);
  }, 0);
  return Math.round(total / topics.length);
};

module.exports = { generateSchedule, calcReadinessScore, getStudyDates };