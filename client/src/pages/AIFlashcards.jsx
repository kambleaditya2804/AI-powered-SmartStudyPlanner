import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AIFlashcards() {
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(10);
  const [topicId, setTopicId] = useState('');
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [stage, setStage] = useState('input'); // 'input' | 'review' | 'done'
  const [savedCount, setSavedCount] = useState(0);
  const navigate = useNavigate();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const { data: topics } = useQuery({
    queryKey: ['topics', plans?.[0]?._id],
    queryFn: () => api.get(`/plans/${plans[0]._id}/topics`).then(r => r.data.topics),
    enabled: !!plans?.[0]?._id,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/ai-flashcards/generate', { notes, count, topicId: topicId || undefined }),
    onSuccess: (res) => {
      setGeneratedCards(res.data.cards);
      setSelectedCards(new Set(res.data.cards.map((_, i) => i)));
      setStage('review');
    },
  });

  const save = useMutation({
    mutationFn: () => {
      const cards = generatedCards.filter((_, i) => selectedCards.has(i));
      return api.post('/ai-flashcards/save', { cards, topicId: topicId || undefined });
    },
    onSuccess: (res) => {
      setSavedCount(res.data.count);
      setStage('done');
    },
  });

  const toggleCard = (idx) => {
    setSelectedCards(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCards.size === generatedCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(generatedCards.map((_, i) => i)));
    }
  };

  // ── Input stage ────────────────────────────────────────────────────────────
  if (stage === 'input') return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">✨</p>
        <h1 className="text-2xl font-bold">AI Flashcard Generator</h1>
        <p className="text-gray-400 text-sm mt-1">Paste your notes and AI will create flashcards instantly</p>
      </div>

      <div className="card flex flex-col gap-5">
        {generate.isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
            {generate.error?.response?.data?.message || 'Failed to generate. Try again.'}
          </div>
        )}

        {/* Notes textarea */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Paste your notes <span className="text-gray-600">(min 50 characters)</span>
          </label>
          <textarea
            rows={10}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 resize-none font-mono"
            placeholder={`Paste your study notes here...

Example:
Newton's Laws of Motion:
1. First Law: An object at rest stays at rest unless acted upon by a force.
2. Second Law: F = ma (Force = mass × acceleration)
3. Third Law: For every action, there is an equal and opposite reaction.

Kinetic Energy: KE = ½mv² where m is mass and v is velocity...`}
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{notes.length} characters</p>
        </div>

        {/* Count slider */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Number of flashcards: <span className="text-primary-400 font-semibold">{count}</span>
          </label>
          <input
            type="range" min="3" max="20" step="1"
            value={count}
            onChange={e => setCount(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>3</span><span>20</span>
          </div>
        </div>

        {/* Topic selector */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Link to topic <span className="text-gray-600">(optional)</span></label>
          <select
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">— No topic —</option>
            {topics?.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || notes.trim().length < 50}
          className="btn-primary py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generate.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating flashcards...
            </span>
          ) : '✨ Generate flashcards'}
        </button>
      </div>
    </div>
  );

  // ── Review stage ───────────────────────────────────────────────────────────
  if (stage === 'review') return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Review generated cards</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {selectedCards.size} of {generatedCards.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleAll} className="btn-ghost text-sm px-3 py-2">
            {selectedCards.size === generatedCards.length ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={selectedCards.size === 0 || save.isPending}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-40"
          >
            {save.isPending ? 'Saving...' : `Save ${selectedCards.size} cards`}
          </button>
        </div>
      </div>

      {save.isError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg mb-4">
          Failed to save. Try again.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {generatedCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => toggleCard(idx)}
            className={`card cursor-pointer transition-all border-2 ${
              selectedCards.has(idx)
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-gray-800 opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                selectedCards.has(idx) ? 'bg-primary-600 border-primary-600' : 'border-gray-600'
              }`}>
                {selectedCards.has(idx) && <span className="text-white text-xs">✓</span>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Front</p>
                  <p className="text-sm font-medium">{card.front}</p>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Back</p>
                  <p className="text-sm text-gray-300">{card.back}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => save.mutate()}
          disabled={selectedCards.size === 0 || save.isPending}
          className="btn-primary flex-1 py-2.5 disabled:opacity-40"
        >
          {save.isPending ? 'Saving...' : `Save ${selectedCards.size} selected cards`}
        </button>
        <button
          onClick={() => setStage('input')}
          className="btn-ghost px-4 py-2.5"
        >
          Back
        </button>
      </div>
    </div>
  );

  // ── Done stage ─────────────────────────────────────────────────────────────
  if (stage === 'done') return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="card text-center py-12">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-xl font-bold mb-2">{savedCount} flashcards saved!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your AI-generated flashcards have been added to your deck.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/flashcards')} className="btn-primary px-6 py-2.5">
            Start reviewing →
          </button>
          <button
            onClick={() => { setStage('input'); setNotes(''); setGeneratedCards([]); }}
            className="btn-ghost px-6 py-2.5"
          >
            Generate more
          </button>
        </div>
      </div>
    </div>
  );
}