import { prisma } from '@/lib/prisma';
import { PreviewCard } from '@/components/shared/preview-card';

export default async function HistoryPage() {
  const generations = await prisma.generation.findMany({ orderBy: { createdAt: 'desc' }, take: 24 });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Generation History</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {generations.map((g) => (
          <div key={g.id}>
            <PreviewCard
              thumbnail={g.previewUrl || 'https://picsum.photos/seed/aivideo/640/360'}
              duration={g.durationSeconds}
              aspectRatio={g.aspectRatio}
              model={g.model}
              qualityTier={g.qualityTier}
            />
            <form action={`/api/generations/re-run?generationId=${g.id}`} method="post" className="mt-2">
              <button className="w-full rounded bg-slate-800 px-3 py-2 text-sm">Re-run</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
