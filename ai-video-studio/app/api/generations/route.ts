import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGenerationJob } from '@/lib/video/orchestrator';

const schema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  mode: z.enum(['TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO', 'FRAMES_TO_VIDEO']),
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  durationSeconds: z.number().int().min(20).max(25),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']),
  resolution: z.enum(['720p', '1080p', '4k']),
  frameRate: z.union([z.literal(24), z.literal(30), z.literal(60)]).optional(),
  qualityTier: z.enum(['FAST', 'BALANCED', 'ULTRA']),
  outputCodec: z.enum(['h264', 'h265', 'webm']),
  seed: z.number().int().optional(),
  lockSeed: z.boolean().optional(),
  model: z.string(),
  settings: z.record(z.unknown()),
  storyboard: z.array(z.object({ timestampSec: z.number(), prompt: z.string(), imageAssetId: z.string().optional() })).optional(),
  assetIds: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const generation = await createGenerationJob(body);
    return NextResponse.json({ generationId: generation.id, status: generation.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
