'use client';

import { useMemo, useState } from 'react';

const templates = ['cinematic', 'anime', 'realistic', 'product ad', 'music video', 'documentary'];

export function WorkspaceShell() {
  const [durationSeconds, setDurationSeconds] = useState(20);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [quality, setQuality] = useState<'FAST' | 'BALANCED' | 'ULTRA'>('BALANCED');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const estimatedCost = useMemo(() => {
    const q = quality === 'FAST' ? 1 : quality === 'BALANCED' ? 1.4 : 2;
    const r = resolution === '720p' ? 1 : resolution === '1080p' ? 1.5 : 3;
    return Math.ceil(durationSeconds * 2 * q * r);
  }, [durationSeconds, quality, resolution]);

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr_360px]">
      <aside className="panel p-4">
        <h2 className="mb-4 text-lg font-semibold">Mode + Settings</h2>
        <label className="mb-3 block text-sm">Duration: {durationSeconds}s</label>
        <input type="range" min={20} max={25} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} />
        <div className="mt-3">
          <label className="text-sm">Aspect Ratio</label>
          <select className="mt-1 w-full rounded bg-slate-800 p-2" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9' | '1:1')}>
            <option value="9:16">Vertical 9:16</option>
            <option value="16:9">Horizontal 16:9</option>
            <option value="1:1">Square 1:1</option>
          </select>
        </div>
        <div className="mt-3">
          <label className="text-sm">Quality Tier</label>
          <select className="mt-1 w-full rounded bg-slate-800 p-2" value={quality} onChange={(e) => setQuality(e.target.value as 'FAST' | 'BALANCED' | 'ULTRA')}>
            <option>FAST</option><option>BALANCED</option><option>ULTRA</option>
          </select>
        </div>
        <div className="mt-3">
          <label className="text-sm">Resolution</label>
          <select className="mt-1 w-full rounded bg-slate-800 p-2" value={resolution} onChange={(e) => setResolution(e.target.value as '720p' | '1080p' | '4k')}>
            <option>720p</option><option>1080p</option><option>4k</option>
          </select>
        </div>
      </aside>

      <section className="panel flex flex-col p-4">
        <h2 className="text-lg font-semibold">Preview + Timeline</h2>
        <div className="mt-4 flex-1 rounded-lg border border-dashed border-slate-700 p-4 text-slate-400">Video preview area</div>
        <div className="mt-4 panel p-3">
          <div className="mb-2 flex items-center justify-between"><h3 className="font-medium">Storyboard (4-8 key moments)</h3><button className="rounded bg-slate-800 px-3 py-1">Auto storyboard</button></div>
          <ul className="space-y-2 text-sm">
            {[0, 5, 10, 15, 20].map((t) => <li key={t} className="rounded bg-slate-800 p-2">{t}s - mini prompt + optional image reference</li>)}
          </ul>
        </div>
      </section>

      <aside className="panel p-4">
        <h2 className="text-lg font-semibold">Prompt Studio</h2>
        <textarea className="mt-3 h-28 w-full rounded bg-slate-800 p-3" placeholder="Describe your video" />
        <input className="mt-2 w-full rounded bg-slate-800 p-2" placeholder="Negative prompt" />
        <div className="mt-3 flex flex-wrap gap-2">
          {templates.map((template) => <span key={template} className="rounded-full bg-slate-800 px-3 py-1 text-xs">{template}</span>)}
        </div>
        <button className="mt-4 w-full rounded bg-indigo-500 py-2 font-medium">Generate</button>
        <div className="mt-4 panel p-3">
          <h3 className="font-medium">Cost Estimate</h3>
          <p className="text-2xl font-bold text-indigo-300">{estimatedCost} credits</p>
        </div>
        <button className="mt-4 text-sm text-slate-300" onClick={() => setAdvancedOpen((v) => !v)}>Advanced {advancedOpen ? '▲' : '▼'}</button>
        {advancedOpen && (
          <div className="mt-2 space-y-2 rounded bg-slate-800 p-3 text-sm">
            <p>Camera/lens/DoF/lighting/color grade/motion strength</p>
            <p>Seed + lock seed, stabilization, smart reframe, upscale/denoise/sharpen</p>
            <p>Image guidance strength, preserve subject, background motion, frame smoothness/interpolation</p>
          </div>
        )}
      </aside>
    </div>
  );
}
