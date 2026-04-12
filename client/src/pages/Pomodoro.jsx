import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const MODES = {
  focus:      { label: 'Focus',       minutes: 25, color: 'text-primary-400', ring: 'stroke-indigo-500' },
  short:      { label: 'Short break', minutes: 5,  color: 'text-green-400',   ring: 'stroke-green-500'  },
  long:       { label: 'Long break',  minutes: 15, color: 'text-amber-400',   ring: 'stroke-amber-500'  },
};

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function Pomodoro() {
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const intervalRef = useRef(null);
  const totalSeconds = MODES[mode].minutes * 60;
  const progress = (secondsLeft / totalSeconds) * 100;

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const { data: topics } = useQuery({
    queryKey: ['topics', plans?.[0]?._id],
    queryFn: () => api.get(`/plans/${plans[0]._id}/topics`).then(r => r.data.topics),
    enabled: !!plans?.[0]?._id,
  });

  // Update title bar
  useEffect(() => {
    document.title = running ? `${formatTime(secondsLeft)} — StudyPlanner` : 'StudyPlanner';
    return () => { document.title = 'StudyPlanner'; };
  }, [secondsLeft, running]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'focus') setSessions(n => n + 1);
            playDing();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const playDing = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(MODES[m].minutes * 60);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(MODES[mode].minutes * 60);
  };

  // SVG circle progress
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;

  const currentMode = MODES[mode];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Pomodoro Timer</h1>
      <p className="text-gray-400 text-sm mb-8">Stay focused, take breaks, get things done.</p>

      {/* Mode switcher */}
      <div className="flex gap-2 mb-8 bg-gray-900 p-1 rounded-xl w-fit">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
            <circle
              cx="110" cy="110" r={radius}
              fill="none"
              className={currentMode.ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold font-mono ${currentMode.color}`}>
              {formatTime(secondsLeft)}
            </span>
            <span className="text-gray-400 text-sm mt-1">{currentMode.label}</span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex gap-2 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < (sessions % 4) ? 'bg-primary-500' : 'bg-gray-700'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{sessions} pomodoros today</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center mb-8">
        <button onClick={reset} className="btn-ghost px-6 py-3 text-sm">Reset</button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-10 py-3 rounded-xl font-semibold text-white transition-colors ${
            running ? 'bg-gray-700 hover:bg-gray-600' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {running ? 'Pause' : secondsLeft === totalSeconds ? 'Start' : 'Resume'}
        </button>
      </div>

      {/* Topic selector */}
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Studying topic</h3>
        {topics?.length > 0 ? (
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">— Select a topic —</option>
            {topics.map(t => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.subject})
              </option>
            ))}
          </select>
        ) : (
          <p className="text-gray-500 text-sm">No topics yet — create a plan first.</p>
        )}

        {/* Quick tips */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Pomodoro technique</p>
          <ul className="text-xs text-gray-400 flex flex-col gap-1.5">
            <li>🍅 Work for 25 minutes without distractions</li>
            <li>☕ Take a 5 minute break after each session</li>
            <li>🌴 Take a 15 minute break after 4 sessions</li>
            <li>🔁 Repeat until your daily goal is hit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}