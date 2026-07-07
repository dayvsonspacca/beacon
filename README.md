<p align="center">
  <img src="https://minecraft.wiki/images/Beacon_JE6_BE2.png" width="96" alt="beacon" />
</p>

<h1 align="center">beacon</h1>

<p align="center">
  A tiny self-hosted pub/sub broker for your own projects.<br />
  NestJS + SQLite — no Redis, no Kafka, no external infrastructure.
</p>

---

**beacon** lets a handful of apps talk to each other through events. One app
`POST`s an event, beacon queues it durably in SQLite, a worker delivers it,
and every subscriber listening on that topic receives it over
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

```
POST /publish ──▶ 202 {eventId} ──▶ SQLite (queued) ──▶ worker ──▶ SSE subscribers
```

## Why

Sometimes you have five or ten personal projects that need to react to each
other, and standing up Kafka or a Redis cluster for that is absurd. beacon
trades horizontal scale for a setup that is `npm install` and a single config
file, while still keeping the guarantees that matter at this size:

- **Durable queue** — events are jobs in SQLite (WAL). A crash or restart
  loses nothing; failed deliveries retry with linear backoff (3 attempts).
- **Replay** — subscribers can ask for the last N delivered events before
  going live, so a fresh page-load can render current state with zero
  client-side bookkeeping.
- **Token auth with trusted authorship** — every client has its own bearer
  token, and the event's `source` comes from the token, never from the body.
  One client cannot impersonate another.
- **Zero dependencies to operate** — Node 22+ is the whole runtime. The
  database is a file created on first boot.

## Quickstart

```bash
git clone https://github.com/dayvsonspacca/beacon.git
cd beacon
npm install

cp beacon.toml.example beacon.toml   # then edit the tokens
npm run build
npm run start:prod
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

| Environment variable | Default          | Purpose                  |
| -------------------- | ---------------- | ------------------------ |
| `PORT`               | `3000`           | HTTP port                |
| `BEACON_DB_PATH`     | `data/beacon.db` | SQLite database location |
| `BEACON_CONFIG_PATH` | `beacon.toml`    | Client registry location |

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
{ "eventId": "d3575…", "status": "queued" }
```

Returns `202 Accepted` immediately — delivery happens asynchronously.
`topic` is a non-empty string, trimmed and lowercased (`Orders.CREATED` →
`orders.created`). `data` is any JSON object. The event's `source` is stamped
from the authenticated client.

### `GET /subscribe` (SSE)

```bash
curl -N 'https://beacon.example.com/subscribe?topic=orders.*&last=5' \
  -H 'Authorization: Bearer btk_...'
```

Streams events as they are delivered:

```
event: orders.created
data: {"eventId":"d3575…","topic":"orders.created","source":"checkout","data":{"orderId":42}}
```

| Query   | Meaning |
| ------- | ------- |
| `topic` | Filter: exact (`orders.created`), one segment (`orders.*`), any depth (`orders.**`). Empty = everything. |
| `last`  | Replay the newest N (1–100) already-delivered matching events before going live. Backlog and live stream are seamlessly merged — no gaps, no duplicates. |

In the browser, `fetch` + a stream reader works with dynamic topic names
(`EventSource` only exposes event names it knows upfront):

```js
const res = await fetch('https://beacon.example.com/subscribe?topic=commits.*&last=5', {
  headers: { Authorization: 'Bearer btk_...', Accept: 'text/event-stream' },
});
// read res.body and split on blank lines — see the SSE wire format
```

## Semantics, honestly

- **At-most-once live delivery**: subscribers connected when the worker
  delivers an event receive it; a disconnected subscriber catches up with
  `last=N` on reconnect.
- **Single instance**: the queue and the event bus are per-process. Two
  beacon instances are two independent brokers.
- **Retention**: delivered jobs currently stay in SQLite forever, which is
  what makes replay possible. Cleanup policy is future work.

## Development

```bash
npm run start:dev   # watch mode
npm test            # unit tests
npm run lint
npm run format
```

Built with [NestJS](https://nestjs.com). Storage is
[`node:sqlite`](https://nodejs.org/api/sqlite.html) — no native build step.
