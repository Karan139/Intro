export async function createSignedUploadUrl(key: string, contentType: string) {
  // Placeholder for AWS SDK v3 / compatible provider integration.
  // Return a fake URL in local mock mode.
  if ((process.env.MOCK_MODE || 'true') === 'true') {
    return {
      uploadUrl: `https://example-upload.local/${key}?signature=mock`,
      fileUrl: `https://cdn.example.local/${key}`,
      contentType
    };
  }

  throw new Error('S3 signed URL not wired. Add your provider SDK implementation in lib/storage/s3.ts');
}
