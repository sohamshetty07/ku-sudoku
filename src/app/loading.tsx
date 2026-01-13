export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning Hexagon */}
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-neon-cyan border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Text */}
        <div className="text-center space-y-1">
            <div className="text-neon-cyan font-mono font-bold tracking-[0.2em] text-sm animate-pulse">
                INITIALIZING
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                Loading Assets...
            </div>
        </div>
      </div>
    </div>
  );
}