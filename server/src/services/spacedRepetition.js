/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0â€“5 (0-1 = blackout/wrong, 2 = correct with difficulty, 3-5 = correct)
 */

const sm2 = (quality, easeFactor, interval, repetitions) => {
  if (quality < 0 || quality > 5) throw new Error('quality must be 0â€“5');

  let newEF = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0)      newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else                        newInterval = Math.round(interval * easeFactor);

    newRepetitions = repetitions + 1;
  } else {
    // Incorrect â€” reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor (stays >= 1.3)
  newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: parseFloat(newEF.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
};

/**
 * Apply SM-2 to a topic or flashcard document.
 * Updates the sr fields in-place and returns the updated doc.
 */
const applyReview = (doc, quality) => {
  const sr = doc.sr || {
    easeFactor: doc.easeFactor ?? 2.5,
    interval: doc.interval ?? 1,
    repetitions: doc.repetitions ?? 0,
  };

  const result = sm2(quality, sr.easeFactor, sr.interval, sr.repetitions);

  // Handle both Topic (nested sr) and Flashcard (flat fields)
  if (doc.sr) {
    Object.assign(doc.sr, result);
  } else {
    Object.assign(doc, result);
  }

  return doc;
};

/**
 * Get all topics/flashcards due for review today.
 */
const getDueItems = (items) => {
  const now = new Date();
  return items.filter(item => {
    const reviewDate = item.sr?.nextReviewDate ?? item.nextReviewDate;
    return reviewDate && new Date(reviewDate) <= now;
  });
};

module.exports = { sm2, applyReview, getDueItems };
