import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-center text-5xl font-bold">AI Video Studio</h1>
      <p className="max-w-2xl text-center text-slate-300">
        Text→Video, Image→Video, and Frames→Video with storyboard, prompt studio, quality tiers, queue, history, and admin controls.
      </p>
      <div className="flex gap-4">
        <Link href="/app" className="rounded-lg bg-indigo-500 px-5 py-3 font-medium hover:bg-indigo-400">Open Workspace</Link>
        <Link href="/history" className="rounded-lg border border-slate-700 px-5 py-3 font-medium hover:bg-slate-800">View History</Link>
      </div>
    </main>
  );
}
