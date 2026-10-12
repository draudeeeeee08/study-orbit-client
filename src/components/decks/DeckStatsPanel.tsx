import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiDeckStats } from '../../types/api';

interface Props {
  deckId: string;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function DeckStatsPanel({ deckId }: Props) {
  const [stats, setStats] = useState<ApiDeckStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<ApiDeckStats>(`/stats/decks/${deckId}`)
      .then((response) => {
        if (active) setStats(response.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(apiMessage(requestError) ?? 'Could not load deck statistics.');
      });
    return () => { active = false; };
  }, [deckId]);

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!stats) return <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Loading deck statistics...</p>;
  if (stats.cardCount === 0) return <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Add cards to see statistics for this deck.</p>;

  // Cards that are not "new" have been reviewed. With none, retention and ease have no data, so show a dash
  // instead of the zero the API returns.
  const reviewedCards = stats.cardCount - (stats.statusDistribution.new ?? 0);
  const hasReviews = reviewedCards > 0;
  const hasSessions = stats.sessionCount > 0;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
      <Metric label="Mastery" value={`${stats.masteryPercent.toFixed(1)}%`} />
      <Metric label="Retention" value={hasReviews ? `${stats.retentionRate.toFixed(1)}%` : '—'} />
      <Metric label="Average ease" value={hasReviews ? stats.averageEaseFactor.toFixed(2) : '—'} />
      <Metric label="Due today" value={stats.dueToday.toLocaleString()} />
      <Metric label="Completed sessions" value={stats.sessionCount.toLocaleString()} />
      <Metric label="Session accuracy" value={hasSessions ? `${stats.averageSessionAccuracy.toFixed(1)}%` : '—'} />
    </div>
  );
}
