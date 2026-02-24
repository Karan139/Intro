import { Worker } from 'bullmq';
import { GENERATION_QUEUE } from '@/lib/queue/queues';
import { redis } from '@/lib/queue/connection';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/providers';

const provider = getProvider(process.env.VIDEO_PROVIDER);

const statusMap: Record<string, 'QUEUED' | 'RUNNING' | 'PROCESSING' | 'UPLOADING' | 'DONE' | 'FAILED'> = {
  queued: 'QUEUED',
  running: 'RUNNING',
  processing: 'PROCESSING',
  uploading: 'UPLOADING',
  done: 'DONE',
  failed: 'FAILED'
};

new Worker(
  GENERATION_QUEUE,
  async (job) => {
    const generation = await prisma.generation.findUnique({ where: { id: job.data.generationId } });
    if (!generation) throw new Error('Generation not found');

    const submit = await provider.submit({
      userId: generation.userId,
      projectId: generation.projectId || undefined,
      mode: generation.mode,
      prompt: generation.prompt,
      negativePrompt: generation.negativePrompt || undefined,
      durationSeconds: generation.durationSeconds,
      aspectRatio: generation.aspectRatio as '9:16' | '16:9' | '1:1',
      resolution: generation.resolution as '720p' | '1080p' | '4k',
      frameRate: generation.frameRate as 24 | 30 | 60 | undefined,
      qualityTier: generation.qualityTier as 'FAST' | 'BALANCED' | 'ULTRA',
      outputCodec: generation.outputCodec as 'h264' | 'h265' | 'webm',
      seed: generation.seed || undefined,
      lockSeed: generation.lockSeed,
      model: generation.model,
      settings: generation.settings as Record<string, unknown>,
      storyboard: generation.storyboard as any
    });

    await prisma.adminLog.create({ data: { level: 'info', generationId: generation.id, message: `Submitted to ${provider.name}`, metadata: { providerJobId: submit.providerJobId } } });

    const timeoutAt = Date.now() + 1000 * 60 * 20;
    while (Date.now() < timeoutAt) {
      const status = await provider.getStatus(submit.providerJobId);
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: statusMap[status.status],
          previewUrl: status.previewUrl,
          outputUrl: status.outputUrl,
          errorMessage: status.errorMessage,
          startedAt: generation.startedAt || new Date(),
          completedAt: status.status === 'done' ? new Date() : null
        }
      });

      if (status.status === 'done') return;
      if (status.status === 'failed') throw new Error(status.errorMessage || 'Provider failed');

      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    throw new Error('Generation timeout exceeded');
  },
  { connection: redis }
)
  .on('failed', async (job, err) => {
    if (!job) return;
    await prisma.generation.update({ where: { id: job.data.generationId }, data: { status: 'FAILED', errorMessage: err.message } });
    await prisma.adminLog.create({ data: { level: 'error', generationId: job.data.generationId, message: err.message } });
  });

console.log('Worker started');
