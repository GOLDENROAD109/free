/**
 * Prominent call-to-action anchors pointing at the creator's official
 * tutorial pipelines. Used in the global footer and on the authorization
 * screens (login / register).
 */
export const TUTORIAL_LINKS = [
  {
    name: 'Instagram Tutorials',
    handle: '@Jp_dev_1',
    url: 'https://instagram.com',
    icon: '📸',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    border: 'border-pink-500/40 hover:border-pink-400/80',
  },
  {
    name: 'YouTube Masterclass',
    handle: 'Complete course · free',
    url: 'https://youtube.com',
    icon: '▶️',
    gradient: 'from-red-500 to-rose-600',
    border: 'border-red-500/40 hover:border-red-400/80',
  },
];

export default function TutorialCTA({ title = 'Learn with the creator', compact = false }) {
  return (
    <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2'}>
      {TUTORIAL_LINKS.map((cta) => (
        <a
          key={cta.url}
          href={cta.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex items-center gap-3 rounded-xl border bg-slate-900/60 p-3 transition ${cta.border}`}
        >
          <span
            className={`grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br text-xl ${cta.gradient}`}
          >
            {cta.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white group-hover:text-cyan-300">
              {cta.name}
            </span>
            <span className="block truncate text-xs text-slate-400">{cta.handle}</span>
          </span>
          <span className="ml-auto text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300">
            →
          </span>
        </a>
      ))}
      {!compact && (
        <p className="col-span-full text-center text-xs text-slate-500">
          {title}: daily lessons, full project walkthroughs, and behind-the-scenes builds.
        </p>
      )}
    </div>
  );
}
