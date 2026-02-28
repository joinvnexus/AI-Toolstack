import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/blog', label: 'Blog' },
  { href: '/dashboard', label: 'Dashboard' }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-background/75 backdrop-blur">
      <nav className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          AI Toolstack
        </Link>
        <ul className="flex items-center gap-6 text-sm text-brand-muted">
          {links.map((link) => (
            <li key={link.href}>
              <Link className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
