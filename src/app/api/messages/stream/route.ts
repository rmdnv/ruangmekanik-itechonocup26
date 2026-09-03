import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countUnread, serializeMessageFor } from "@/lib/messaging";

export const dynamic = "force-dynamic";

const POLL_MS = 2000;
const HEARTBEAT_MS = 15000;

const encoder = new TextEncoder();

function sse(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  try {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  } catch {
    /* client gone */
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return new Response("Unauthorized", { status: 401 });

  let controller: ReadableStreamDefaultController;
  let interval: ReturnType<typeof setInterval> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      c.enqueue(encoder.encode(`: connected\n\n`));

      let since = new Date(Date.now());
      let done = false;
      let polling = false;
      type ChangedMessage = Awaited<ReturnType<typeof prisma.message.findMany>>[number];

      const poll = async () => {
        if (done || polling) return;
        polling = true;
        const queryFrom = since;
        let changed: ChangedMessage[] = [];
        try {
          changed = await prisma.message.findMany({
            where: {
              conversation: { OR: [{ user1Id: me.id }, { user2Id: me.id }] },
              OR: [{ createdAt: { gt: queryFrom } }, { updatedAt: { gt: queryFrom } }],
            },
            orderBy: { updatedAt: "asc" },
            take: 100,
          });
        } catch {
          /* db hiccup, retry next tick */
        }

        for (const message of changed) {
          const serialized = serializeMessageFor(message, me.id);
          if (!serialized) {
            sse(controller, "message.hidden", {
              conversationId: message.conversationId,
              messageId: message.id,
            });
          } else {
            sse(controller, "message.changed", {
              conversationId: message.conversationId,
              message: serialized,
            });
          }
        }

        if (changed.length > 0) {
          try {
            const unreadTotal = await countUnread(me.id);
            sse(controller, "inbox", { unreadTotal });
          } catch {
            /* ignore */
          }
        }

        since = new Date(Date.now());
        polling = false;
      };

      interval = setInterval(poll, POLL_MS);
      heartbeat = setInterval(() => {
        sse(controller, "ping", { now: Date.now() });
      }, HEARTBEAT_MS);
      void poll();

      const abort = () => {
        done = true;
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      if (request.signal) {
        request.signal.addEventListener("abort", abort, { once: true });
      }
    },
    cancel() {
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}