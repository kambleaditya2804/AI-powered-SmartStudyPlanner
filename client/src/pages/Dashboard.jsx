import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import StatsCard from '../components/StatsCard';
import TodaySchedule from '../components/TodaySchedule';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/progress/me').then(r => r.data.stats),
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.plans),
  });

  const activePlan = plans?.[0];

  const { data: progress } = useQuery({
    queryKey: ['plan-progress', activePlan?._id],
    queryFn: () => api.get(`/progress/${activePlan._id}`).then(r => r.data.analytics),
    enabled: !!activePlan?._id,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        {activePlan && (
          <p className="text-gray-400 mt-1 text-sm">
            {activePlan.title} · <span className="text-primary-400">{progress?.daysLeft ?? '—'} days left</span>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Readiness"
          value={`${progress?.readinessScore ?? 0}%`}
          sub="Exam readiness score"
          color="indigo"
        />
        <StatsCard
          label="Streak"
          value={`${stats?.streak ?? 0}d`}
          sub="Keep it going!"
          color="amber"
        />
        <StatsCard
          label="XP"
          value={stats?.xp ?? 0}
          sub="Total experience points"
          color="green"
        />
        <StatsCard
          label="Hours studied"
          value={stats?.totalHoursStudied ?? 0}
          sub="All time"
          color="rose"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule — takes 2 columns */}
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Topic breakdown */}
          {progress && (
            <div className="card">
              <h3 className="font-semibold mb-3">Topics overview</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Completed', value: progress.topics.completed, color: 'text-green-400' },
                  { label: 'In progress', value: progress.topics.inProgress, color: 'text-blue-400' },
                  { label: 'Not started', value: progress.topics.notStarted, color: 'text-gray-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Subject breakdown */}
              {progress.subjectBreakdown?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">By subject</p>
                  {progress.subjectBreakdown.map(s => (
                    <div key={s.subject} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{s.subject}</span>
                        <span className="text-gray-400">{s.completionPct}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div
                          className="bg-primary-500 h-1 rounded-full"
                          style={{ width: `${s.completionPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No plan yet */}
          {!activePlan && (
            <div className="card border-dashed border-gray-700 text-center">
              <p className="text-gray-400 text-sm mb-3">No study plan yet</p>
              <a href="/onboarding" className="btn-primary text-sm inline-block">
                Create your first plan
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}