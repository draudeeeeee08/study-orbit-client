import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';

// recharts is large, so the charts load only when this page is opened.
const StatsCharts = lazy(() => import('./StatsCharts'));

interface StatsOverviewData {
  totalSubjects?: number;
  totalDecks?: number;
  totalCards?: number;
  dueToday?: number;
  reviewsToday?: number;
  statusDistribution?: { new?: number; learning?: number; review?: number; mastered?: number };
  retentionRate?: number;
  averageEaseFactor?: number;
  currentStreak?: number;
  longestStreak?: number;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return 'Unable to load your statistics. Please try again.';
}

export default function StatsOverview() {
  const [stats, setStats] = useState<StatsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<StatsOverviewData>('/stats/overview')
      .then((response) => {
        if (active) setStats(response.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) return <div role="status" className="p-12 text-center text-slate-600">Loading statistics...</div>;
  if (error) return <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 sm:m-6">{error}</div>;

  const data = stats ?? {};
  const safeNumber = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const distribution = data.statusDistribution ?? {};

  // The current API calculates retentionRate on the server and returns it directly.
  // Keep all display-time derived values here rather than duplicating them in React state.
  const retentionRate = Math.min(100, Math.max(0, safeNumber(data.retentionRate)));
  const totalStatusCards = safeNumber(distribution.new) + safeNumber(distribution.learning) + safeNumber(distribution.review) + safeNumber(distribution.mastered);

  const metrics = [
    { label: 'Subjects', value: safeNumber(data.totalSubjects) },
    { label: 'Decks', value: safeNumber(data.totalDecks) },
    { label: 'Flashcards', value: safeNumber(data.totalCards) },
    { label: 'Due today', value: safeNumber(data.dueToday) },
    { label: 'Reviews today', value: safeNumber(data.reviewsToday) },
    { label: 'Current streak', value: safeNumber(data.currentStreak), suffix: ' days' },
    { label: 'Longest streak', value: safeNumber(data.longestStreak), suffix: ' days' },
    { label: 'Average ease factor', value: safeNumber(data.averageEaseFactor).toFixed(2) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Your progress</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Global statistics</h1>
          <p className="mt-2 text-slate-600">A clear view of your study habits and momentum.</p>
        </header>

        <section aria-label="Study metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}{' '}
                {'suffix' in metric ? metric.suffix : ''}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-sm font-semibold text-indigo-800">Retention rate</p>
            <p className="mt-3 text-4xl font-extrabold text-indigo-950">{retentionRate.toFixed(1)}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-100" role="progressbar" aria-label="Retention rate" aria-valuemin={0} aria-valuemax={100} aria-valuenow={retentionRate}>
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${retentionRate}%` }} />
            </div>
            <p className="mt-3 text-sm text-indigo-800">Retention is calculated by the API from eligible review outcomes.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Card status breakdown</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalStatusCards.toLocaleString()} cards tracked</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {([
                ['New', distribution.new],
                ['Learning', distribution.learning],
                ['Review', distribution.review],
                ['Mastered', distribution.mastered],
              ] as const).map(([label, count]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-600">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{safeNumber(count).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section aria-label="Activity and forecast">
          <Suspense fallback={<div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading charts...</div>}>
            <StatsCharts />
          </Suspense>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/stats/hardest" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">View hardest cards</Link>
          <Link to="/sessions" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Study session history</Link>
        </div>
      </div>
    </div>
  );
}
