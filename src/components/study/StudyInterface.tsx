import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import OrbitLoader from '../OrbitLoader';

interface Card {
  _id: string;
  front: string;
  back: string;
  status: string;
}

interface Session {
  _id: string;
}

export default function StudyInterface() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<Card[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');

  // Derived values computed during render (Rubric Requirement)
  const totalCards = queue.length;
  const cardsRemaining = totalCards > 0 ? totalCards - currentIndex : 0;
  const progressPercentage = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;
  const currentCard = queue[currentIndex];

  const initializeStudySession = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!deckId) throw new Error("No Deck ID provided.");

      // 1. Create a new study session
      const sessionRes = await api.post('/sessions', { deck: deckId });
      setSession(sessionRes.data);

      // 2. Fetch the calculated study queue from the backend
      const queueRes = await api.get(`/study/queue?deck=${deckId}`);
      
      // Combine due cards and new cards into a single playable queue
      const combinedQueue = [...queueRes.data.due, ...queueRes.data.new];
      setQueue(combinedQueue);
      
      setCardStartTime(Date.now());
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initialize study session.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    initializeStudySession();
  }, [initializeStudySession]);

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || !session || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const timeSpentMs = Date.now() - cardStartTime;

      // 3. Submit the review to trigger backend business logic/scheduling
      await api.post(`/cards/${currentCard._id}/reviews`, {
        rating,
        timeSpentMs,
        session: session._id
      });

      if (currentIndex + 1 >= totalCards) {
        // 4. If queue is empty, close out the session
        await api.patch(`/sessions/${session._id}`, { status: 'completed' });
        setIsFinished(true);
      } else {
        // Move to next card
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setCardStartTime(Date.now());
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <OrbitLoader text="Building your study queue..." />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <p className="text-red-500 font-medium bg-red-50 px-6 py-3 rounded-lg border border-red-200 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-indigo-600 font-semibold hover:underline">&larr; Go Back</button>
      </div>
    );
  }

  if (totalCards === 0 || isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-green-50/50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Session Complete!</h2>
          <p className="text-slate-500 mb-8">You have reviewed all due cards for this deck. Great job keeping up with your studies.</p>
          <button onClick={() => navigate(-1)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            Return to Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation & Progress */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2 transition-colors">
          &larr; Exit Session
        </button>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-700">{cardsRemaining} cards remaining</span>
          <div className="w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Flashcard Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto">
        <div className="w-full bg-white min-h-[400px] rounded-3xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center relative animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="absolute top-6 left-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentCard.status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {currentCard.status}
            </span>
          </div>

          <h3 className="text-3xl font-bold text-slate-800 leading-relaxed max-w-xl">
            {currentCard.front}
          </h3>

          {isFlipped && (
            <>
              <div className="w-full h-px bg-slate-100 my-8"></div>
              <p className="text-2xl font-medium text-slate-600 max-w-xl animate-in fade-in duration-300">
                {currentCard.back}
              </p>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 w-full max-w-3xl h-24 flex items-center justify-center">
          {!isFlipped ? (
            <button 
              onClick={() => setIsFlipped(true)}
              className="px-12 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
            >
              Show Answer
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-4 w-full animate-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => handleRating('again')} disabled={isSubmitting} className="py-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-bold text-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-red-400 mb-1">Fail</span>
                Again
              </button>
              <button onClick={() => handleRating('hard')} disabled={isSubmitting} className="py-4 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl font-bold text-lg hover:bg-orange-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-orange-400 mb-1">Hard</span>
                Hard
              </button>
              <button onClick={() => handleRating('good')} disabled={isSubmitting} className="py-4 bg-green-50 text-green-600 border border-green-200 rounded-2xl font-bold text-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-green-400 mb-1">Pass</span>
                Good
              </button>
              <button onClick={() => handleRating('easy')} disabled={isSubmitting} className="py-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl font-bold text-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-blue-400 mb-1">Perfect</span>
                Easy
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}