import { prisma } from '@/lib/prisma';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id }, include: { generations: { orderBy: { createdAt: 'desc' } } } });
  if (!project) return <main className="p-6">Project not found.</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-2 text-slate-300">Autosave enabled for workspace controls.</p>
      <ul className="mt-6 space-y-2">
        {project.generations.map((g) => (
          <li key={g.id} className="panel p-3">{g.prompt} • {g.status} • {g.createdAt.toISOString()}</li>
        ))}
      </ul>
    </main>
  );
}
