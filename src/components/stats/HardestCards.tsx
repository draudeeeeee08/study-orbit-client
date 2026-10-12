import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';

interface HardCard {
  _id: string;
  front: string;
  back: string;
  deck: string;
  lapses: number;
  easeFactor: number;
  overdueDays: number;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return 'Unable to load hardest cards. Please try again.';
}

export default function HardestCards() {
  const [cards, setCards] = useState<HardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<HardCard[]>('/stats/hardest', { params: { limit: 50 } })
      .then((response) => {
        if (!Array.isArray(response.data)) throw new Error('The hardest-cards API returned an unexpected response.');
        if (active) setCards(response.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/stats" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">&larr; Back to statistics</Link>
        <header>
          <p className="text-sm font-bold uppercase tracking-wider text-rose-700">Focus list</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Hardest cards</h1>
          <p className="mt-2 text-slate-600">Cards with the most recorded lapses appear first, so you can focus your next review.</p>
        </header>

        {loading && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading hardest cards...</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
        {!loading && !error && cards.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">No difficult cards yet</h2>
            <p className="mt-2 text-slate-600">Cards will appear here after a review has been marked as a lapse.</p>
            <Link to="/subjects" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Browse subjects</Link>
          </div>
        )}
        {!loading && !error && cards.length > 0 && (
          <div className="space-y-4">
            {cards.map((card) => (
              <article key={card._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase text-rose-800">{card.lapses} {card.lapses === 1 ? 'lapse' : 'lapses'}</span>
                  <span className="text-sm text-slate-500">Deck ID: {card.deck}</span>
                </div>
                <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-indigo-700">Question</h2>
                <p className="mt-2 whitespace-pre-wrap break-words font-medium text-slate-900">{card.front}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2">Reveal answer</summary>
                  <p className="mt-3 whitespace-pre-wrap break-words text-slate-700">{card.back}</p>
                </details>
                <p className="mt-4 text-sm text-slate-600">Ease factor: {Number.isFinite(card.easeFactor) ? card.easeFactor.toFixed(2) : '—'} · Overdue by: {card.overdueDays} {card.overdueDays === 1 ? 'day' : 'days'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
