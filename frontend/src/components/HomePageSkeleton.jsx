import { Skeleton } from "./admin/Skeleton.jsx";

export default function HomePageSkeleton() {
  return (
    <div className="home-page-skeleton" aria-busy="true" aria-label="Loading homepage content">
      <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-20 bg-surface">
        <div className="absolute inset-0 bg-tech-grid opacity-60" />
        <div className="section-container relative z-10 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <Skeleton className="h-7 w-48 rounded-full" />
              <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
              <Skeleton className="h-12 w-4/5 max-w-lg rounded-xl" />
              <Skeleton className="h-20 w-full max-w-xl rounded-xl" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-11 w-40 rounded-xl" />
                <Skeleton className="h-11 w-36 rounded-xl" />
              </div>
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-80 w-80 mx-auto rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-surface-section border-y border-border">
        <div className="section-container space-y-14">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border/70 p-6 space-y-4 bg-surface">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-muted border-t border-border">
        <div className="section-container text-center space-y-4">
          <Skeleton className="h-4 w-28 mx-auto rounded-full" />
          <Skeleton className="h-9 w-full max-w-md mx-auto rounded-xl" />
          <Skeleton className="h-11 w-48 mx-auto rounded-xl" />
        </div>
      </section>
    </div>
  );
}
