import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/study-orbit-logo.png"
            alt="Study Orbit Logo"
            className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
          />

          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
            Study Orbit
          </span>
        </Link>

        <div className="flex gap-6 items-center">
          <Link
            to="/subjects"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            My Subjects
          </Link>

          <Link
            to="/about"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            About
          </Link>
        </div>

      </div>
    </nav>
  );
}