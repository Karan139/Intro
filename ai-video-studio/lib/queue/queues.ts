import { Queue } from 'bullmq';
import { redis } from './connection';

export const GENERATION_QUEUE = 'generation-jobs';

export const generationQueue = new Queue(GENERATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500
  }
});
