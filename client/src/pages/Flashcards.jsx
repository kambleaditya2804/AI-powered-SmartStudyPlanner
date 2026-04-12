import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

// ─── Flip card component ──────────────────────────────────────────────────────
function FlipCard({ card, onRate }) {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const handleRate = (q) => {
    setRated(true);
    onRate(card._id, q);
    setTimeout(() => { setFlipped(false); setRated(false); }, 400);
  };

  const qualityLabels = [
    { q: 0, label: 'Blank',   cls: 'bg-rose-700 hover:bg-rose-600' },
    { q: 1, label: 'Wrong',   cls: 'bg-rose-600 hover:bg-rose-500' },
    { q: 2, label: 'Hard',    cls: 'bg-orange-600 hover:bg-orange-500' },
    { q: 3, label: 'OK',      cls: 'bg-yellow-600 hover:bg-yellow-500' },
    { q: 4, label: 'Good',    cls: 'bg-green-600 hover:bg-green-500' },
    { q: 5, label: 'Perfect', cls: 'bg-emerald-600 hover:bg-emerald-500' },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => !rated && setFlipped(f => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 card flex flex-col items-center justify-center text-center p-8 border-primary-500/30"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Question</p>
            <p className="text-xl font-semibold leading-relaxed">{card.front}</p>
            {card.topic && (
              <p className="text-xs text-gray-500 mt-4">{card.topic.name} · {card.topic.subject}</p>
            )}
            <p className="text-xs text-gray-600 mt-6">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 card flex flex-col items-center justify-center text-center p-8 border-green-500/30 bg-gray-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Answer</p>
            <p className="text-xl font-semibold leading-relaxed text-green-300">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Rating buttons — only show when flipped */}
      {flipped && !rated && (
        <div className="w-full max-w-lg">
          <p className="text-xs text-gray-400 text-center mb-3">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {qualityLabels.map(({ q, label, cls }) => (
              <button
                key={q}
                onClick={() => handleRate(q)}
                className={`${cls} text-white text-xs font-medium py-2 rounded-lg transition-colors`}
              >
                {q} — {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!flipped && (
        <p className="text-xs text-gray-500">Click the card to flip it</p>
      )}
    </div>
  );
}

// ─── Create card modal ────────────────────────────────────────────────────────
function CreateModal({ topics, onClose, onCreated }) {
  const [form, setForm] = useState({ front: '', back: '', topicId: '' });
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSingle = async (e) => {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) { setError('Both front and back are required'); return; }
    setLoading(true);
    try {
      await api.post('/flashcards', form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flashcard');
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async (e) => {
    e.preventDefault();
    // Format: Q: ... A: ... separated by blank lines
    const pairs = bulkText.trim().split(/\n\s*\n/).map(block => {
      const lines = block.trim().split('\n');
      const front = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim();
      const back  = lines.find(l => l.startsWith('A:'))?.replace('A:', '').trim();
      return front && back ? { front, back } : null;
    }).filter(Boolean);

    if (pairs.length === 0) { setError('No valid pairs found. Use Q: / A: format.'); return; }
    setLoading(true);
    try {
      await api.post('/flashcards/bulk', { cards: pairs, topicId: form.topicId || undefined });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flashcards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Create flashcards</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-800 p-1 rounded-lg mb-5">
          <button onClick={() => setBulk(false)} className={`flex-1 py-1.5 rounded text-sm transition-colors ${!bulk ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Single</button>
          <button onClick={() => setBulk(true)}  className={`flex-1 py-1.5 rounded text-sm transition-colors ${bulk  ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Bulk import</button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Topic selector */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1">Topic (optional)</label>
          <select
            value={form.topicId}
            onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">— No topic —</option>
            {topics?.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>
            ))}
          </select>
        </div>

        {!bulk ? (
          <form onSubmit={handleSingle} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Front (question)</label>
              <textarea
                rows={3}
                required
                value={form.front}
                onChange={e => setForm(f => ({ ...f, front: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                placeholder="What is Newton's second law?"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Back (answer)</label>
              <textarea
                rows={3}
                required
                value={form.back}
                onChange={e => setForm(f => ({ ...f, back: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                placeholder="F = ma (Force = mass × acceleration)"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary py-2.5">
              {loading ? 'Creating...' : 'Create card'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulk} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Paste cards (Q: / A: format)</label>
              <textarea
                rows={10}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none font-mono"
                placeholder={`Q: What is Newton's second law?\nA: F = ma\n\nQ: What is the speed of light?\nA: 3 × 10⁸ m/s`}
              />
            </div>
            <p className="text-xs text-gray-500">Separate each Q/A pair with a blank line.</p>
            <button type="submit" disabled={loading} className="btn-primary py-2.5">
              {loading ? 'Importing...' : 'Import cards'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Flashcards page ─────────────────────────────────────────────────────
export default function Flashcards() {
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState('due'); // 'due' | 'all'
  const [currentIdx, setCurrentIdx] = useState(0);
  const qc = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const { data: topics } = useQuery({
    queryKey: ['topics', plans?.[0]?._id],
    queryFn: () => api.get(`/plans/${plans[0]._id}/topics`).then(r => r.data.topics),
    enabled: !!plans?.[0]?._id,
  });

  const { data: dueCards, isLoading: dueLoading } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => api.get('/flashcards/due').then(r => r.data.cards),
  });

  const { data: allCards, isLoading: allLoading } = useQuery({
    queryKey: ['flashcards-all'],
    queryFn: () => api.get('/flashcards').then(r => r.data.cards),
  });

  const review = useMutation({
    mutationFn: ({ id, quality }) => api.patch(`/flashcards/${id}/review`, { quality }),
    onSuccess: () => {
      qc.invalidateQueries(['flashcards-due']);
      qc.invalidateQueries(['flashcards-all']);
      setCurrentIdx(i => i + 1);
    },
  });

  const deleteCard = useMutation({
    mutationFn: (id) => api.delete(`/flashcards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['flashcards-due']);
      qc.invalidateQueries(['flashcards-all']);
    },
  });

  const cards = mode === 'due' ? (dueCards ?? []) : (allCards ?? []);
  const isLoading = mode === 'due' ? dueLoading : allLoading;
  const activeCard = cards[currentIdx];
  const isDone = currentIdx >= cards.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {dueCards?.length ?? 0} cards due for review
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
          + New card
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl w-fit mb-8">
        {[
          { key: 'due', label: `Review (${dueCards?.length ?? 0})` },
          { key: 'all', label: `All (${allCards?.length ?? 0})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setCurrentIdx(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card h-56 animate-pulse" />
      ) : cards.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">{mode === 'due' ? '🎉' : '📭'}</p>
          <p className="font-semibold mb-1">
            {mode === 'due' ? 'All caught up!' : 'No flashcards yet'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {mode === 'due' ? 'No cards due for review right now.' : 'Create your first flashcard to get started.'}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
            + Create flashcard
          </button>
        </div>
      ) : isDone ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold mb-1">Session complete!</p>
          <p className="text-gray-400 text-sm mb-4">You reviewed {cards.length} cards.</p>
          <button
            onClick={() => setCurrentIdx(0)}
            className="btn-primary text-sm px-4 py-2"
          >
            Restart session
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(currentIdx / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{currentIdx + 1} / {cards.length}</span>
          </div>

          {/* Active card */}
          <FlipCard
            key={activeCard._id}
            card={activeCard}
            onRate={(id, quality) => review.mutate({ id, quality })}
          />

          {/* Skip */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCurrentIdx(i => i + 1)}
              className="btn-ghost text-xs px-4 py-2"
            >
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* All cards list (when in 'all' mode and done reviewing) */}
      {mode === 'all' && allCards?.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-3 text-sm text-gray-400 uppercase tracking-wider">All cards</h3>
          <div className="flex flex-col gap-2">
            {allCards.map(card => (
              <div key={card._id} className="card flex items-center justify-between gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.front}</p>
                  <p className="text-xs text-gray-400 truncate">{card.back}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-500">
                    Next: {new Date(card.nextReviewDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteCard.mutate(card._id)}
                    className="text-gray-600 hover:text-rose-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          topics={topics}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries(['flashcards-due']);
            qc.invalidateQueries(['flashcards-all']);
          }}
        />
      )}
    </div>
  );
}