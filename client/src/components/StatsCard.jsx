export default function StatsCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    green:  'bg-green-500/10  text-green-400  border-green-500/20',
    amber:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
    rose:   'bg-rose-500/10   text-rose-400   border-rose-500/20',
  };

  return (
    <div className={`card border ${colors[color]} flex flex-col gap-1`}>
      <p className="text-xs font-medium uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}