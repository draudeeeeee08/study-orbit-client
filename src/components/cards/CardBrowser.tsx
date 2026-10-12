import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/axios';

interface Flashcard {
  _id: string;
  front: string;
  back: string;
}

interface CardListResponse {
  data: Flashcard[];
  total: number;
  page: number;
  limit: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
}

export default function CardBrowser() {
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!id) {
      setError('A deck ID is missing from this URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const first = await api.get<CardListResponse>('/cards', { params: { deck: id, page: 1, limit: 100 } });
      const payload = first.data;
      if (!payload || !Array.isArray(payload.data)) throw new Error('The cards API returned an unexpected response.');

      let allCards = payload.data;
      const totalPages = Math.ceil(payload.total / payload.limit);
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await api.get<CardListResponse>('/cards', { params: { deck: id, page, limit: 100 } });
        if (!Array.isArray(response.data?.data)) throw new Error('The cards API returned an unexpected response.');
        allCards = allCards.concat(response.data.data);
      }
      setCards(allCards);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError, fetchError instanceof Error ? fetchError.message : 'Failed to load cards.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  const deleteCard = async (card: Flashcard) => {
    const confirmed = window.confirm(`Delete this flashcard?\n\nFront: ${card.front}`);
    if (!confirmed) return;

    setDeletingId(card._id);
    setError('');
    try {
      await api.delete(`/cards/${card._id}`);
      setCards((current) => current.filter((item) => item._id !== card._id));
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete the flashcard.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/subjects" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
          &larr; Back to subjects
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Deck management</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Card browser</h1>
            <p className="mt-2 text-slate-600">Review and manage the flashcards in this deck.</p>
          </div>
          <Link to={`/decks/${id}/add-card`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            + Add card
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p>
            <button type="button" onClick={() => void fetchCards()} className="mt-2 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading flashcards...</div>
        ) : cards.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">No flashcards yet</h2>
            <p className="mt-2 text-slate-600">Add your first card to start building this deck.</p>
            <Link to={`/decks/${id}/add-card`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
              Create first card
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</p>
            {cards.map((card) => (
              <article key={card._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Front</h2>
                    <p className="mt-2 whitespace-pre-wrap break-words text-slate-800">{card.front}</p>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Back</h2>
                    <p className="mt-2 whitespace-pre-wrap break-words text-slate-800">{card.back}</p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void deleteCard(card)}
                    disabled={deletingId !== null}
                    className="min-h-10 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === card._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
