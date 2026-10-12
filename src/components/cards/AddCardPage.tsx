import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../api/axios';

const cardSchema = z.object({
  front: z.string().trim().min(1, 'Front text is required.').max(500, 'Front text must be 500 characters or fewer.'),
  back: z.string().trim().min(1, 'Back text is required.').max(1000, 'Back text must be 1,000 characters or fewer.'),
});

type CardFormValues = z.infer<typeof cardSchema>;

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return 'Unable to save the flashcard. Please try again.';
}

export default function AddCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { front: '', back: '' },
  });

  const onSubmit = async (values: CardFormValues) => {
    if (!id) {
      setApiError('A deck ID is missing from this URL.');
      return;
    }

    setApiError('');
    setSuccess('');

    try {
      await api.post('/cards', { front: values.front, back: values.back, deck: id });
      setSuccess('Flashcard saved successfully.');
      reset();
    } catch (error: unknown) {
      setApiError(getErrorMessage(error));
    }
  };

  const fieldClass = (invalid: boolean) =>
    `w-full rounded-xl border bg-white p-4 text-slate-900 outline-none transition focus:ring-2 ${
      invalid
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to={id ? `/decks/${id}/cards` : '/subjects'}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          &larr; Back to cards
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Your deck</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Create a flashcard</h1>
          <p className="mt-2 text-slate-600">Add a question or prompt on the front and its answer on the back.</p>

          {success && (
            <div role="status" aria-live="polite" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              {success}
            </div>
          )}
          {apiError && (
            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="front" className="font-semibold text-slate-800">Front (question)</label>
                <span className="text-xs text-slate-500">Up to 500 characters</span>
              </div>
              <textarea
                id="front"
                rows={4}
                maxLength={500}
                autoComplete="off"
                aria-invalid={Boolean(errors.front)}
                aria-describedby={errors.front ? 'front-error' : undefined}
                className={fieldClass(Boolean(errors.front))}
                placeholder="Enter the question or prompt..."
                {...register('front')}
              />
              {errors.front && <p id="front-error" role="alert" className="mt-2 text-sm text-red-700">{errors.front.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="back" className="font-semibold text-slate-800">Back (answer)</label>
                <span className="text-xs text-slate-500">Up to 1,000 characters</span>
              </div>
              <textarea
                id="back"
                rows={5}
                maxLength={1000}
                autoComplete="off"
                aria-invalid={Boolean(errors.back)}
                aria-describedby={errors.back ? 'back-error' : undefined}
                className={fieldClass(Boolean(errors.back))}
                placeholder="Enter the answer..."
                {...register('back')}
              />
              {errors.back && <p id="back-error" role="alert" className="mt-2 text-sm text-red-700">{errors.back.message}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting || !id}
                className="min-h-11 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save flashcard'}
              </button>
              <button
                type="button"
                onClick={() => navigate(id ? `/decks/${id}/cards` : '/subjects')}
                className="min-h-11 rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
