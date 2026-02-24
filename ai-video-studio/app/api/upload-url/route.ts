import { NextRequest, NextResponse } from 'next/server';
import { createSignedUploadUrl } from '@/lib/storage/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, contentType } = body;
    if (!key || !contentType) return NextResponse.json({ error: 'key and contentType are required' }, { status: 400 });
    const signed = await createSignedUploadUrl(key, contentType);
    return NextResponse.json(signed);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate signed URL' }, { status: 500 });
  }
}
