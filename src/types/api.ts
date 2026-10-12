// Response shapes returned by the Study Orbit API. Field names follow docs-site/docs/api.

export interface ListEnvelope<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiSubject {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ApiSubjectSummary {
  _id: string;
  name: string;
  color: string;
}

export interface ApiDeck {
  _id: string;
  title: string;
  description: string;
  color: string;
  dailyNewLimit: number;
  archived: boolean;
  subject: ApiSubjectSummary;
  cardCount: number;
  dueCount: number;
}

export type ApiCardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface ApiCard {
  _id: string;
  deck: string;
  front: string;
  back: string;
  tags: string[];
  status: ApiCardStatus;
  suspended: boolean;
}

export type ApiRating = 'again' | 'hard' | 'good' | 'easy';

export interface ApiReview {
  rating: ApiRating;
  previousStatus: ApiCardStatus;
  newStatus: ApiCardStatus;
  previousInterval: number;
  newInterval: number;
  timeSpentMs?: number;
  reviewedAt: string;
}

export interface ApiSession {
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

export interface ApiDeckStats {
  cardCount: number;
  statusDistribution: Record<ApiCardStatus, number>;
  masteryPercent: number;
  retentionRate: number;
  averageEaseFactor: number;
  dueToday: number;
  sessionCount: number;
  averageSessionAccuracy: number;
}

export interface ApiSubjectStats {
  _id: string;
  name: string;
  deckCount: number;
  cardCount: number;
  masteryPercent: number;
  retentionRate: number;
}

export interface ApiActivityRow {
  date: string;
  reviews: number;
  correct: number;
}

export interface ApiForecastRow {
  date: string;
  count: number;
}
