<p align="center">
  <img src="https://minecraft.wiki/images/Beacon_JE6_BE2.png" width="96" alt="beacon" />
</p>

<h1 align="center">beacon</h1>

<p align="center">
  A tiny self-hosted pub/sub broker for your own projects.<br />
  NestJS on Bun — no Redis, no Kafka, no external infrastructure.
</p>

---

**beacon** lets a handful of apps talk to each other through events. One app
`POST`s an event and every subscriber listening on that topic receives it
over
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

```
POST /publish ──▶ 200 {eventId} ──▶ SSE subscribers
```

## Why

Sometimes you have five or ten personal projects that need to react to each
other, and standing up Kafka or a Redis cluster for that is absurd. beacon
trades horizontal scale for a setup that is `bun install` and a single config
file, while still keeping the guarantees that matter at this size:

- **Pure pub/sub** — an event is published and fanned out to whoever is
  listening at that moment. No queue, no database, nothing to clean up.
- **Token auth with trusted authorship** — every client has its own bearer
  token, and the event's `source` comes from the token, never from the body.
  One client cannot impersonate another.
- **Zero dependencies to operate** — Bun is the whole runtime. No files are
  created at runtime; state lives only in memory.

## Quickstart

```bash
git clone https://github.com/dayvsonspacca/beacon.git
cd beacon
bun install

cp beacon.toml.example beacon.toml   # then edit the tokens
bun run build
bun run start:prod
```

beacon refuses to boot without a `beacon.toml` — it is the client registry:

```toml
[[clients]]
source = "blog"                      # identity: published events carry this
token = "btk_<48 random hex chars>"  # openssl rand -hex 24

[[clients]]
source = "checkout"
token = "btk_..."
```

| Environment variable | Default       | Purpose                  |
| -------------------- | ------------- | ------------------------ |
| `PORT`               | `3000`        | HTTP port                |
| `BEACON_CONFIG_PATH` | `beacon.toml` | Client registry location |

## API

Every request needs `Authorization: Bearer <token>`.

### `POST /publish`

```bash
curl -X POST https://beacon.example.com/publish \
  -H 'Authorization: Bearer btk_...' \
  -H 'Content-Type: application/json' \
  -d '{ "topic": "orders.created", "data": { "orderId": 42 } }'
```

```json
{ "eventId": "d3575…", "status": "published" }
```

The event is delivered to current subscribers before the response returns.
`topic` is a non-empty string, trimmed and lowercased (`Orders.CREATED` →
`orders.created`). `data` is any JSON object. The event's `source` is stamped
from the authenticated client.

### `GET /subscribe` (SSE)

```bash
curl -N 'https://beacon.example.com/subscribe?topic=orders.*' \
  -H 'Authorization: Bearer btk_...'
```

Streams events as they are published:

```
event: orders.created
data: {"eventId":"d3575…","topic":"orders.created","source":"checkout","data":{"orderId":42}}
```

| Query   | Meaning |
| ------- | ------- |
| `topic` | Filter: exact (`orders.created`), one segment (`orders.*`), any depth (`orders.**`). Empty = everything. |

In the browser, `fetch` + a stream reader works with dynamic topic names
(`EventSource` only exposes event names it knows upfront):

```js
const res = await fetch('https://beacon.example.com/subscribe?topic=commits.*', {
  headers: { Authorization: 'Bearer btk_...', Accept: 'text/event-stream' },
});
// read res.body and split on blank lines — see the SSE wire format
```

## Semantics, honestly

- **At-most-once delivery**: subscribers connected at publish time receive
  the event; anyone else never sees it. There is no persistence, no retry,
  no replay.
- **Single instance**: the event bus is per-process. Two beacon instances
  are two independent brokers.

## Development

```bash
bun run start:dev   # watch mode
bun test src        # unit tests
bun run lint
bun run format
```

Built with [NestJS](https://nestjs.com) running on [Bun](https://bun.sh).
