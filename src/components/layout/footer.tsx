import Link from 'next/link';
import { siteConfig } from '@/lib/constants/site';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Browse Tools' },
  { href: '/blog', label: 'Blog' },
  { href: '/search', label: 'Search' },
];

const twitterHandle = siteConfig.social.twitter.replace(/^@/, '');
const twitterUrl = `https://x.com/${twitterHandle}`;

export function Footer() {
  return (
    <footer className="mt-16 border-t ui-border bg-brand-surface/50 backdrop-blur-sm">
      <div className="container-shell py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold tracking-tight">
              <span className="text-brand-primary">AI</span> Toolstack
            </p>
            <p className="mt-3 max-w-xl text-sm text-brand-muted">{siteConfig.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
              <a href={twitterUrl} target="_blank" rel="noreferrer" className="hover:text-brand-text">
                X / @{twitterHandle}
              </a>
              <a href={siteConfig.social.github} target="_blank" rel="noreferrer" className="hover:text-brand-text">
                GitHub
              </a>
              <a href={`mailto:${siteConfig.author.email}`} className="hover:text-brand-text">
                {siteConfig.author.email}
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <div className="mt-3 space-y-2 text-sm text-brand-muted">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block hover:text-brand-text">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Coming Soon</p>
            <div className="mt-3 space-y-2 text-sm text-brand-muted">
              <p className="flex items-center justify-between rounded-md border ui-border px-2 py-1">
                Tool Collections <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
              </p>
              <p className="flex items-center justify-between rounded-md border ui-border px-2 py-1">
                Compare Workspace <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
              </p>
              <p className="flex items-center justify-between rounded-md border ui-border px-2 py-1">
                Weekly Digest <span className="text-[10px] uppercase tracking-wide text-brand-primary">Soon</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t ui-border pt-5 text-xs text-brand-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>Built for discovering and comparing AI tools.</p>
        </div>
      </div>
    </footer>
  );
}
