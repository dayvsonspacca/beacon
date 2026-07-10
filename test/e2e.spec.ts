/**
 * Black-box e2e suite: talks HTTP to a running beacon instance (the Docker
 * image in CI). Point BEACON_URL at the instance; scripts/e2e.sh does the
 * build + run + teardown.
 */
import { describe, it, expect } from 'bun:test';

const BASE = process.env.BEACON_URL ?? 'http://localhost:3971';
const PUBLISHER_TOKEN = 'btk_e2e_publisher';
const SUBSCRIBER_TOKEN = 'btk_e2e_subscriber';

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function publish(body: unknown, token = PUBLISHER_TOKEN): Promise<Response> {
  return fetch(`${BASE}/publish`, {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Subscribes to `pattern`, runs `act`, and resolves with the first
 * `expectCount` SSE data payloads received (or fails after 5s).
 */
async function eventsReceived(
  pattern: string,
  expectCount: number,
  act: () => Promise<void>,
): Promise<any[]> {
  const controller = new AbortController();
  const response = await fetch(
    `${BASE}/subscribe?topic=${encodeURIComponent(pattern)}`,
    { headers: auth(SUBSCRIBER_TOKEN), signal: controller.signal },
  );
  expect(response.status).toBe(200);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const events: any[] = [];

  const collect = (async () => {
    let buffer = '';
    while (events.length < expectCount) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line.startsWith('data:')) {
          events.push(JSON.parse(line.slice(5)));
          if (events.length >= expectCount) return;
        }
      }
    }
  })();
  collect.catch(() => {}); // aborting the fetch rejects the pending read

  try {
    await act();
    await Promise.race([
      collect,
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `timed out waiting for ${expectCount} SSE events (got ${events.length})`,
              ),
            ),
          5000,
        ),
      ),
    ]);
  } finally {
    controller.abort();
  }
  return events;
}

describe('beacon e2e', () => {
  it('exposes a public health endpoint', async () => {
    const response = await fetch(`${BASE}/health`);
    expect(response.status).toBe(200);
  });

  it('rejects publishing without a valid token', async () => {
    const response = await publish(
      { topic: 'orders.created', data: {} },
      'btk_wrong',
    );
    expect(response.status).toBe(401);
  });

  it('rejects a non-object data field', async () => {
    const response = await publish({ topic: 'orders.created', data: 42 });
    expect(response.status).toBe(400);
  });

  it('delivers published events to matching subscribers, normalized and flat', async () => {
    let eventId = '';

    const events = await eventsReceived('orders.*', 2, async () => {
      const created = await publish({
        topic: '  Orders.CREATED ',
        data: { orderId: 42 },
      });
      expect(created.status).toBe(200);
      const body = await created.json();
      expect(body.status).toBe('published');
      eventId = body.eventId;

      // must NOT reach the orders.* subscriber
      await publish({ topic: 'users.signup', data: {} });
      // arriving after users.signup proves the filter dropped it
      await publish({ topic: 'orders.shipped', data: {} });
    });

    expect(events[0]).toEqual({
      eventId,
      topic: 'orders.created',
      source: 'e2e-publisher',
      data: { orderId: 42 },
    });
    expect(events[1].topic).toBe('orders.shipped');
  });
});
