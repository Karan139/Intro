import { ProviderAAdapter } from './provider-a';
import { ProviderMockAdapter } from './provider-mock';
import { VideoProvider } from '@/types/video';

export function getProvider(name?: string): VideoProvider {
  const provider = (name || process.env.VIDEO_PROVIDER || 'mock').toLowerCase();
  if (provider === 'providera' || provider === 'provider-a') return new ProviderAAdapter();
  return new ProviderMockAdapter();
}
