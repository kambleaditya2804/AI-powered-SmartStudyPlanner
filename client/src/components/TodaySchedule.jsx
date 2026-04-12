import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const statusColors = {
  pending:     'bg-gray-700 text-gray-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed:   'bg-green-500/20 text-green-300',
  skipped:     'bg-gray-800 text-gray-500 line-through',
};

const priorityLabel = (p) => {
  if (p >= 5) return { label: 'Critical', cls: 'bg-rose-500/20 text-rose-300' };
  if (p >= 4) return { label: 'High',     cls: 'bg-amber-500/20 text-amber-300' };
  if (p >= 3) return { label: 'Medium',   cls: 'bg-blue-500/20 text-blue-300' };
  return       { label: 'Low',            cls: 'bg-gray-700 text-gray-400' };
};

function SessionCard({ session, onComplete, onSkip }) {
  const [rating, setRating] = useState(4);
  const [showRating, setShowRating] = useState(false);
  const topic = session.topic;
  const pri = priorityLabel(topic?.priority);

  return (
    <div className={`rounded-xl border border-gray-800 p-4 transition-all ${
      session.status === 'completed' ? 'opacity-50' : 'bg-gray-900 hover:border-gray-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm truncate">{topic?.name ?? 'Unknown topic'}</span>
            <span className={`badge ${pri.cls}`}>{pri.label}</span>
            <span className={`badge ${statusColors[session.status]}`}>{session.status}</span>
          </div>
          <p className="text-xs text-gray-400">{topic?.subject} · {session.plannedMinutes} min</p>
        </div>

        {session.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowRating(true)}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Done
            </button>
            <button
              onClick={() => onSkip(session._id)}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* SR quality rating */}
      {showRating && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">How well did you know this? (0 = blank, 5 = perfect)</p>
          <div className="flex gap-1 mb-3">
            {[0, 1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setRating(q)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  rating === q ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onComplete(session._id, rating); setShowRating(false); }}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Confirm
            </button>
            <button onClick={() => setShowRating(false)} className="btn-ghost text-xs px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TodaySchedule() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['today-sessions'],
    queryFn: () => api.get('/sessions/today').then(r => r.data.sessions),
  });

  const complete = useMutation({
    mutationFn: ({ id, srQuality }) =>
      api.patch(`/sessions/${id}`, { status: 'completed', completedMinutes: 25, srQuality }),
    onSuccess: () => qc.invalidateQueries(['today-sessions']),
  });

  const skip = useMutation({
    mutationFn: (id) => api.patch(`/sessions/${id}`, { status: 'skipped' }),
    onSuccess: () => qc.invalidateQueries(['today-sessions']),
  });

  if (isLoading) return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl mb-3" />)}
    </div>
  );

  if (isError) return (
    <div className="card border-rose-500/20 text-rose-400 text-sm">
      Failed to load today's sessions.
    </div>
  );

  const done = data?.filter(s => s.status === 'completed').length ?? 0;
  const total = data?.length ?? 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Today's Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">{done}/{total} sessions completed</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-400">{Math.round((done/total)*100)}%</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(done/total)*100}%` }}
          />
        </div>
      )}

      {/* Sessions */}
      <div className="flex flex-col gap-3">
        {total === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm">No sessions today — enjoy your break!</p>
          </div>
        ) : (
          data.map(session => (
            <SessionCard
              key={session._id}
              session={session}
              onComplete={(id, srQuality) => complete.mutate({ id, srQuality })}
              onSkip={(id) => skip.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}