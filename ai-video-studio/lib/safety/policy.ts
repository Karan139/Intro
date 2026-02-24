const blockedPatterns = [
  /minor\s+sexual/i,
  /child\s+sexual/i,
  /graphic\s+violence/i,
  /self-harm\s+instructions/i
];

export function runSafetyChecks(prompt: string, negativePrompt?: string) {
  const source = `${prompt}\n${negativePrompt || ''}`;
  const match = blockedPatterns.find((pattern) => pattern.test(source));
  if (!match) return { pass: true as const };

  return {
    pass: false as const,
    reason:
      'This request violates safety policy. Try a safe alternative: non-graphic action, implied conflict, or abstract storytelling.'
  };
}
