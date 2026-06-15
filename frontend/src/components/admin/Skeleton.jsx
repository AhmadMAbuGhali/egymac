/**
 * Admin dashboard skeletal loaders — smooth placeholders during async fetches.
 */

export function Skeleton({ className = "", style }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-surface-muted via-accent-light/30 to-surface-muted bg-[length:200%_100%] ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 ? "72%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div
      className="rounded-xl border border-border/70 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="h-10 bg-accent/20 animate-pulse" />
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-3 p-3 bg-surface">
            {Array.from({ length: cols }, (_, c) => (
              <Skeleton key={c} className="h-4 flex-1" style={{ maxWidth: c === 0 ? "18%" : undefined }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div className="workspace-panel space-y-4" aria-busy="true" aria-label="Loading panel">
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4" aria-busy="true" aria-label="Loading cards">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border/70 p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function AuthGateSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-muted/50 bg-tech-grid py-12">
      <div className="bg-surface border border-border/70 rounded-2xl shadow-soft-lg p-8 sm:p-10 w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <SkeletonText lines={2} />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
