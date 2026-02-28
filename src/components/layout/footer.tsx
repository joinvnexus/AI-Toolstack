export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="container-shell text-sm text-brand-muted">
        © {new Date().getFullYear()} AI Toolstack. All rights reserved.
      </div>
    </footer>
  );
}
