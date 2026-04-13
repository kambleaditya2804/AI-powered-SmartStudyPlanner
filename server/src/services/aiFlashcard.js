const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate flashcards from raw notes text.
 * @param {string} notes - raw text notes
 * @param {number} count - number of flashcards to generate (default 10)
 */
const generateFlashcardsFromNotes = async (notes, count = 10) => {
  const prompt = `You are a study assistant. Read the following notes and generate ${count} flashcards.

NOTES:
"""
${notes.slice(0, 4000)}
"""

Return ONLY a valid JSON array with this exact structure, no extra text, no markdown:
[
  {
    "front": "Question or concept to remember?",
    "back": "Clear, concise answer or explanation."
  }
]

Rules:
- Extract the most important concepts, definitions, and facts
- Front should be a question or a prompt
- Back should be a concise answer (1-3 sentences max)
- Generate exactly ${count} flashcards
- Return pure JSON only, no code blocks, no extra text`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 3000,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const flashcards = JSON.parse(cleaned);

  return flashcards;
};

module.exports = { generateFlashcardsFromNotes };