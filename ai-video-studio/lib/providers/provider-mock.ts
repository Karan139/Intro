import { GenerationRequest, ProviderStatusResult, VideoProvider } from '@/types/video';

const mockJobs = new Map<string, number>();

export class ProviderMockAdapter implements VideoProvider {
  name = 'provider-mock';

  async submit(_req: GenerationRequest) {
    const id = `mock-${crypto.randomUUID()}`;
    mockJobs.set(id, Date.now());
    return { providerJobId: id, etaSec: 45 };
  }

  async getStatus(providerJobId: string): Promise<ProviderStatusResult> {
    const startedAt = mockJobs.get(providerJobId);
    if (!startedAt) return { status: 'failed', progress: 0, errorMessage: 'Unknown mock job id.' };

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const progress = Math.min(100, elapsed * 8);

    if (progress >= 100) {
      return {
        status: 'done',
        progress: 100,
        previewUrl: 'https://picsum.photos/seed/aivideo/640/360',
        outputUrl: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
      };
    }

    if (progress > 80) return { status: 'uploading', progress };
    if (progress > 55) return { status: 'processing', progress };
    if (progress > 15) return { status: 'running', progress };
    return { status: 'queued', progress };
  }
}
