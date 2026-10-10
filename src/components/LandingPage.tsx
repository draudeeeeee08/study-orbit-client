import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
          Smarter Flashcards for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Serious Students.</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Study Orbit helps you study smarter with flashcards, organized subjects, and scheduled reviews. Learn at your own pace, remember important information, and make every study session count.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            to="/subjects" 
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            Go to My Subjects
          </Link>
        </div>
        
      </div>
      
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
}