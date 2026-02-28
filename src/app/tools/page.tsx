import { ToolCard } from '@/components/tools/tool-card';
import { tools } from '@/lib/constants/site';

export default function ToolsPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Tools Directory</h1>
      <p className="mt-2 text-brand-muted">Filter and compare modern AI tools by category, pricing, and rating.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
