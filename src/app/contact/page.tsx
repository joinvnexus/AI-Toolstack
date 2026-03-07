import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | AI Toolstack',
  description: 'Contact the AI Toolstack team.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border ui-border bg-gradient-to-br from-brand-primary/10 via-brand-surface/70 to-brand-background p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">Contact</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Let&apos;s connect</h1>
          <p className="mt-3 text-brand-muted">
            For support, feedback, partnerships, or listing updates, reach us anytime.
          </p>
          <div className="mt-6 space-y-2 text-sm text-brand-muted">
            <p>Email: support@aitoolstack.dev</p>
            <p>Response Time: Usually within 24 hours</p>
          </div>
        </section>

        <section className="ui-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Quick Message</h2>
          <div className="mt-4 space-y-3">
            <input type="text" placeholder="Your Name" className="ui-input w-full" />
            <input type="email" placeholder="Email Address" className="ui-input w-full" />
            <textarea placeholder="Write your message..." rows={5} className="ui-input w-full" />
            <button type="button" className="ui-btn ui-btn-primary w-full !rounded-lg">
              Send Message
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
