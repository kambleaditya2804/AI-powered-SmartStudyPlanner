const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate MCQ questions for a topic using Groq (free).
 */
const generateMCQs = async (topicName, subject, count = 10, difficulty = 'medium') => {
  const prompt = `Generate ${count} multiple choice questions about "${topicName}" in ${subject}.
Difficulty level: ${difficulty}.

Return ONLY a valid JSON array with this exact structure, no extra text, no markdown:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]

Rules:
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Make questions conceptual, not just definitions
- Each question must have exactly 4 options
- Explanations should be 1-2 sentences
- Return pure JSON only, no code blocks`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const questions = JSON.parse(cleaned);

  return questions;
};

module.exports = { generateMCQs };