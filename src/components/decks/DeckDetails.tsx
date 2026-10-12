import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import CreateDeckForm from './CreateDeckForm';
import OrbitLoader from '../OrbitLoader';

interface Subject {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface Deck {
  _id: string;
  title: string;
  description: string;
  color: string;
  cardCount: number;
  dueCount: number;
}

export default function DeckDetails() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  const fetchSubjectAndDecks = useCallback(async () => {
    try {
      if (!id) throw new Error('No Subject ID provided in the URL.');

      const [subjectRes, decksRes] = await Promise.all([
        api.get(`/subjects/${id}`),
        api.get(`/decks?subject=${id}`),
      ]);

      setSubject(subjectRes.data);
      setDecks(decksRes.data.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubjectAndDecks();
  }, [fetchSubjectAndDecks]);

  const handleDeckCreated = () => {
    setIsModalOpen(false);
    setSuccessMessage('Deck created successfully!');
    fetchSubjectAndDecks();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteDeck = async (deck: Deck) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck.title}"?\n\n` +
        'This may permanently delete the deck, its flashcards, and associated study history. This action cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingDeckId(deck._id);
    setDeleteError('');

    try {
      await api.delete(`/decks/${deck._id}`);

      setDecks((currentDecks) =>
        currentDecks.filter((item) => item._id !== deck._id)
      );

      setSuccessMessage(`"${deck.title}" was deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete the deck. Please try again.'
      );
    } finally {
      setDeletingDeckId(null);
    }
  };

  if (isLoading) {
    return <OrbitLoader text="Loading Decks..." />;
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <p className="text-red-500 font-medium bg-red-50 px-6 py-3 rounded-lg border border-red-200 mb-4">
          {error || 'Subject not found.'}
        </p>
        <Link
          to="/subjects"
          className="text-indigo-600 font-semibold hover:underline"
        >
          &larr; Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 relative">
      {successMessage && (
        <div
          role="status"
          className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 px-6 py-3 rounded-full font-semibold shadow-lg border border-green-200 animate-in slide-in-from-top-4 z-40"
        >
          ✓ {successMessage}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Link
            to="/subjects"
            className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2 transition-colors w-fit"
          >
            &larr; Back to Subjects
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{subject.icon}</div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {subject.name}
                </h1>
                <p className="text-slate-500 mt-1">
                  Manage your decks and start your study sessions.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all whitespace-nowrap"
            >
              + Create Deck
            </button>
          </div>
        </div>

        {deleteError && (
          <div
            role="alert"
            className="bg-red-50 text-red-700 px-5 py-3 rounded-xl border border-red-200"
          >
            {deleteError}
          </div>
        )}

        {decks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">
              No decks found for {subject.name}.
            </p>
            <p className="text-slate-400 mt-2">
              You can now return to My Subjects and delete this subject if you
              wish.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div
                key={deck._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 w-full h-1.5"
                  style={{ backgroundColor: deck.color }}
                />

                <div className="flex-grow mt-2 space-y-3">
                  <h2 className="text-xl font-bold text-slate-800">
                    {deck.title}
                  </h2>

                  <p className="text-slate-500 text-sm line-clamp-2">
                    {deck.description}
                  </p>

                  <div className="flex gap-3 pt-2">
                    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                      Cards: {deck.cardCount}
                    </span>

                    {deck.dueCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md animate-pulse">
                        Due: {deck.dueCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
                  <Link
                    to={`/study/${deck._id}`}
                    className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Study Now
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/decks/${deck._id}/cards`}
                      className="flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Browse Cards
                    </Link>

                    <Link
                      to={`/decks/${deck._id}/add-card`}
                      className="flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      + Add Card
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDeck(deck)}
                    disabled={deletingDeckId !== null}
                    className="w-full min-h-10 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingDeckId === deck._id
                      ? 'Deleting...'
                      : 'Delete Deck'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && id && (
        <CreateDeckForm
          subjectId={id}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleDeckCreated}
        />
      )}
    </div>
  );
}
