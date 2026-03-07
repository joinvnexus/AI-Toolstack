import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | AI Toolstack',
  description: 'Learn more about AI Toolstack and why we built it.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="rounded-2xl border ui-border bg-gradient-to-br from-brand-primary/10 via-brand-surface/70 to-brand-background p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">About Us</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">We help people discover better AI tools faster.</h1>
        <p className="mt-4 max-w-2xl text-brand-muted">
          AI Toolstack is a curated platform for exploring practical AI products, reading honest reviews, and tracking
          what is actually useful in real work.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="ui-card p-5">
          <h2 className="text-lg font-semibold">What We Do</h2>
          <p className="mt-2 text-sm text-brand-muted">
            We organize tools by category, highlight standout features, and keep listings easy to compare.
          </p>
        </article>
        <article className="ui-card p-5">
          <h2 className="text-lg font-semibold">Our Goal</h2>
          <p className="mt-2 text-sm text-brand-muted">
            Save your time by reducing noise and helping you pick the right tool for your workflow.
          </p>
        </article>
      </section>
    </div>
  );
}
