interface Props {
  text?: string;
}

export default function OrbitLoader({ text = "Loading..." }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Core Planet */}
        <div className="w-8 h-8 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300 z-10"></div>
        
        {/* Inner Orbit */}
        <div className="absolute w-16 h-16 border-2 border-indigo-200 rounded-full animate-[spin_2s_linear_infinite]">
          <div className="absolute top-0 left-1/2 w-3 h-3 bg-indigo-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm"></div>
        </div>
        
        {/* Outer Orbit */}
        <div className="absolute w-24 h-24 border-2 border-slate-200 rounded-full animate-[spin_3.5s_linear_infinite_reverse]">
           <div className="absolute top-1/2 right-0 w-2.5 h-2.5 bg-slate-400 rounded-full translate-x-1/2 -translate-y-1/2 shadow-sm"></div>
        </div>
      </div>
      <p className="mt-8 text-sm font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
        {text}
      </p>
    </div>
  );
}