export type GenerationMode = 'TEXT_TO_VIDEO' | 'IMAGE_TO_VIDEO' | 'FRAMES_TO_VIDEO';

export interface StoryboardMoment {
  timestampSec: number;
  prompt: string;
  imageAssetId?: string;
}

export interface GenerationRequest {
  userId: string;
  projectId?: string;
  mode: GenerationMode;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  resolution: '720p' | '1080p' | '4k';
  frameRate?: 24 | 30 | 60;
  qualityTier: 'FAST' | 'BALANCED' | 'ULTRA';
  outputCodec: 'h264' | 'h265' | 'webm';
  seed?: number;
  lockSeed?: boolean;
  model: string;
  settings: Record<string, unknown>;
  storyboard?: StoryboardMoment[];
  assetIds?: string[];
}

export interface ProviderSubmissionResult {
  providerJobId: string;
  etaSec?: number;
}

export interface ProviderStatusResult {
  status: 'queued' | 'running' | 'processing' | 'uploading' | 'done' | 'failed';
  progress: number;
  outputUrl?: string;
  previewUrl?: string;
  errorMessage?: string;
}

export interface VideoProvider {
  name: string;
  submit(req: GenerationRequest): Promise<ProviderSubmissionResult>;
  getStatus(providerJobId: string): Promise<ProviderStatusResult>;
  cancel?(providerJobId: string): Promise<void>;
}
