import type { Message } from "@/lib/types";

// In-memory subscriber map (resets on server restart — acceptable for MVP)
// Using globalThis to prevent clearing on Next.js HMR
const globalSubscribers = globalThis as unknown as {
  _chatSubscribers?: Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>;
};

if (!globalSubscribers._chatSubscribers) {
  globalSubscribers._chatSubscribers = new Map();
}

export const chatSubscribers = globalSubscribers._chatSubscribers;

export function broadcast(roomId: string, message: Message) {
  const data = `data: ${JSON.stringify([message])}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  
  chatSubscribers.get(roomId)?.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      // Ignored, dead connection
    }
  });
}
