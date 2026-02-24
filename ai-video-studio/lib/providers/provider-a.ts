import { GenerationRequest, ProviderStatusResult, VideoProvider } from '@/types/video';

/**
 * Real API pattern adapter.
 * Replace placeholder URL + auth with your provider endpoints.
 */
export class ProviderAAdapter implements VideoProvider {
  name = 'provider-a';

  async submit(req: GenerationRequest) {
    const response = await fetch(`${process.env.PROVIDER_A_BASE_URL}/v1/video/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PROVIDER_A_API_KEY}`
      },
      body: JSON.stringify({
        mode: req.mode,
        prompt: req.prompt,
        negativePrompt: req.negativePrompt,
        duration: req.durationSeconds,
        aspectRatio: req.aspectRatio,
        resolution: req.resolution,
        qualityTier: req.qualityTier,
        settings: req.settings,
        storyboard: req.storyboard,
        assets: req.assetIds
      })
    });

    if (!response.ok) throw new Error(`ProviderA submit failed (${response.status})`);

    const data = await response.json();
    return { providerJobId: data.id as string, etaSec: data.etaSec as number };
  }

  async getStatus(providerJobId: string): Promise<ProviderStatusResult> {
    const response = await fetch(`${process.env.PROVIDER_A_BASE_URL}/v1/video/jobs/${providerJobId}`, {
      headers: { Authorization: `Bearer ${process.env.PROVIDER_A_API_KEY}` }
    });

    if (!response.ok) throw new Error(`ProviderA status failed (${response.status})`);

    const data = await response.json();
    return {
      status: data.status,
      progress: data.progress ?? 0,
      outputUrl: data.outputUrl,
      previewUrl: data.previewUrl,
      errorMessage: data.errorMessage
    };
  }
}
