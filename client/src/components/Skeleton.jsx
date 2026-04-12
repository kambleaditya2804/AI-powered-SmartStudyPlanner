export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SessionSkeleton() {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-800 p-4 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2 w-24" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function TopicSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card flex flex-col gap-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2 w-48" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card h-56 flex flex-col items-center justify-center gap-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-28 mt-4" />
    </div>
  );
}