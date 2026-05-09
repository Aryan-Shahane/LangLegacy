import { NextRequest } from "next/server";
import { chatSubscribers } from "@/lib/streamManager";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (!chatSubscribers.has(roomId)) {
        chatSubscribers.set(roomId, new Set());
      }
      chatSubscribers.get(roomId)!.add(controller);

      // Keep-alive ping every 20s
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(ping);
          chatSubscribers.get(roomId)?.delete(controller);
        }
      }, 20_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        chatSubscribers.get(roomId)?.delete(controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
