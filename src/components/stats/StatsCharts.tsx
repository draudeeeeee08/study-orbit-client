import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api/axios';
import { apiMessage } from '../../api/errors';
import type { ApiActivityRow, ApiForecastRow } from '../../types/api';

const FORECAST_RANGES = [7, 14, 30, 90] as const;
const ACTIVITY_DAYS = 30;

/** "2026-10-14" → "10-14", which fits under a bar. */
function shortDate(date: string): string {
  return date.slice(5, 10);
}

function ForecastChart() {
  const [days, setDays] = useState<number>(14);
  const [rows, setRows] = useState<ApiForecastRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<ApiForecastRow[]>('/stats/forecast', { params: { days } })
      .then((response) => {
        if (!active) return;
        setRows(response.data);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (active) setError(apiMessage(requestError) ?? 'Could not load the forecast.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, [days]);

  const data = rows.map((row) => ({ label: shortDate(row.date), count: row.count }));
  const nothingDue = loaded && !error && rows.every((row) => row.count === 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upcoming reviews</h2>
          <p className="text-sm text-slate-600">Cards due each day. Today includes overdue cards.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          <span className="sr-only">Forecast range</span>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {FORECAST_RANGES.map((range) => (
              <option key={range} value={range}>Next {range} days</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 h-64">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && !loaded && <p role="status" className="p-6 text-center text-sm text-slate-600">Loading forecast...</p>}
        {nothingDue && <p className="p-6 text-center text-sm text-slate-600">Nothing is due in this period.</p>}
        {!error && loaded && !nothingDue && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} width={36} />
              <Tooltip />
              <Bar dataKey="count" name="Cards due" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

function ActivityChart() {
  const [rows, setRows] = useState<ApiActivityRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<ApiActivityRow[]>('/stats/activity', { params: { days: ACTIVITY_DAYS } })
      .then((response) => {
        if (active) setRows(response.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(apiMessage(requestError) ?? 'Could not load your activity.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const data = rows.map((row) => ({ label: shortDate(row.date), reviews: row.reviews, correct: row.correct }));
  const noActivity = loaded && !error && rows.every((row) => row.reviews === 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Reviews per day</h2>
      <p className="text-sm text-slate-600">The last {ACTIVITY_DAYS} days, in UTC.</p>

      <div className="mt-4 h-64">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && !loaded && <p role="status" className="p-6 text-center text-sm text-slate-600">Loading activity...</p>}
        {noActivity && <p className="p-6 text-center text-sm text-slate-600">No reviews in the last {ACTIVITY_DAYS} days.</p>}
        {!error && loaded && !noActivity && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} width={36} />
              <Tooltip />
              <Legend />
              <Bar dataKey="reviews" name="Reviews" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="correct" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

/** Loaded lazily from StatsOverview, so recharts is only downloaded on the statistics page. */
export default function StatsCharts() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ForecastChart />
      <ActivityChart />
    </div>
  );
}
