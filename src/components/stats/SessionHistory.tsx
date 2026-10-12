import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { formatDuration } from '../../utils/format';

interface StudySession {
  _id: string;
  deck: string;
  status: 'active' | 'completed';
  startedAt: string;
  endedAt: string | null;
  cardsReviewed: number;
  correctCount: number;
  accuracy: number;
  totalTimeMs: number;
}

interface SessionListResponse {
  data: StudySession[];
  total: number;
  page: number;
  limit: number;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return 'Unable to load study history. Please try again.';
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const first = await api.get<SessionListResponse>('/sessions', { params: { page: 1, limit: 100 } });
      if (!Array.isArray(first.data?.data)) throw new Error('The sessions API returned an unexpected response.');
      let allSessions = first.data.data;
      const totalPages = Math.ceil(first.data.total / first.data.limit);
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await api.get<SessionListResponse>('/sessions', { params: { page, limit: 100 } });
        if (!Array.isArray(response.data?.data)) throw new Error('The sessions API returned an unexpected response.');
        allSessions = allSessions.concat(response.data.data);
      }
      if (active) setSessions(allSessions);
    })()
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/stats" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">&larr; Back to statistics</Link>
        <header>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Your learning timeline</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Study session history</h1>
          <p className="mt-2 text-slate-600">See when you studied, how long you spent, and how accurately you answered.</p>
        </header>

        {loading && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading study history...</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">No study sessions yet</h2>
            <p className="mt-2 text-slate-600">Completed and active study sessions will appear here when recorded by the API.</p>
            <Link to="/subjects" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Browse subjects</Link>
          </div>
        )}
        {!loading && !error && sessions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-4">Study date</th>
                  <th scope="col" className="px-5 py-4">Deck</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4">Time spent</th>
                  <th scope="col" className="px-5 py-4">Cards reviewed</th>
                  <th scope="col" className="px-5 py-4">Accuracy</th>
                  <th scope="col" className="px-5 py-4"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => {
                  const date = new Date(session.startedAt);
                  const accuracy = Number.isFinite(session.accuracy) ? Math.min(100, Math.max(0, session.accuracy)) : null;
                  return (
                    <tr key={session._id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-slate-700"><span className="font-medium">Deck</span><span className="mt-1 block break-all text-xs text-slate-500">{session.deck}</span></td>
                      <td className="px-5 py-4 text-sm capitalize text-slate-700">{session.status}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{formatDuration(session.totalTimeMs)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{session.cardsReviewed.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">{accuracy === null ? '—' : `${accuracy.toFixed(1)}%`}<span className="mt-1 block text-xs font-normal text-slate-500">{session.correctCount} correct</span></td>
                      <td className="px-5 py-4 text-sm"><Link to={`/sessions/${session._id}`} className="font-semibold text-indigo-700 hover:underline">View</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
