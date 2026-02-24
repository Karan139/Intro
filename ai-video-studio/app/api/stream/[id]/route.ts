import { prisma } from '@/lib/prisma';
import { sseMessage } from '@/lib/realtime/sse';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const generationId = params.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const interval = setInterval(async () => {
        const generation = await prisma.generation.findUnique({ where: { id: generationId } });
        if (!generation) {
          controller.enqueue(encoder.encode(sseMessage('error', { message: 'Generation not found' })));
          clearInterval(interval);
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(sseMessage('status', {
          id: generation.id,
          status: generation.status,
          previewUrl: generation.previewUrl,
          outputUrl: generation.outputUrl,
          errorMessage: generation.errorMessage
        })));

        if (generation.status === 'DONE' || generation.status === 'FAILED') {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
