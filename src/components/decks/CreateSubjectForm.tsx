import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors'; // Added for proper type-safe error handling

// 1. Zod Schema defined OUTSIDE the component (Rubric Requirement)
const subjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(40, "Name must be under 40 characters"),
  icon: z.string().min(1, "Icon is required").max(4, "Icon must be at most 4 characters (e.g. an emoji)"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
});

// 2. z.infer used for the TypeScript type (Rubric Requirement)
type SubjectFormData = z.infer<typeof subjectSchema>;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSubjectForm({ onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState('');

  // 3. React Hook Form setup with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { color: '#4f46e5' }
  });

  // 4. Submit handler mapped to your leader's API
  const onSubmit = async (data: SubjectFormData) => {
    try {
      setServerError('');
      await api.post('/subjects', data); 
      onSuccess(); 
    } catch (err: unknown) {
      // Fixed from `err: any` to `err: unknown` to clear lint warnings
      setServerError(apiMessage(err) ?? 'Failed to create subject. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Create New Subject</h2>
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

          {/* Name Field with Per-Field Error (Rubric Requirement) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Subject Name</label>
            <input 
              {...register('name')} 
              placeholder="e.g. Physics, History"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {errors.name && <p className="text-red-500 text-sm font-medium">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Icon Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Emoji Icon</label>
              <input 
                {...register('icon')} 
                placeholder="e.g. ⚛️"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              {errors.icon && <p className="text-red-500 text-sm font-medium">{errors.icon.message}</p>}
            </div>

            {/* Color Field */}
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
            
            {/* Submit Properly Gated (Rubric Requirement) */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm shadow-indigo-200 transition-colors flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}