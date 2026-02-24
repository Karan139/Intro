import { GenerationRequest } from '@/types/video';

const QUALITY_MULTIPLIER = { FAST: 1, BALANCED: 1.4, ULTRA: 2 };
const RES_MULTIPLIER = { '720p': 1, '1080p': 1.5, '4k': 3 };

export function estimateCredits(req: Pick<GenerationRequest, 'durationSeconds' | 'qualityTier' | 'resolution'>) {
  const base = req.durationSeconds * 2;
  const quality = QUALITY_MULTIPLIER[req.qualityTier];
  const resolution = RES_MULTIPLIER[req.resolution];
  return Math.ceil(base * quality * resolution);
}
