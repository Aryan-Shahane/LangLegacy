import { NextRequest } from "next/server";
import { findDocuments } from "@/lib/cloudant";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();
  let lastSeen = req.nextUrl.searchParams.get("since") || "";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("ready", { ok: true });
      const interval = setInterval(async () => {
        try {
          const docs = (await findDocuments(
            "messages",
            { type: "message", room_id: id, status: "active" },
            100,
            0
          )) as Message[];
          docs.sort((a, b) => a.created_at.localeCompare(b.created_at));
          const next = docs.filter((m) => m.created_at > lastSeen);
          if (next.length > 0) {
            lastSeen = next[next.length - 1].created_at;
            send("messages", next);
          } else {
            send("ping", { at: new Date().toISOString() });
          }
        } catch {
          send("error", { message: "stream poll failed" });
        }
      }, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
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
