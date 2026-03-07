import Link from 'next/link';
import { siteConfig } from '@/lib/constants/site';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Browse Tools' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/search', label: 'Search' },
];

const twitterHandle = siteConfig.social.twitter.replace(/^@/, '');
const twitterUrl = `https://x.com/${twitterHandle}`;

export function Footer() {
  return (
    <footer className="mt-16 border-t ui-border bg-gradient-to-b from-brand-surface/70 via-brand-background to-brand-background">
      <div className="container-shell py-12">
        <div className="rounded-2xl border ui-border bg-brand-surface/60 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <p className="text-lg font-semibold tracking-tight">
                <span className="text-brand-primary">AI</span> Toolstack
              </p>
              <p className="mt-3 max-w-xl text-sm text-brand-muted">{siteConfig.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-brand-muted">
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border ui-border px-3 py-1 hover:bg-brand-primary/10 hover:text-brand-text"
                >
                  X / @{twitterHandle}
                </a>
                <a
                  href={siteConfig.social.github}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border ui-border px-3 py-1 hover:bg-brand-primary/10 hover:text-brand-text"
                >
                  GitHub
                </a>
                <a
                  href={`mailto:${siteConfig.author.email}`}
                  className="rounded-full border ui-border px-3 py-1 hover:bg-brand-primary/10 hover:text-brand-text"
                >
                  Email
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Quick Links</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-brand-muted hover:bg-brand-primary/10 hover:text-brand-text"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Roadmap</p>
              <div className="mt-3 space-y-2 text-sm text-brand-muted">
                <p className="flex items-center justify-between rounded-lg border ui-border bg-brand-surface/70 px-3 py-2">
                  Tool Collections <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
                </p>
                <p className="flex items-center justify-between rounded-lg border ui-border bg-brand-surface/70 px-3 py-2">
                  Compare Workspace <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
                </p>
                <p className="flex items-center justify-between rounded-lg border ui-border bg-brand-surface/70 px-3 py-2">
                  Weekly Digest <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t ui-border pt-5 text-xs text-brand-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>Built for discovering and comparing AI tools.</p>
        </div>
      </div>
    </footer>
  );
}
