import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { estimateCredits } from '@/lib/billing/cost-estimator';
import { runSafetyChecks } from '@/lib/safety/policy';
import { generationQueue } from '@/lib/queue/queues';
import { GenerationRequest } from '@/types/video';

export async function createGenerationJob(input: GenerationRequest) {
  if (input.durationSeconds < 20 || input.durationSeconds > 25) {
    throw new Error('Duration must be between 20 and 25 seconds.');
  }

  const safety = runSafetyChecks(input.prompt, input.negativePrompt);
  if (!safety.pass) {
    throw new Error(safety.reason);
  }

  const credits = estimateCredits(input);
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error('User not found.');
  if (user.creditsBalance < credits) throw new Error('Not enough credits. Please upgrade or purchase more credits.');

  const generation = await prisma.generation.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      mode: input.mode,
      status: JobStatus.QUEUED,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      seed: input.seed,
      lockSeed: input.lockSeed ?? false,
      durationSeconds: input.durationSeconds,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      frameRate: input.frameRate,
      qualityTier: input.qualityTier,
      outputCodec: input.outputCodec,
      format: input.outputCodec === 'webm' ? 'webm' : 'mp4',
      model: input.model,
      provider: process.env.VIDEO_PROVIDER || 'mock',
      settings: input.settings,
      storyboard: input.storyboard,
      costCredits: credits
    }
  });

  await prisma.$transaction([
    prisma.user.update({ where: { id: input.userId }, data: { creditsBalance: { decrement: credits } } }),
    prisma.billingLedger.create({
      data: {
        userId: input.userId,
        entryType: 'CREDIT_CONSUME',
        deltaCredits: -credits,
        balanceAfter: user.creditsBalance - credits,
        referenceId: generation.id,
        metadata: { reason: 'video_generation' }
      }
    })
  ]);

  await generationQueue.add('generation-process', { generationId: generation.id }, { jobId: generation.id });
  return generation;
}
