import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import SubjectDashboard from './components/decks/SubjectDashboard';
import DeckDetails from './components/decks/DeckDetails';
import StudyInterface from './components/study/StudyInterface';
import AddCardPage from './components/cards/AddCardPage';
import CardBrowser from './components/cards/CardBrowser';
import StatsOverview from './components/stats/StatsOverview';
import HardestCards from './components/stats/HardestCards';
import SessionHistory from './components/stats/SessionHistory';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Page Not Found</h2>
      <p className="text-slate-600 mb-8 max-w-md">The page you are looking for doesn't exist.</p>
      <a href="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Go Back Home</a>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/subjects" element={<SubjectDashboard />} />
            <Route path="/subjects/:id" element={<DeckDetails />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/study/:deckId" element={<StudyInterface />} />
            <Route path="/decks/:id/add-card" element={<AddCardPage />} />
            <Route path="/decks/:id/cards" element={<CardBrowser />} />
            <Route path="/stats" element={<StatsOverview />} />
            <Route path="/stats/hardest" element={<HardestCards />} />
            <Route path="/sessions" element={<SessionHistory />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
