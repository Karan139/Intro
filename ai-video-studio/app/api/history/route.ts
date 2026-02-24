import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const history = await prisma.generation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ history });
}
