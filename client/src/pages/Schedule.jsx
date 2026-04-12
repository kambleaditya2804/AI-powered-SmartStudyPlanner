import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getWeekDates = (referenceDate) => {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
};

const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate();
};

const isToday = (date) => isSameDay(date, new Date());

const subjectColor = (subject) => {
  const colors = [
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  ];
  let hash = 0;
  for (const c of (subject || '')) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
};

const statusIcon = { pending: '⏳', in_progress: '▶️', completed: '✅', skipped: '⏭️' };

// ─── Session pill ─────────────────────────────────────────────────────────────
function SessionPill({ session, onClick }) {
  const color = subjectColor(session.topic?.subject);
  return (
    <button
      onClick={() => onClick(session)}
      className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs mb-1 transition-all hover:scale-[1.02] ${color} ${
        session.status === 'completed' ? 'opacity-40 line-through' : ''
      } ${session.status === 'skipped' ? 'opacity-30' : ''}`}
    >
      <div className="font-medium truncate">{session.topic?.name ?? 'Session'}</div>
      <div className="opacity-70">{session.plannedMinutes}min</div>
    </button>
  );
}

// ─── Session detail modal ─────────────────────────────────────────────────────
function SessionModal({ session, planId, onClose }) {
  const qc = useQueryClient();
  const [srQuality, setSrQuality] = useState(4);

  const update = useMutation({
    mutationFn: (body) => api.patch(`/plans/${planId}/sessions/${session._id}`, body),
    onSuccess: () => { qc.invalidateQueries(['schedule']); onClose(); },
  });

  const color = subjectColor(session.topic?.subject);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Session details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        {/* Topic info */}
        <div className={`rounded-xl border px-4 py-3 mb-4 ${color}`}>
          <p className="font-semibold">{session.topic?.name ?? 'Unknown'}</p>
          <p className="text-xs opacity-70 mt-0.5">{session.topic?.subject}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Date</span>
            <span>{new Date(session.date).toDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Duration</span>
            <span>{session.plannedMinutes} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span>{statusIcon[session.status]} {session.status}</span>
          </div>
        </div>

        {session.status === 'pending' && (
          <>
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">
                How well did you know this? <span className="text-primary-400">{srQuality}/5</span>
              </p>
              <div className="flex gap-1">
                {[0,1,2,3,4,5].map(q => (
                  <button
                    key={q}
                    onClick={() => setSrQuality(q)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                      srQuality === q ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => update.mutate({ status: 'completed', completedMinutes: session.plannedMinutes, srQuality })}
                className="btn-primary flex-1 py-2"
              >
                {update.isPending ? '...' : '✅ Complete'}
              </button>
              <button
                onClick={() => update.mutate({ status: 'skipped' })}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Skip
              </button>
            </div>
          </>
        )}

        {session.status !== 'pending' && (
          <button
            onClick={() => update.mutate({ status: 'pending', completedMinutes: 0 })}
            className="btn-ghost w-full py-2 text-sm"
          >
            Mark as pending
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Schedule page ───────────────────────────────────────────────────────
export default function Schedule() {
  const [weekRef, setWeekRef] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const weekDates = getWeekDates(weekRef);
  const startDate = weekDates[0].toISOString().split('T')[0];
  const endDate   = weekDates[6].toISOString().split('T')[0];

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const activePlan = plans?.[0];

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', activePlan?._id, startDate],
    queryFn: () => api.get(`/plans/${activePlan._id}/sessions`, {
      params: { startDate, endDate },
    }).then(r => r.data.sessions),
    enabled: !!activePlan?._id,
  });

  const sessions = data ?? [];

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const goToday = () => setWeekRef(new Date());

  // Stats for this week
  const completed = sessions.filter(s => s.status === 'completed').length;
  const total     = sessions.length;
  const totalMins = sessions.filter(s => s.status === 'completed').reduce((s, x) => s + x.completedMinutes, 0);

  if (!activePlan) return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-400">
      No study plan found. <a href="/onboarding" className="text-primary-400 hover:underline">Create one first.</a>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-gray-400 text-sm mt-0.5">{activePlan.title}</p>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="btn-ghost px-3 py-2 text-sm">←</button>
          <button onClick={goToday}  className="btn-ghost px-3 py-2 text-sm">Today</button>
          <button onClick={nextWeek} className="btn-ghost px-3 py-2 text-sm">→</button>
        </div>
      </div>

      {/* Week label */}
      <p className="text-sm text-gray-400 mb-4">
        {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} — {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getDate()}, {weekDates[6].getFullYear()}
      </p>

      {/* Weekly stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Sessions',  value: `${completed}/${total}` },
          { label: 'Hours',     value: `${(totalMins/60).toFixed(1)}h`  },
          { label: 'Completion',value: total ? `${Math.round((completed/total)*100)}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-bold text-primary-400">{value}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const daySessions = sessions.filter(s => isSameDay(s.date, date));
            const today = isToday(date);

            return (
              <div
                key={i}
                className={`rounded-xl border p-2 min-h-36 transition-colors ${
                  today
                    ? 'border-primary-500/50 bg-primary-500/5'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {/* Day header */}
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-500">{DAYS[date.getDay()]}</p>
                  <p className={`text-sm font-semibold ${today ? 'text-primary-400' : 'text-gray-300'}`}>
                    {date.getDate()}
                  </p>
                  {today && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-0.5" />}
                </div>

                {/* Sessions */}
                <div>
                  {daySessions.length === 0 ? (
                    <p className="text-center text-gray-700 text-xs mt-4">—</p>
                  ) : (
                    daySessions.map(session => (
                      <SessionPill
                        key={session._id}
                        session={session}
                        onClick={setSelectedSession}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {sessions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {[...new Set(sessions.map(s => s.topic?.subject).filter(Boolean))].map(subject => (
            <div key={subject} className={`badge border ${subjectColor(subject)}`}>
              {subject}
            </div>
          ))}
        </div>
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          planId={activePlan._id}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}