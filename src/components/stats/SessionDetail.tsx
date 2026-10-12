import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiDeck, ApiReview, ApiSession, ListEnvelope } from '../../types/api';
import { formatDuration } from '../../utils/format';

interface SessionDetailData {
  session: ApiSession;
  deckTitle: string | null;
  reviews: ApiReview[];
}

async function loadSessionDetail(sessionId: string): Promise<SessionDetailData> {
  const sessionResponse = await api.get<ApiSession>(`/sessions/${sessionId}`);
  const session = sessionResponse.data;

  // The deck title is a nice-to-have, so a failed lookup should not hide the session.
  const deckResponse = await api.get<ApiDeck>(`/decks/${session.deck}`).catch(() => null);

  const firstPage = await api.get<ListEnvelope<ApiReview>>('/reviews', {
    params: { session: sessionId, page: 1, limit: 100 },
  });
  let reviews = firstPage.data.data;
  const totalPages = Math.ceil(firstPage.data.total / firstPage.data.limit);
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await api.get<ListEnvelope<ApiReview>>('/reviews', {
      params: { session: sessionId, page, limit: 100 },
    });
    reviews = reviews.concat(response.data.data);
  }

  return { session, deckTitle: deckResponse?.data.title ?? null, reviews };
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SessionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    loadSessionDetail(id)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(apiMessage(requestError) ?? 'Could not load this session.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const shell = (children: ReactNode) => (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/sessions" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline">
          &larr; Back to session history
        </Link>
        {children}
      </div>
    </div>
  );

  if (!id) return shell(<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">No session ID in this URL.</p>);
  if (loading) return shell(<div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading session...</div>);
  if (error || !detail) return shell(<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error || 'Session not found.'}</div>);

  const { session, deckTitle, reviews } = detail;
  const accuracy = Number.isFinite(session.accuracy) ? Math.min(100, Math.max(0, session.accuracy)) : null;

  return shell(
    <>
      <header>
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Study session</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{deckTitle ?? 'Deck'}</h1>
        <p className="mt-2 text-slate-600">
          Started {new Date(session.startedAt).toLocaleString()}
          {session.endedAt ? `, ended ${new Date(session.endedAt).toLocaleString()}` : ''}
        </p>
      </header>

      {session.status === 'active' && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          This session was never closed. It stays active in the history until it is finished.
        </p>
      )}

      <section aria-label="Session summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Cards reviewed" value={session.cardsReviewed.toLocaleString()} />
        <Tile label="Accuracy" value={accuracy === null ? '—' : `${accuracy.toFixed(1)}%`} />
        <Tile label="Correct answers" value={session.correctCount.toLocaleString()} />
        <Tile label="Time spent" value={formatDuration(session.totalTimeMs)} />
      </section>

      <section aria-label="Reviews in this session" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {reviews.length === 0 ? (
          <p className="p-8 text-center text-slate-600">No reviews were recorded in this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-4">Reviewed</th>
                  <th scope="col" className="px-5 py-4">Rating</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4">Interval</th>
                  <th scope="col" className="px-5 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review, index) => (
                  <tr key={`${review.reviewedAt}-${index}`} className="text-sm text-slate-700">
                    <td className="whitespace-nowrap px-5 py-3">{new Date(review.reviewedAt).toLocaleTimeString()}</td>
                    <td className="px-5 py-3 font-semibold capitalize">{review.rating}</td>
                    <td className="px-5 py-3 capitalize">{review.previousStatus} → {review.newStatus}</td>
                    <td className="px-5 py-3">{review.previousInterval} → {review.newInterval} d</td>
                    <td className="px-5 py-3">{review.timeSpentMs === undefined ? '—' : formatDuration(review.timeSpentMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>,
  );
}
