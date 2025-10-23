interface IllustrationSkeletonProps {
  width?: number;
  height?: number;
  className?: string;
}

export function IllustrationSkeleton({
  width = 800,
  height = 400,
  className = ''
}: IllustrationSkeletonProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-slate-800/40 to-slate-900/20 rounded-xl overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 animate-pulse">
            Generating illustration...
          </p>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-shimmer" />
    </div>
  );
}
