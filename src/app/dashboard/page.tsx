const stats = [
  { label: 'Saved Tools', value: '18', note: '+3 this week' },
  { label: 'My Reviews', value: '7', note: '2 pending moderation' },
  { label: 'Profile Completion', value: '84%', note: 'Add social links to reach 100%' },
  { label: 'Notifications', value: '5', note: 'Unread updates' }
];

const bookmarks = [
  { name: 'PromptPilot', category: 'Productivity', rating: 4.7 },
  { name: 'DraftFlow', category: 'Writing', rating: 4.6 },
  { name: 'CodeSage AI', category: 'Developer Tools', rating: 4.3 }
];

const activity = [
  'You bookmarked VisionForge',
  'Your review for PromptPilot received 4 helpful votes',
  'Password changed successfully',
  'Newsletter preferences updated'
];

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-2 text-brand-muted">Manage your profile, bookmarks, reviews, and account activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-brand-surface p-5">
            <p className="text-sm text-brand-muted">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <p className="mt-1 text-xs text-brand-muted">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Bookmarks</h2>
            <button className="rounded-full border border-white/20 px-3 py-1 text-xs">View all</button>
          </div>
          <div className="space-y-3">
            {bookmarks.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-brand-muted">{tool.category}</p>
                </div>
                <p className="text-sm">⭐ {tool.rating.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <div className="mt-4 space-y-4 text-sm">
            <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              Email notifications
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-primary" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              Product updates
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-primary" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              Weekly digest
              <input type="checkbox" className="h-4 w-4 accent-brand-primary" />
            </label>
            <button className="w-full rounded-lg bg-brand-primary px-4 py-2 font-medium">Save Preferences</button>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <ul className="mt-4 space-y-3 text-sm text-brand-muted">
          {activity.map((item) => (
            <li key={item} className="rounded-lg border border-white/10 p-3">
              {item}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
