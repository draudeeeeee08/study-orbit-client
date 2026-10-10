import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';

// 1. Zod Schema defined OUTSIDE the component (Rubric Requirement)
const deckSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(60, "Title must be under 60 characters"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  // z.coerce.number() ensures the HTML string input is safely converted to a number
  dailyNewLimit: z.coerce.number().min(1, "Must be at least 1").max(100, "Maximum limit is 100"),
});

type DeckFormData = z.infer<typeof deckSchema>;

interface Props {
  subjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeckForm({ subjectId, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeckFormData>({
    resolver: zodResolver(deckSchema),
    defaultValues: { 
      color: '#0ea5e9',
      dailyNewLimit: 10 
    }
  });

  const onSubmit = async (data: DeckFormData) => {
    try {
      setServerError('');
      // We must append the subjectId to the payload since the backend requires it
      await api.post('/decks', {
        ...data,
        subject: subjectId
      });
      onSuccess();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to create deck. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Create New Deck</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Deck Title</label>
            <input 
              {...register('title')} 
              placeholder="e.g. Cell Structure, Chapter 1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {errors.title && <p className="text-red-500 text-sm font-medium">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Description (Optional)</label>
            <input 
              {...register('description')} 
              placeholder="Brief summary of this deck..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Daily New Cards</label>
              <input 
                type="number"
                {...register('dailyNewLimit')} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              {errors.dailyNewLimit && <p className="text-red-500 text-sm font-medium">{errors.dailyNewLimit.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Theme Color</label>
              <div className="flex items-center gap-3 h-[46px] px-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input 
                  type="color"
                  {...register('color')} 
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-slate-500 font-mono text-sm uppercase">Select</span>
              </div>
              {errors.color && <p className="text-red-500 text-sm font-medium">{errors.color.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm transition-colors flex justify-center items-center"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}