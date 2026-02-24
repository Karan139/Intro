import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const [jobs, logs, users] = await Promise.all([
    prisma.generation.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.adminLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  ]);

  return (
    <main className="mx-auto grid max-w-7xl gap-4 p-6 lg:grid-cols-3">
      <section className="panel p-4 lg:col-span-2">
        <h2 className="text-xl font-semibold">Jobs + Costs</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs.map((job) => <li key={job.id} className="rounded bg-slate-800 p-2">{job.id} • {job.status} • {job.costCredits} credits • {job.errorMessage || 'ok'}</li>)}
        </ul>
      </section>
      <section className="panel p-4">
        <h2 className="text-xl font-semibold">Users + Credits</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((u) => <li key={u.id} className="rounded bg-slate-800 p-2">{u.email} • {u.creditsBalance} • {u.planTier}</li>)}
        </ul>
      </section>
      <section className="panel p-4 lg:col-span-3">
        <h2 className="text-xl font-semibold">Error Logs</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {logs.map((log) => <li key={log.id} className="rounded bg-slate-800 p-2">{log.level} • {log.message}</li>)}
        </ul>
      </section>
    </main>
  );
}
