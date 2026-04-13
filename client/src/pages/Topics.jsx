import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import YouTubeResources from '../components/YouTubeResources';

const priorityColors = {
  5: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  4: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  3: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  2: 'bg-gray-700 text-gray-300 border-gray-600',
  1: 'bg-gray-800 text-gray-400 border-gray-700',
};
const priorityLabels = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Very low' };
const difficultyLabels = { 5: 'Very hard', 4: 'Hard', 3: 'Medium', 2: 'Easy', 1: 'Very easy' };

function TopicRow({ topic, planId, onEdit }) {
  const qc = useQueryClient();
  const pct = Math.min(100, Math.round((topic.completedHours / topic.estimatedHours) * 100));

  const deleteTopic = useMutation({
    mutationFn: () => api.delete(`/plans/${planId}/topics/${topic._id}`),
    onSuccess: () => qc.invalidateQueries(['topics', planId]),
  });

  const toggleComplete = useMutation({
    mutationFn: () => api.patch(`/plans/${planId}/topics/${topic._id}`, { isCompleted: !topic.isCompleted }),
    onSuccess: () => qc.invalidateQueries(['topics', planId]),
  });

  return (
    <div className={`card transition-all ${topic.isCompleted ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => toggleComplete.mutate()}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              topic.isCompleted ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-primary-500'
            }`}
          >
            {topic.isCompleted && <span className="text-white text-xs">✓</span>}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-semibold ${topic.isCompleted ? 'line-through text-gray-500' : ''}`}>
                {topic.name}
              </span>
              <span className={`badge border ${priorityColors[topic.priority]}`}>
                {priorityLabels[topic.priority]}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {topic.subject} · {difficultyLabels[topic.difficulty]} · {topic.estimatedHours}h estimated
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${topic.isCompleted ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 shrink-0">{pct}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i <= Math.round(topic.confidence / 20) ? 'bg-primary-500' : 'bg-gray-700'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{topic.confidence}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(topic)} className="btn-ghost text-xs px-3 py-1.5">Edit</button>
          <button
            onClick={() => deleteTopic.mutate()}
            className="text-xs text-gray-500 hover:text-rose-400 px-2 py-1.5 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ topic, planId, onClose }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'resources'
  const [form, setForm] = useState({
    confidence: topic.confidence || 0,
    priority: topic.priority,
    difficulty: topic.difficulty,
    estimatedHours: topic.estimatedHours,
  });

  const update = useMutation({
    mutationFn: () => api.patch(`/plans/${planId}/topics/${topic._id}`, form),
    onSuccess: () => { qc.invalidateQueries(['topics', planId]); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{topic.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-gray-800 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'edit' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'resources' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎬 Resources
          </button>
        </div>

        {/* Edit tab */}
        {activeTab === 'edit' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Confidence: <span className="text-primary-400 font-semibold">{form.confidence}%</span>
              </label>
              <input
                type="range" min="0" max="100" step="5"
                value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Priority: <span className="text-amber-400">{priorityLabels[form.priority]}</span>
              </label>
              <input
                type="range" min="1" max="5" step="1"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Difficulty: <span className="text-rose-400">{difficultyLabels[form.difficulty]}</span>
              </label>
              <input
                type="range" min="1" max="5" step="1"
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: parseInt(e.target.value) }))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Estimated hours</label>
              <input
                type="number" min="0.5" step="0.5"
                value={form.estimatedHours}
                onChange={e => setForm(f => ({ ...f, estimatedHours: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={() => update.mutate()} className="btn-primary flex-1 py-2.5">
                {update.isPending ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={onClose} className="btn-ghost flex-1 py-2.5">Cancel</button>
            </div>
          </div>
        )}

        {/* Resources tab */}
        {activeTab === 'resources' && (
          <YouTubeResources topic={topic} />
        )}
      </div>
    </div>
  );
}

export default function Topics() {
  const [editingTopic, setEditingTopic] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const activePlan = plans?.[0];

  const { data, isLoading } = useQuery({
    queryKey: ['topics', activePlan?._id],
    queryFn: () => api.get(`/plans/${activePlan._id}/topics`).then(r => r.data.topics),
    enabled: !!activePlan?._id,
  });

  const topics = data ?? [];

  const filtered = topics.filter(t => {
    if (filter === 'completed') return t.isCompleted;
    if (filter === 'pending')   return !t.isCompleted;
    return true;
  });

  const totalHours = topics.reduce((s, t) => s + t.estimatedHours, 0);
  const completedHours = topics.reduce((s, t) => s + t.completedHours, 0);

  if (!activePlan) return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">
      No study plan found. <a href="/onboarding" className="text-primary-400 hover:underline">Create one first.</a>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Topics</h1>
          <p className="text-gray-400 text-sm mt-0.5">{activePlan.title}</p>
        </div>
        <a href="/onboarding" className="btn-primary text-sm px-4 py-2">+ Add topics</a>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Overall progress</span>
          <span className="font-medium">{completedHours.toFixed(1)} / {totalHours}h</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: totalHours ? `${(completedHours / totalHours) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span>✅ {topics.filter(t => t.isCompleted).length} completed</span>
          <span>📖 {topics.filter(t => !t.isCompleted && t.completedHours > 0).length} in progress</span>
          <span>📋 {topics.filter(t => t.completedHours === 0).length} not started</span>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl w-fit mb-5">
        {['all', 'pending', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm">No topics here yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(topic => (
            <TopicRow
              key={topic._id}
              topic={topic}
              planId={activePlan._id}
              onEdit={setEditingTopic}
            />
          ))}
        </div>
      )}

      {editingTopic && (
        <EditModal
          topic={editingTopic}
          planId={activePlan._id}
          onClose={() => setEditingTopic(null)}
        />
      )}
    </div>
  );
}