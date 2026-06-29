export default function Loading() {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-6xl space-y-5 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl bg-white/5" />
        <div className="h-4 w-64 rounded-lg bg-white/[0.03]" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-white/5" />
              <div className="h-4 w-4 rounded bg-white/5" />
            </div>
            <div className="h-7 w-32 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>

      {/* Main content block */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <div className="h-4 w-36 rounded bg-white/5" />
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-white/5" />
                  <div className="h-3 w-20 rounded bg-white/[0.03]" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
