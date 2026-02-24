import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGenerationJob } from '@/lib/video/orchestrator';

export async function POST(request: NextRequest) {
  const generationId = request.nextUrl.searchParams.get('generationId');
  if (!generationId) return NextResponse.json({ error: 'generationId is required' }, { status: 400 });

  const generation = await prisma.generation.findUnique({ where: { id: generationId } });
  if (!generation) return NextResponse.json({ error: 'Original generation not found' }, { status: 404 });

  const replay = await createGenerationJob({
    userId: generation.userId,
    projectId: generation.projectId || undefined,
    mode: generation.mode,
    prompt: generation.prompt,
    negativePrompt: generation.negativePrompt || undefined,
    durationSeconds: generation.durationSeconds,
    aspectRatio: generation.aspectRatio as '9:16' | '16:9' | '1:1',
    resolution: generation.resolution as '720p' | '1080p' | '4k',
    frameRate: (generation.frameRate || undefined) as 24 | 30 | 60 | undefined,
    qualityTier: generation.qualityTier as 'FAST' | 'BALANCED' | 'ULTRA',
    outputCodec: generation.outputCodec as 'h264' | 'h265' | 'webm',
    seed: generation.seed || undefined,
    lockSeed: generation.lockSeed,
    model: generation.model,
    settings: generation.settings as Record<string, unknown>,
    storyboard: generation.storyboard as any
  });

  return NextResponse.json({ generationId: replay.id, status: replay.status });
}
