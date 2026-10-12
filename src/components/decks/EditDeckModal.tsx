import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiDeck } from '../../types/api';
import ModalShell from '../ModalShell';

const deckSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(60, 'Title must be under 60 characters'),
  description: z.string().max(300, 'Description must be under 300 characters'),
  dailyNewLimit: z.number().int('Must be a whole number').min(1, 'Must be at least 1').max(100, 'Maximum limit is 100'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  archived: z.boolean(),
});

type DeckFormData = z.infer<typeof deckSchema>;

interface Props {
  deckId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDeckModal({ deckId, onClose, onSuccess }: Props) {
  const [deck, setDeck] = useState<ApiDeck | null>(null);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeckFormData>({ resolver: zodResolver(deckSchema) });

  // Prefill from a fresh GET. PUT replaces every field, so stale values would overwrite newer edits.
  useEffect(() => {
    let active = true;
    api.get<ApiDeck>(`/decks/${deckId}`)
      .then((response) => {
        if (!active) return;
        setDeck(response.data);
        reset({
          title: response.data.title,
          description: response.data.description ?? '',
          dailyNewLimit: response.data.dailyNewLimit,
          color: response.data.color,
          archived: response.data.archived,
        });
      })
      .catch((error: unknown) => {
        if (active) setLoadError(apiMessage(error) ?? 'Could not load this deck.');
      });
    return () => { active = false; };
  }, [deckId, reset]);

  const onSubmit = async (data: DeckFormData) => {
    if (!deck) return;
    try {
      setServerError('');
      // Send every field. An omitted archived flag would un-archive the deck, and an omitted description would clear it.
      await api.put(`/decks/${deckId}`, { ...data, subject: deck.subject._id });
      onSuccess();
    } catch (error: unknown) {
      const message = apiMessage(error) ?? 'Failed to save the deck. Please try again.';
      if (message.startsWith('Duplicate value for: subject, title')) {
        setError('title', { type: 'server', message: 'This subject already has a deck with this title.' });
      } else {
        setServerError(message);
      }
    }
  };

  return (
    <ModalShell title="Edit Deck" onClose={onClose}>
      {loadError && (
        <div role="alert" className="m-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{loadError}</div>
      )}
      {!loadError && !deck && (
        <div role="status" className="p-10 text-center text-slate-600">Loading deck...</div>
      )}
      {deck && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{serverError}</div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="deck-title" className="block text-sm font-semibold text-slate-700">Deck Title</label>
            <input id="deck-title" {...register('title')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            {errors.title && <p className="text-red-500 text-sm font-medium">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deck-description" className="block text-sm font-semibold text-slate-700">Description (Optional)</label>
            <input id="deck-description" {...register('description')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            {errors.description && <p className="text-red-500 text-sm font-medium">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="deck-limit" className="block text-sm font-semibold text-slate-700">Daily New Cards</label>
              <input id="deck-limit" type="number" {...register('dailyNewLimit', { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
              {errors.dailyNewLimit && <p className="text-red-500 text-sm font-medium">{errors.dailyNewLimit.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deck-color" className="block text-sm font-semibold text-slate-700">Theme Color</label>
              <div className="flex items-center gap-3 h-[46px] px-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input id="deck-color" type="color" {...register('color')} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
              </div>
              {errors.color && <p className="text-red-500 text-sm font-medium">{errors.color.message}</p>}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input type="checkbox" {...register('archived')} className="mt-1 h-4 w-4" />
            <span className="text-sm text-slate-700">
              <span className="block font-semibold">Archived</span>
              Paused: the deck is hidden from study and due lists. Its cards and history are kept.
            </span>
          </label>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors">
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
