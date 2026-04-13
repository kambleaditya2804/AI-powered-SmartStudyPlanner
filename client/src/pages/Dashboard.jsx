import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import TodaySchedule from '../components/TodaySchedule';
import { StatsSkeleton } from '../components/Skeleton';

function ReadinessRing({ value }) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const filled = (value / 100) * circ;
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#6366f1';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold">{value}%</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, sub }) {
  return (
    <Link to={to} className="card hover:border-primary-500/50 hover:bg-gray-800/50 transition-colors flex items-center gap-3 py-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useSelector(state => state.auth);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/progress/me').then(r => r.data.stats),
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const activePlan = plans?.[0];

  const { data: progress } = useQuery({
    queryKey: ['plan-progress', activePlan?._id],
    queryFn: () => api.get(`/progress/${activePlan._id}`).then(r => r.data.analytics),
    enabled: !!activePlan?._id,
  });

  const { data: dueFlashcards } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => api.get('/flashcards/due').then(r => r.data.cards),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          {activePlan ? (
            <p className="text-gray-400 mt-1 text-sm">
              <span className="text-white font-medium">{activePlan.title}</span>
              {' · '}
              <span className="text-primary-400 font-medium">{progress?.daysLeft ?? '—'} days left</span>
            </p>
          ) : (
            <p className="text-gray-400 mt-1 text-sm">No active plan yet</p>
          )}
        </div>
        {(stats?.streak ?? 0) > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-sm font-medium">
            🔥 {stats.streak} day streak
          </div>
        )}
      </div>

      {/* Stats */}
      {statsLoading || plansLoading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatsCard label="Readiness"     value={`${progress?.readinessScore ?? 0}%`} sub="Exam readiness"    color="indigo" />
          <StatsCard label="XP"            value={stats?.xp ?? 0}                      sub="Total earned"      color="green"  />
          <StatsCard label="Hours studied" value={`${stats?.totalHoursStudied ?? 0}h`} sub="All time"          color="rose"   />
          <StatsCard label="Sessions done" value={stats?.totalSessionsCompleted ?? 0}  sub="Completed"         color="amber"  />
        </div>
      )}

      {/* No plan CTA */}
      {!plansLoading && !activePlan && (
        <div className="card border-dashed border-gray-600 text-center py-12 mb-6">
          <p className="text-4xl mb-3">📖</p>
          <h2 className="font-semibold text-lg mb-1">Start your study journey</h2>
          <p className="text-gray-400 text-sm mb-5">Create a plan, add topics, and get a personalized schedule.</p>
          <Link to="/onboarding" className="btn-primary px-6 py-2.5">Create your first plan →</Link>
        </div>
      )}

      {/* Main grid */}
      {activePlan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>

          <div className="flex flex-col gap-4">
            {progress && (
              <div className="card">
                <div className="flex items-center gap-4 mb-4">
                  <ReadinessRing value={progress.readinessScore} />
                  <div>
                    <p className="font-semibold">Exam readiness</p>
                    <p className="text-xs text-gray-400 mt-0.5">{progress.daysLeft} days remaining</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-green-400">✅ {progress.topics.completed} done</span>
                      <span className="text-blue-400">📖 {progress.topics.inProgress} active</span>
                    </div>
                  </div>
                </div>
                {progress.subjectBreakdown?.length > 0 && (
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-800">
                    {progress.subjectBreakdown.map(s => (
                      <div key={s.subject}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{s.subject}</span>
                          <span className="text-gray-500">{s.completionPct}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${s.completionPct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(dueFlashcards?.length ?? 0) > 0 && (
              <Link to="/flashcards" className="card hover:border-primary-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Flashcards due</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dueFlashcards.length} cards need review</p>
                  </div>
                  <span className="text-2xl">🃏</span>
                </div>
                <div className="mt-3 btn-primary text-xs text-center py-1.5 rounded-lg">Start review →</div>
              </Link>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Quick actions</p>
              <QuickAction to="/pomodoro"   icon="🍅" label="Start Pomodoro"    sub="Focus for 25 minutes" />
              <QuickAction to="/schedule"   icon="📅" label="View schedule"     sub="See your weekly plan" />
              <QuickAction to="/flashcards" icon="🃏" label="Review flashcards" sub={`${dueFlashcards?.length ?? 0} cards due`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}