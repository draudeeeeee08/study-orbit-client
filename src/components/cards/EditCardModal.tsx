import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiCard } from '../../types/api';
import ModalShell from '../ModalShell';

const MAX_TAGS = 10;

/** Splits "a, b ,, c" into ["a", "b", "c"]. */
function parseTags(value: string): string[] {
  return value.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
}

const cardSchema = z.object({
  front: z.string().trim().min(1, 'The front cannot be empty').max(500, 'The front must be under 500 characters'),
  back: z.string().trim().min(1, 'The back cannot be empty').max(1000, 'The back must be under 1000 characters'),
  tags: z.string().refine((value) => parseTags(value).length <= MAX_TAGS, `Use at most ${MAX_TAGS} tags`),
});

type CardFormData = z.infer<typeof cardSchema>;

interface Props {
  cardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCardModal({ cardId, onClose, onSuccess }: Props) {
  const [card, setCard] = useState<ApiCard | null>(null);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardFormData>({ resolver: zodResolver(cardSchema) });

  // Prefill from a fresh GET. PUT replaces the tags, so an omitted tag list would clear them.
  useEffect(() => {
    let active = true;
    api.get<ApiCard>(`/cards/${cardId}`)
      .then((response) => {
        if (!active) return;
        setCard(response.data);
        reset({ front: response.data.front, back: response.data.back, tags: response.data.tags.join(', ') });
      })
      .catch((error: unknown) => {
        if (active) setLoadError(apiMessage(error) ?? 'Could not load this card.');
      });
    return () => { active = false; };
  }, [cardId, reset]);

  const onSubmit = async (data: CardFormData) => {
    if (!card) return;
    try {
      setServerError('');
      await api.put(`/cards/${cardId}`, {
        deck: card.deck,
        front: data.front,
        back: data.back,
        tags: parseTags(data.tags),
      });
      onSuccess();
    } catch (error: unknown) {
      setServerError(apiMessage(error) ?? 'Failed to save the card. Please try again.');
    }
  };

  return (
    <ModalShell title="Edit Card" onClose={onClose}>
      {loadError && (
        <div role="alert" className="m-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{loadError}</div>
      )}
      {!loadError && !card && (
        <div role="status" className="p-10 text-center text-slate-600">Loading card...</div>
      )}
      {card && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{serverError}</div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="card-front" className="block text-sm font-semibold text-slate-700">Front</label>
            <textarea id="card-front" rows={3} {...register('front')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            {errors.front && <p className="text-red-500 text-sm font-medium">{errors.front.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="card-back" className="block text-sm font-semibold text-slate-700">Back</label>
            <textarea id="card-back" rows={3} {...register('back')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            {errors.back && <p className="text-red-500 text-sm font-medium">{errors.back.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="card-tags" className="block text-sm font-semibold text-slate-700">Tags (Optional)</label>
            <input id="card-tags" placeholder="e.g. organelles, cell biology" {...register('tags')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            <p className="text-xs text-slate-500">Separate tags with commas. Up to {MAX_TAGS}.</p>
            {errors.tags && <p className="text-red-500 text-sm font-medium">{errors.tags.message}</p>}
          </div>

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
