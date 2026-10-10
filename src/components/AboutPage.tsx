import { Link } from 'react-router-dom';

const developers = [
  {
    initials: 'JM',
    name: 'Mercado, Justine Eduard T.',
    role: 'Frontend Developer',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    initials: 'MV',
    name: 'Villanueva, Mark Rayshawn T.',
    role: 'Frontend Developer',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    initials: 'CC',
    name: 'Chu, Cyrus Justine Q.',
    role: 'Backend Developer',
    color: 'bg-blue-100 text-blue-600',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">
            About Study Orbit
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
            A flashcard-based learning platform that helps students organize
            their subjects, review lessons, and improve knowledge through
            spaced repetition.
          </p>
        </header>

        {/* Project Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Our Project
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Study Orbit makes studying more organized and manageable through
            customizable subjects, flashcard decks, daily study limits, and
            scheduled reviews. Its goal is to help learners study consistently
            without feeling overwhelmed.
          </p>
        </section>

        {/* Developers */}
        <section>
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-800">
            Meet the Developers
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {developers.map((developer) => (
              <div
                key={developer.initials}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${developer.color}`}
                >
                  {developer.initials}
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  {developer.name}
                </h3>

                <p className="mt-2 text-sm font-medium text-indigo-600">
                  {developer.role}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/"
            className="font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}