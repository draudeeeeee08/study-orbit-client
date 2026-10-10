import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import CreateSubjectForm from './CreateSubjectForm';
import OrbitLoader from '../OrbitLoader';

interface Subject {
  _id: string;
  name: string;
  color: string;
  icon: string;
  deckCount: number;
}

export default function SubjectDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // State to manage the custom delete popup
  const [subjectToDelete, setSubjectToDelete] = useState<{id: string, name: string} | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await api.get('/subjects');
      if (response.data && Array.isArray(response.data.data)) {
        setSubjects(response.data.data);
      } else {
        throw new Error("Connected to API, but received invalid data format.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to the database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSubjectCreated = () => {
    setIsModalOpen(false);
    setSuccessMessage('Subject created successfully!');
    fetchSubjects();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Executes the actual delete when the user clicks "Delete" in the modal
  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      await api.delete(`/subjects/${subjectToDelete.id}`);
      setSuccessMessage('Subject deleted successfully!');
      fetchSubjects(); 
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete subject.');
    } finally {
      setSubjectToDelete(null); // Close the modal
    }
  };

  if (isLoading) return <OrbitLoader text="Syncing Data" />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-500 font-medium bg-red-50 px-6 py-3 rounded-lg border border-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 relative">
      {successMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 px-6 py-3 rounded-full font-semibold shadow-lg border border-green-200 animate-in slide-in-from-top-4 z-40">
          ✓ {successMessage}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Subjects</h1>
            <p className="text-slate-500 mt-1">Select a subject to view its decks and begin studying.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            + Create Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">No subjects found.</p>
            <p className="text-slate-400 mt-2">Click "+ Create Subject" to add your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: subject.color }}></div>
                <div className="flex-grow space-y-3 mt-2">
                  <div className="text-4xl">{subject.icon}</div>
                  <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{subject.name}</h2>
                  <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                    Decks: {subject.deckCount}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <Link to={`/subjects/${subject._id}`} className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center gap-1">
                    Open Subject <span>&rarr;</span>
                  </Link>
                  <button 
                    onClick={() => setSubjectToDelete({ id: subject._id, name: subject.name })}
                    className="text-slate-400 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateSubjectForm 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSubjectCreated} 
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-red-50/50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Subject?</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{subjectToDelete.name}"</span>? 
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setSubjectToDelete(null)} 
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
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