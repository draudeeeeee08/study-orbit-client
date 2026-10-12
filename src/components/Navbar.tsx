import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
          <img
            src="/study-orbit-logo.png"
            alt="Study Orbit Logo"
            className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
            Study Orbit
          </span>
        </Link>

        {/* Desktop Menu (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-6">
          <Link to="/subjects" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">My Subjects</Link>
          <Link to="/stats" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Statistics</Link>
          <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">About</Link>
        </div>

        {/* Hamburger Button (Visible only on mobile) */}
        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-500 hover:text-slate-700 focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
            <Link to="/subjects" onClick={closeMenu} className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">My Subjects</Link>
            <Link to="/stats" onClick={closeMenu} className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">Statistics</Link>
            <Link to="/about" onClick={closeMenu} className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">About</Link>
          </div>
        </div>
      )}
    </nav>
  );
}