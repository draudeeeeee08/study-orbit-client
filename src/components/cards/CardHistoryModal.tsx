import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiReview, ListEnvelope } from '../../types/api';
import { formatDuration } from '../../utils/format';
import ModalShell from '../ModalShell';

const PAGE_SIZE = 20;

function fetchReviewPage(cardId: string, page: number) {
  return api.get<ListEnvelope<ApiReview>>('/reviews', {
    params: { card: cardId, page, limit: PAGE_SIZE },
  });
}

interface Props {
  cardId: string;
  cardFront: string;
  onClose: () => void;
}

export default function CardHistoryModal({ cardId, cardFront, onClose }: Props) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchReviewPage(cardId, 1)
      .then((response) => {
        if (!active) return;
        setReviews(response.data.data);
        setTotal(response.data.total);
      })
      .catch((requestError: unknown) => {
        if (active) setError(apiMessage(requestError) ?? 'Could not load the review history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [cardId]);

  const loadMore = async () => {
    const nextPage = Math.floor(reviews.length / PAGE_SIZE) + 1;
    setLoading(true);
    setError('');
    try {
      const response = await fetchReviewPage(cardId, nextPage);
      setReviews((current) => [...current, ...response.data.data]);
      setTotal(response.data.total);
    } catch (requestError: unknown) {
      setError(apiMessage(requestError) ?? 'Could not load the review history.');
    } finally {
      setLoading(false);
    }
  };

  const hasMore = reviews.length < total;

  return (
    <ModalShell title="Review History" onClose={onClose}>
      <div className="space-y-4 p-6">
        <p className="truncate text-sm text-slate-600" title={cardFront}>{cardFront}</p>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && reviews.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-600">This card has not been reviewed yet.</p>
        )}

        {reviews.length > 0 && (
          <ol className="divide-y divide-slate-100">
            {reviews.map((review, index) => (
              <li key={`${review.reviewedAt}-${index}`} className="space-y-1 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize text-slate-800">{review.rating}</span>
                  <time className="text-xs text-slate-500" dateTime={review.reviewedAt}>
                    {new Date(review.reviewedAt).toLocaleString()}
                  </time>
                </div>
                <p className="text-xs text-slate-600">
                  Status: <span className="capitalize">{review.previousStatus}</span> → <span className="capitalize">{review.newStatus}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Interval: {review.previousInterval} → {review.newInterval} {review.newInterval === 1 ? 'day' : 'days'}
                  {' · '}Time: {review.timeSpentMs === undefined ? '—' : formatDuration(review.timeSpentMs)}
                </p>
              </li>
            ))}
          </ol>
        )}

        {loading && <p role="status" className="text-center text-sm text-slate-600">Loading history...</p>}

        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Load more
          </button>
        )}
      </div>
    </ModalShell>
  );
}
