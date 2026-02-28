const overview = [
  { label: 'Total Users', value: '12,482' },
  { label: 'Published Tools', value: '538' },
  { label: 'Pending Reviews', value: '27' },
  { label: 'Draft Blog Posts', value: '14' }
];

const pendingReviews = [
  { tool: 'PromptPilot', user: 'Ava Chen', rating: 5, status: 'Flagged keyword' },
  { tool: 'VisionForge', user: 'Noah Patel', rating: 2, status: 'Needs manual check' },
  { tool: 'DraftFlow', user: 'Mila Gomez', rating: 4, status: 'Reported by 2 users' }
];

const quickActions = [
  'Add new tool',
  'Create blog post',
  'Manage categories',
  'Export monthly report'
];

export default function AdminPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-2 text-brand-muted">Manage tools, content, users, and moderation workflows from one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-brand-surface p-5">
            <p className="text-sm text-brand-muted">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Review Moderation Queue</h2>
            <button className="rounded-full border border-white/20 px-3 py-1 text-xs">Open full queue</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="text-brand-muted">
                <tr className="border-b border-white/10">
                  <th className="pb-3">Tool</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map((review) => (
                  <tr key={`${review.tool}-${review.user}`} className="border-b border-white/5">
                    <td className="py-3">{review.tool}</td>
                    <td className="py-3">{review.user}</td>
                    <td className="py-3">⭐ {review.rating}</td>
                    <td className="py-3 text-brand-muted">{review.status}</td>
                    <td className="py-3">
                      <button className="rounded-md border border-white/20 px-2 py-1 text-xs">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            {quickActions.map((action) => (
              <button
                key={action}
                className="w-full rounded-lg border border-white/15 px-4 py-2 text-left text-sm transition hover:border-brand-primary/60"
              >
                {action}
              </button>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h2 className="text-xl font-semibold">System Health</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">API: Operational</div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">DB: Operational</div>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">Email Queue: Delayed</div>
        </div>
      </article>
    </section>
  );
}
