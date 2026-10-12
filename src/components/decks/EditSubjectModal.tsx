import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiSubject } from '../../types/api';
import ModalShell from '../ModalShell';

const subjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(40, 'Name must be under 40 characters'),
  // An empty icon clears it on the server, so it is optional here.
  icon: z.string().max(4, 'Icon must be at most 4 characters (e.g. an emoji)'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface Props {
  subjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSubjectModal({ subjectId, onClose, onSuccess }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({ resolver: zodResolver(subjectSchema) });

  // Prefill from a fresh GET. PUT replaces every field, so stale values would overwrite newer edits.
  useEffect(() => {
    let active = true;
    api.get<ApiSubject>(`/subjects/${subjectId}`)
      .then((response) => {
        if (!active) return;
        reset({ name: response.data.name, icon: response.data.icon ?? '', color: response.data.color });
        setLoaded(true);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(apiMessage(error) ?? 'Could not load this subject.');
      });
    return () => { active = false; };
  }, [subjectId, reset]);

  const onSubmit = async (data: SubjectFormData) => {
    try {
      setServerError('');
      await api.put(`/subjects/${subjectId}`, data);
      onSuccess();
    } catch (error: unknown) {
      const message = apiMessage(error) ?? 'Failed to save the subject. Please try again.';
      if (message.startsWith('Duplicate value for: name')) {
        setError('name', { type: 'server', message: 'A subject with this name already exists.' });
      } else {
        setServerError(message);
      }
    }
  };

  return (
    <ModalShell title="Edit Subject" onClose={onClose}>
      {loadError && (
        <div role="alert" className="m-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{loadError}</div>
      )}
      {!loadError && !loaded && (
        <div role="status" className="p-10 text-center text-slate-600">Loading subject...</div>
      )}
      {loaded && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{serverError}</div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="subject-name" className="block text-sm font-semibold text-slate-700">Subject Name</label>
            <input
              id="subject-name"
              {...register('name')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {errors.name && <p className="text-red-500 text-sm font-medium">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="subject-icon" className="block text-sm font-semibold text-slate-700">Emoji Icon</label>
              <input
                id="subject-icon"
                {...register('icon')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              {errors.icon && <p className="text-red-500 text-sm font-medium">{errors.icon.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject-color" className="block text-sm font-semibold text-slate-700">Theme Color</label>
              <div className="flex items-center gap-3 h-[46px] px-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input id="subject-color" type="color" {...register('color')} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
              </div>
              {errors.color && <p className="text-red-500 text-sm font-medium">{errors.color.message}</p>}
            </div>
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
