import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiDeck, ApiRating } from '../../types/api';
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

const SESSION_ALREADY_COMPLETED = 'Session is already completed';

export default function StudyInterface() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<Card[]>([]);
  const [originalCount, setOriginalCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
  const [notice, setNotice] = useState('');
  
  // NEW: State for our custom error notification
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [pendingFinish, setPendingFinish] = useState(false);
  const [deckArchived, setDeckArchived] = useState(false);
  const [error, setError] = useState('');

  const answeredIds = useRef<Set<string>>(new Set());
  const requeuedIds = useRef<Set<string>>(new Set());
  const startedFor = useRef<string | null>(null);

  const cardsRemaining = Math.max(queue.length - currentIndex, 0);
  const progressPercentage = originalCount > 0 ? (answeredCount / originalCount) * 100 : 0;
  const currentCard = queue[currentIndex];

  const initializeStudySession = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!deckId) throw new Error('No Deck ID provided.');
      setDeckArchived(false);

      const deckRes = await api.get<ApiDeck>(`/decks/${deckId}`);
      if (deckRes.data.archived) {
        setDeckArchived(true);
        return;
      }

      answeredIds.current.clear();
      requeuedIds.current.clear();
      setSession(null);
      setCurrentIndex(0);
      setAnsweredCount(0);
      setIsFlipped(false);
      setNotice('');
      setErrorNotice(null);
      setIsFinished(false);
      setPendingFinish(false);

      const queueRes = await api.get(`/study/queue?deck=${deckId}`);
      const combinedQueue: Card[] = [...queueRes.data.due, ...queueRes.data.new];
      setQueue(combinedQueue);
      setOriginalCount(combinedQueue.length);

      if (combinedQueue.length > 0) {
        const sessionRes = await api.post('/sessions', { deck: deckId });
        setSession(sessionRes.data);
      }

      setCardStartTime(Date.now());
    } catch (err: unknown) {
      console.error(err);
      setError(apiMessage(err) ?? 'Failed to initialize study session.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    const deckKey = deckId ?? '';
    if (startedFor.current === deckKey) return;
    startedFor.current = deckKey;
    void initializeStudySession();
  }, [deckId, initializeStudySession]);

  const finishSession = useCallback(async () => {
    if (!session) {
      setIsFinished(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/sessions/${session._id}`, { status: 'completed' });
      setPendingFinish(false);
      setIsFinished(true);
    } catch (err: unknown) {
      if (apiMessage(err) === SESSION_ALREADY_COMPLETED) {
        setPendingFinish(false);
        setIsFinished(true);
      } else {
        console.error(err);
        setPendingFinish(true);
        // REPLACED ALERT:
        setErrorNotice('Could not save the end of this session. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [session]);

  const handleRating = async (rating: ApiRating) => {
    if (!currentCard || !session || isSubmitting || pendingFinish) return;

    const card = currentCard;
    const isRepeat = answeredIds.current.has(card._id);
    const shouldRequeue = rating === 'again' && !requeuedIds.current.has(card._id);
    const isLastCard = !shouldRequeue && currentIndex + 1 >= queue.length;

    setIsSubmitting(true);
    setNotice('');
    setErrorNotice(null);
    try {
      if (!isRepeat) {
        const timeSpentMs = Date.now() - cardStartTime;
        await api.post(`/cards/${card._id}/reviews`, {
          rating,
          timeSpentMs,
          session: session._id,
        });
        answeredIds.current.add(card._id);
        setAnsweredCount(answeredIds.current.size);
      }
    } catch (err: unknown) {
      console.error(err);
      // REPLACED ALERT:
      setErrorNotice(apiMessage(err) ?? 'Failed to save review. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    if (shouldRequeue) {
      requeuedIds.current.add(card._id);
      setQueue((prev) => [...prev, card]);
      setNotice('Due again tomorrow. It is back in this session for practice.');
    }

    if (isLastCard) {
      setCurrentIndex(currentIndex + 1);
      setPendingFinish(true);
      await finishSession();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
    setCardStartTime(Date.now());
  };

  const handleSuspend = async () => {
    if (!currentCard || isSubmitting || pendingFinish) return;

    const card = currentCard;
    setIsSubmitting(true);
    try {
      await api.patch(`/cards/${card._id}/suspension`, { suspended: true });
    } catch (err: unknown) {
      console.error(err);
      // REPLACED ALERT:
      setErrorNotice(apiMessage(err) ?? 'Could not suspend this card. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    const remaining = queue.filter((item) => item._id !== card._id);
    const nextIndex = queue.slice(0, currentIndex).filter((item) => item._id !== card._id).length;

    if (!answeredIds.current.has(card._id)) {
      setOriginalCount((count) => Math.max(count - 1, 0));
    }

    setNotice('');
    setErrorNotice(null);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setQueue(remaining);
    setCurrentIndex(nextIndex);

    if (nextIndex >= remaining.length) {
      setPendingFinish(true);
      await finishSession();
    }
  };

  const handleExit = async () => {
    if (session && !isFinished) {
      setIsSubmitting(true);
      try {
        await api.patch(`/sessions/${session._id}`, { status: 'completed' });
      } catch (err: unknown) {
        if (apiMessage(err) !== SESSION_ALREADY_COMPLETED) {
          console.error(err);
          // REPLACED ALERT:
          setErrorNotice('Could not end this session. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
    }
    navigate(-1);
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

  if (deckArchived) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div role="status" className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-2xl font-extrabold text-amber-900 mb-2">This deck is archived</h2>
          <p className="text-amber-900 mb-6">Archived decks are paused, so they are not studied. Restore the deck from its subject page to study again.</p>
          <button onClick={() => navigate(-1)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (isFinished || (!session && queue.length === 0)) {
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

  if (!currentCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">All cards are done</h2>
          <p className="text-slate-500 mb-8">
            {pendingFinish ? 'Saving the end of this session did not work. Try again.' : 'Saving the end of this session...'}
          </p>
          {pendingFinish && (
            <button
              onClick={() => void finishSession()}
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Save and finish session
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* NEW: Custom Error Notice Block */}
      {errorNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-700 px-6 py-3 rounded-full font-semibold shadow-lg border border-red-200 animate-in slide-in-from-top-4 z-40 flex items-center gap-3">
          <span>⚠ {errorNotice}</span>
          <button 
            onClick={() => setErrorNotice(null)} 
            className="text-red-700 hover:text-red-900 text-xl leading-none font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Navigation & Progress */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => void handleExit()}
          disabled={isSubmitting}
          className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
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
        {notice && (
          <p role="status" className="mb-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
            {notice}
          </p>
        )}

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

        <button
          type="button"
          onClick={() => void handleSuspend()}
          disabled={isSubmitting}
          className="mt-4 min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
        >
          Suspend this card
        </button>

        {/* Controls */}
        <div className="mt-4 w-full max-w-3xl h-24 flex items-center justify-center">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="px-12 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
            >
              Show Answer
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-4 w-full animate-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => void handleRating('again')} disabled={isSubmitting} className="py-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-bold text-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-red-400 mb-1">Fail</span>
                Again
              </button>
              <button onClick={() => void handleRating('hard')} disabled={isSubmitting} className="py-4 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl font-bold text-lg hover:bg-orange-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-orange-400 mb-1">Hard</span>
                Hard
              </button>
              <button onClick={() => void handleRating('good')} disabled={isSubmitting} className="py-4 bg-green-50 text-green-600 border border-green-200 rounded-2xl font-bold text-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                <span className="block text-sm font-medium text-green-400 mb-1">Pass</span>
                Good
              </button>
              <button onClick={() => void handleRating('easy')} disabled={isSubmitting} className="py-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl font-bold text-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
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