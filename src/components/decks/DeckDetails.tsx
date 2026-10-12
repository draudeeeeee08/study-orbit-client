import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiDeck, ApiSubject, ListEnvelope } from '../../types/api';
import CreateDeckForm from './CreateDeckForm';
import EditDeckModal from './EditDeckModal';
import DeckStatsPanel from './DeckStatsPanel';
import OrbitLoader from '../OrbitLoader';

/** Decks of one subject. Archived decks are only fetched when the learner asks for them. */
async function fetchDecks(subjectId: string, archived: boolean): Promise<ApiDeck[]> {
  const response = await api.get<ListEnvelope<ApiDeck>>('/decks', { params: { subject: subjectId, archived } });
  return response.data.data;
}

export default function DeckDetails() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<ApiSubject | null>(null);
  const [decks, setDecks] = useState<ApiDeck[]>([]);
  const [archivedDecks, setArchivedDecks] = useState<ApiDeck[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [statsDeckId, setStatsDeckId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyDeckId, setBusyDeckId] = useState<string | null>(null);
  
  // NEW: State to manage the custom delete popup
  const [deckToDelete, setDeckToDelete] = useState<{id: string, title: string} | null>(null);

  const fetchSubjectAndDecks = useCallback(async () => {
    try {
      if (!id) throw new Error('No Subject ID provided in the URL.');

      const [subjectRes, activeDecks] = await Promise.all([
        api.get<ApiSubject>(`/subjects/${id}`),
        fetchDecks(id, false),
      ]);

      setSubject(subjectRes.data);
      setDecks(activeDecks);
    } catch (err: unknown) {
      console.error(err);
      setError(apiMessage(err) ?? (err instanceof Error ? err.message : 'Failed to fetch data.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSubjectAndDecks();
  }, [fetchSubjectAndDecks]);

  const flashSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  /** Reloads the active list, and the archived list when it is on screen. Does not show the page loader. */
  const refreshDecks = useCallback(async () => {
    if (!id) return;
    try {
      const [active, archived] = await Promise.all([
        fetchDecks(id, false),
        showArchived ? fetchDecks(id, true) : Promise.resolve<ApiDeck[] | null>(null),
      ]);
      setDecks(active);
      if (archived) setArchivedDecks(archived);
    } catch (err: unknown) {
      setActionError(apiMessage(err) ?? 'Failed to refresh the decks.');
    }
  }, [id, showArchived]);

  const handleDeckCreated = () => {
    setIsModalOpen(false);
    flashSuccess('Deck created successfully!');
    void refreshDecks();
  };

  const toggleArchivedSection = async () => {
    if (!id) return;
    const next = !showArchived;
    setShowArchived(next);
    if (next) {
      try {
        setArchivedDecks(await fetchDecks(id, true));
      } catch (err: unknown) {
        setActionError(apiMessage(err) ?? 'Failed to load archived decks.');
      }
    }
  };

  const setDeckArchived = async (deck: ApiDeck, archived: boolean) => {
    setBusyDeckId(deck._id);
    setActionError('');
    try {
      // Fetch first, so the PUT sends current values rather than the list's copy.
      const current = await api.get<ApiDeck>(`/decks/${deck._id}`);
      await api.put(`/decks/${deck._id}`, {
        title: current.data.title,
        description: current.data.description ?? '',
        color: current.data.color,
        dailyNewLimit: current.data.dailyNewLimit,
        archived,
        subject: current.data.subject._id,
      });
      flashSuccess(archived ? `"${deck.title}" was archived.` : `"${deck.title}" was restored.`);
      await refreshDecks();
    } catch (err: unknown) {
      setActionError(apiMessage(err) ?? 'Failed to update the deck. Please try again.');
    } finally {
      setBusyDeckId(null);
    }
  };

  // NEW: Opens the modal instead of the native window.confirm
  const handleDeleteDeck = (deck: ApiDeck) => {
    setDeckToDelete({ id: deck._id, title: deck.title });
  };

  // NEW: Executes the actual API deletion when confirmed
  const confirmDelete = async () => {
    if (!deckToDelete) return;
    
    setBusyDeckId(deckToDelete.id);
    setActionError('');

    try {
      await api.delete(`/decks/${deckToDelete.id}`);
      setDecks((currentDecks) => currentDecks.filter((item) => item._id !== deckToDelete.id));
      setArchivedDecks((currentDecks) => currentDecks.filter((item) => item._id !== deckToDelete.id));
      flashSuccess(`"${deckToDelete.title}" was deleted successfully.`);
    } catch (err: unknown) {
      console.error(err);
      setActionError(apiMessage(err) ?? 'Failed to delete the deck. Please try again.');
    } finally {
      setBusyDeckId(null);
      setDeckToDelete(null);
    }
  };

  const renderDeckCard = (deck: ApiDeck) => {
    const archived = deck.archived;
    const busy = busyDeckId !== null;

    return (
      <div
        key={deck._id}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: deck.color }} />

        <div className="flex-grow mt-2 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-800">{deck.title}</h2>
            {archived && (
              <span className="shrink-0 rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">Archived</span>
            )}
          </div>

          <p className="text-slate-500 text-sm line-clamp-2">{deck.description}</p>

          <div className="flex gap-3 pt-2">
            <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
              Cards: {deck.cardCount}
            </span>

            {!archived && deck.dueCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md animate-pulse">
                Due: {deck.dueCount}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
          {archived ? (
            <button
              type="button"
              disabled
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 font-bold text-slate-400"
            >
              Study paused (archived)
            </button>
          ) : (
            <Link
              to={`/study/${deck._id}`}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Study Now
            </Link>
          )}

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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditingDeckId(deck._id)}
              disabled={busy}
              className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void setDeckArchived(deck, !archived)}
              disabled={busy}
              className="min-h-10 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-50"
            >
              {busyDeckId === deck._id ? 'Saving...' : archived ? 'Restore' : 'Archive'}
            </button>
          </div>

          <button
            type="button"
            aria-expanded={statsDeckId === deck._id}
            onClick={() => setStatsDeckId(statsDeckId === deck._id ? null : deck._id)}
            className="w-full min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {statsDeckId === deck._id ? 'Hide statistics' : 'Show statistics'}
          </button>
          {statsDeckId === deck._id && <DeckStatsPanel deckId={deck._id} />}

          <button
            type="button"
            onClick={() => handleDeleteDeck(deck)}
            disabled={busy}
            className="w-full min-h-10 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyDeckId === deck._id && !archived ? 'Deleting...' : 'Delete Deck'}
          </button>
        </div>
      </div>
    );
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

        {actionError && (
          <div
            role="alert"
            className="bg-red-50 text-red-700 px-5 py-3 rounded-xl border border-red-200"
          >
            {actionError}
          </div>
        )}

        {decks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">
              No active decks for {subject.name}.
            </p>
            <p className="text-slate-400 mt-2">
              Create a deck, or open the archived decks below to restore one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6">
            {decks.map(renderDeckCard)}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => void toggleArchivedSection()}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {showArchived ? 'Hide archived decks' : 'Show archived decks'}
          </button>

          {showArchived && (
            archivedDecks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                No archived decks in {subject.name}.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6">
                {archivedDecks.map(renderDeckCard)}
              </div>
            )
          )}
        </div>
      </div>

      {isModalOpen && id && (
        <CreateDeckForm
          subjectId={id}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleDeckCreated}
        />
      )}

      {editingDeckId && (
        <EditDeckModal
          deckId={editingDeckId}
          onClose={() => setEditingDeckId(null)}
          onSuccess={() => {
            setEditingDeckId(null);
            flashSuccess('Deck updated successfully!');
            void refreshDecks();
          }}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deckToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-red-50/50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Deck?</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{deckToDelete.title}"</span>? 
              This may permanently delete the deck, its flashcards, and associated study history. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeckToDelete(null)} 
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => void confirmDelete()}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}