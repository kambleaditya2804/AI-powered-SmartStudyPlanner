import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function RadialProgress({ value, size = 120, color = '#6366f1' }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400">{d.value}h</span>
          <div className="w-full bg-gray-800 rounded-t" style={{ height: `${(d.value / max) * 80}px` }}>
            <div className="w-full h-full bg-primary-500 rounded-t opacity-80" />
          </div>
          <span className="text-xs text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Progress() {
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/progress/me').then(r => r.data.stats),
  });

  const activePlan = plans?.[0];

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['plan-progress', activePlan?._id],
    queryFn: () => api.get(`/progress/${activePlan._id}`).then(r => r.data.analytics),
    enabled: !!activePlan?._id,
  });

  if (!activePlan) return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">
      No study plan found. <a href="/onboarding" className="text-primary-400 hover:underline">Create one first.</a>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-800" />)}
      </div>
    </div>
  );

  const subjectChartData = analytics?.subjectBreakdown?.map(s => ({
    label: s.subject,
    value: parseFloat(s.completedHours.toFixed(1)),
  })) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Progress & Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">{activePlan.title} · {analytics?.daysLeft} days left</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Streak',         value: `${userStats?.streak ?? 0}d`,  color: 'text-amber-400' },
          { label: 'Total XP',       value: userStats?.xp ?? 0,            color: 'text-primary-400' },
          { label: 'Hours studied',  value: `${analytics?.hours.completed ?? 0}h`, color: 'text-green-400' },
          { label: 'This week',      value: `${analytics?.hours.weekly ?? 0}h`,    color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Readiness */}
        <div className="card flex flex-col items-center gap-3">
          <h3 className="font-semibold self-start">Exam readiness</h3>
          <RadialProgress value={analytics?.readinessScore ?? 0} size={140} />
          <p className="text-xs text-gray-400 text-center">
            Based on topic completion and confidence levels
          </p>
        </div>

        {/* Session stats */}
        <div className="card">
          <h3 className="font-semibold mb-4">Sessions overview</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Total sessions',    value: analytics?.sessions.total,        color: 'text-gray-300' },
              { label: 'Completed',         value: analytics?.sessions.completed,     color: 'text-green-400' },
              { label: 'Skipped',           value: analytics?.sessions.skipped,       color: 'text-rose-400'  },
              { label: 'Completion rate',   value: `${analytics?.sessions.completionRate ?? 0}%`, color: 'text-primary-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={`font-semibold ${color}`}>{value ?? '—'}</span>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${analytics?.sessions.completionRate ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject breakdown */}
      {analytics?.subjectBreakdown?.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-5">Subject breakdown</h3>
          <div className="flex flex-col gap-4">
            {analytics.subjectBreakdown.map(s => (
              <div key={s.subject}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-gray-400">{s.completedHours}h / {s.estimatedHours}h · {s.completionPct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${s.completionPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{s.topicCount} topics</span>
                  <span>Avg confidence: {s.avgConfidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours by subject chart */}
      {subjectChartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-5">Hours studied by subject</h3>
          <BarChart data={subjectChartData} />
        </div>
      )}
    </div>
  );
}