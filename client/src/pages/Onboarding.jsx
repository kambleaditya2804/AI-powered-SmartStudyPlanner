import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─── Step indicators ──────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Plan details', 'Add topics', 'Generate schedule'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${i <= current ? 'text-primary-400' : 'text-gray-600'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              i < current  ? 'bg-primary-600 border-primary-600 text-white' :
              i === current ? 'border-primary-500 text-primary-400' :
                              'border-gray-700 text-gray-600'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-sm font-medium hidden sm:block">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 sm:w-16 ${i < current ? 'bg-primary-600' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Plan details ─────────────────────────────────────────────────────
function PlanStep({ onNext }) {
  const [form, setForm] = useState({
    title: '',
    examDate: '',
    goal: '',
    dailyStudyHours: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/plans', form);
      onNext(data.plan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Create your study plan</h2>
        <p className="text-gray-400 text-sm">Tell us about your upcoming exam.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs text-gray-400 block mb-1">Plan title</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
          placeholder="e.g. JEE Mains 2025"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Exam date</label>
        <input
          type="date"
          required
          min={minDate}
          value={form.examDate}
          onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Goal <span className="text-gray-600">(optional)</span></label>
        <input
          type="text"
          value={form.goal}
          onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
          placeholder="e.g. Top 1000 rank"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Daily study hours: <span className="text-primary-400 font-semibold">{form.dailyStudyHours}h</span>
        </label>
        <input
          type="range"
          min="1" max="16" step="0.5"
          value={form.dailyStudyHours}
          onChange={e => setForm(f => ({ ...f, dailyStudyHours: parseFloat(e.target.value) }))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>1h</span><span>16h</span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary py-2.5 mt-1">
        {loading ? 'Creating plan...' : 'Next →'}
      </button>
    </form>
  );
}

// ─── Step 2: Add topics ───────────────────────────────────────────────────────
const EMPTY_TOPIC = { name: '', subject: '', estimatedHours: 2, priority: 3, difficulty: 3 };

function TopicsStep({ plan, onNext }) {
  const [topics, setTopics] = useState([{ ...EMPTY_TOPIC }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setTopics(t => [...t, { ...EMPTY_TOPIC }]);
  const removeRow = (i) => setTopics(t => t.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) =>
    setTopics(t => t.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = topics.filter(t => t.name.trim() && t.subject.trim());
    if (valid.length === 0) { setError('Add at least one topic'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post(`/plans/${plan._id}/topics/bulk`, { topics: valid });
      onNext();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add topics');
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels = ['', 'Very low', 'Low', 'Medium', 'High', 'Critical'];
  const difficultyLabels = ['', 'Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Add your topics</h2>
        <p className="text-gray-400 text-sm">Add all subjects/topics you need to study for <span className="text-white">{plan.title}</span>.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {topics.map((topic, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Topic {i + 1}</span>
              {topics.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-xs text-rose-400 hover:text-rose-300">
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Topic name *</label>
                <input
                  type="text"
                  required
                  value={topic.name}
                  onChange={e => updateRow(i, 'name', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Kinematics"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={topic.subject}
                  onChange={e => updateRow(i, 'subject', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Physics"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hours needed</label>
                <input
                  type="number"
                  min="0.5" max="200" step="0.5"
                  value={topic.estimatedHours}
                  onChange={e => updateRow(i, 'estimatedHours', parseFloat(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Priority: <span className="text-amber-400">{priorityLabels[topic.priority]}</span>
                </label>
                <input
                  type="range" min="1" max="5" step="1"
                  value={topic.priority}
                  onChange={e => updateRow(i, 'priority', parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Difficulty: <span className="text-rose-400">{difficultyLabels[topic.difficulty]}</span>
                </label>
                <input
                  type="range" min="1" max="5" step="1"
                  value={topic.difficulty}
                  onChange={e => updateRow(i, 'difficulty', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full border-2 border-dashed border-gray-700 hover:border-primary-500 text-gray-400 hover:text-primary-400 rounded-xl py-3 text-sm transition-colors"
      >
        + Add another topic
      </button>

      <button type="submit" disabled={loading} className="btn-primary py-2.5">
        {loading ? 'Saving topics...' : 'Next →'}
      </button>
    </form>
  );
}

// ─── Step 3: Generate schedule ────────────────────────────────────────────────
function GenerateStep({ plan, onDone }) {
  const [options, setOptions] = useState({ excludeWeekends: false, revisionBufferPercent: 0.2 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/plans/${plan._id}/sessions/generate`, options);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Generate your schedule</h2>
        <p className="text-gray-400 text-sm">We'll create a smart daily schedule based on your topics and priorities.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!result ? (
        <>
          <div className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Skip weekends</p>
                <p className="text-xs text-gray-500">No study sessions on Sat & Sun</p>
              </div>
              <button
                onClick={() => setOptions(o => ({ ...o, excludeWeekends: !o.excludeWeekends }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${options.excludeWeekends ? 'bg-primary-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${options.excludeWeekends ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">
                Revision buffer: <span className="text-primary-400">{Math.round(options.revisionBufferPercent * 100)}%</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">Percentage of final days reserved for revision only</p>
              <input
                type="range" min="0.1" max="0.4" step="0.05"
                value={options.revisionBufferPercent}
                onChange={e => setOptions(o => ({ ...o, revisionBufferPercent: parseFloat(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>10%</span><span>40%</span>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-primary py-2.5">
            {loading ? 'Generating...' : '✨ Generate my schedule'}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-green-400 font-semibold text-lg">{result.totalSessions} sessions generated!</p>
            <p className="text-gray-400 text-sm mt-1">Readiness score: <span className="text-white font-medium">{result.readinessScore}%</span></p>
          </div>
          <button onClick={onDone} className="btn-primary py-2.5">
            Go to Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding page ─────────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Steps current={step} />
        <div className="card">
          {step === 0 && (
            <PlanStep onNext={(p) => { setPlan(p); setStep(1); }} />
          )}
          {step === 1 && (
            <TopicsStep plan={plan} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <GenerateStep plan={plan} onDone={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}