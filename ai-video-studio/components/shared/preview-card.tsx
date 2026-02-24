interface PreviewCardProps {
  thumbnail: string;
  duration: number;
  aspectRatio: string;
  model: string;
  qualityTier: string;
}

export function PreviewCard({ thumbnail, duration, aspectRatio, model, qualityTier }: PreviewCardProps) {
  return (
    <article className="panel overflow-hidden">
      <img src={thumbnail} alt="preview" className="h-40 w-full object-cover" />
      <div className="space-y-1 p-3 text-sm">
        <p>Duration: {duration}s</p>
        <p>Aspect: {aspectRatio}</p>
        <p>Model: {model}</p>
        <p>Quality: {qualityTier}</p>
      </div>
    </article>
  );
}
