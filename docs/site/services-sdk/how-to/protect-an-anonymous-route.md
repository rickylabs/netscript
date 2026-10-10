---
layout: layouts/base.vto
title: Protect an anonymous service route
templateEngine: [vento, md]
order: 105
---

# Protect an anonymous service route

**Goal:** protect an anonymous device-flow start/poll pair with a shared client-address quota,
without requiring a signed-in principal. Use the service builder's rate-limit stage before the route
handlers. The same stage protects RPC and REST projections when their URL paths are selected.

## Reserve the quota in KV

Give this policy a dedicated KV prefix. All service instances use that prefix and the same limit,
window, and key policy. They need synchronized clocks. A KV backend must implement atomic
compare-and-set; unsupported backends fail when the store is constructed.

```ts
import { getKv } from '@netscript/kv';
import { createService } from '@netscript/service';
import { createKvRateLimitStore } from '@netscript/service/rate-limit';

const kv = await getKv();
const store = createKvRateLimitStore(kv, { prefix: ['device-flow', 'anonymous-quota'] });
const running = await createService({}, { name: 'device-flow' })
  .withRateLimit({
    routes: ['/device/start', '/device/poll'],
    limit: 10,
    windowMs: 60_000,
    store,
  })
  .route('post', '/device/start', (c) => c.json({ started: true }))
  .route('post', '/device/poll', (c) => c.json({ pending: true }))
  .serve({ hostname: '127.0.0.1', port: 0 });

// A supervisor owns the listener and the KV connection lifecycle.
await running.stop();
await kv.close();
```

Replace the example handlers with the device-flow implementation. The limiter is an independent
service middleware stage; it does not require a phone/web app session or background work driven by
browser reads. Use workers, sagas, or triggers for background work.

The two selected paths share ten accepted requests per client per epoch-aligned minute. Rejections
return `429`, JSON `{ error: 'RATE_LIMITED' }`, and `Retry-After` as whole seconds rounded up to
that window's end. Unselected paths perform no quota-store IO. Exact paths match every HTTP method;
`'/device/*'` matches the subtree and its root, while `'/devices'` stays outside it.

For oRPC handlers select both the REST URL (for example `'/api/device/start'`) and the RPC URL (for
example `'/api/rpc/device/start'`). Install CORS/logging before the quota stage to retain response
headers and logs on rejections. `withRateLimit()` uses `use()` ordering: it runs before the
auth/body-limit stages and deferred custom/RPC routes. Install it before `withHealth()` or
`withServiceInfo()` if you select those immediate routes. Repeated calls add independent stages.

## Choose a trustworthy client key

`serve()` supplies the socket peer to Hono, including on TLS listeners. Hono's Deno `getConnInfo`
continues to report that peer. The limiter defaults to this address. A mounting host must pass
`{ remoteAddr }` to `app.fetch(request, env)`, or supply a custom `key`; without metadata, clients
share the `unknown` bucket. The stage logs a warning once when it first encounters this fallback,
through the request logger or the service package logger. Configure logging to make it visible.

Forwarded headers are ignored by default, matching the auth transport policy introduced in #2026.
Enable XFF only with an explicit predicate identifying trusted proxy addresses:

```ts
import {
  createMemoryRateLimitStore,
  type ServiceRateLimitOptions,
} from '@netscript/service/rate-limit';

const options: ServiceRateLimitOptions = {
  routes: ['/device/*'],
  limit: 10,
  windowMs: 60_000,
  store: createMemoryRateLimitStore(),
  trustProxy: (address) => address === '192.0.2.10',
};
```

The resolver starts at the socket and walks XFF right to left while each hop is trusted. It stops at
the first untrusted address, so a spoofed leftmost value cannot bypass the quota. An untrusted
socket cannot enable header trust. Proxies must overwrite XFF or append the actual socket peer;
restrict direct access as appropriate for the deployment. Malformed chains, chains over 32 hops, and
headers over 8192 characters fall back to the socket address. This option does not change OAuth
protocol-header trust; configure auth's `trustProxyHeaders` independently.

IPv6 address keys are canonicalized and grouped by /64 by default, including trusted XFF addresses.
Rotating interface IDs within that network shares one bucket instead of evading quota or consuming
one memory-store slot per address. Set `ipv6Prefix` to an integer from 0–128 to choose another
prefix; `/128` keeps individual IPv6 hosts, and `/0` shares one IPv6 bucket per scope ID. Scope IDs
remain distinct, and IPv4-mapped IPv6 addresses follow the IPv6 prefix policy. Native IPv4 addresses
are unchanged. Custom `key` results are used verbatim, and proxy trust and Hono's socket metadata
still use the original address. Grouping can throttle several clients on one IPv6 network; choose a
prefix suited to your deployment. Prefix grouping reduces address churn within a network, but does
not prevent exhaustion by clients from many networks or attacker-controlled custom keys.

## Bound storage and contention

The KV store uses one read and one atomic version-checked write per attempt. Each accepted write has
`expireIn` equal to the remaining window duration. The default retry budget is eight attempts (at
most sixteen KV round trips), independent of client count; `maxAttempts` supports 1–32. Exhausting
the budget rejects conservatively with `429`. TTL bounds the lifetime of each attacker-chosen key,
but the KV adapter has no global key-count cap: many distinct keys can allocate many counters during
one live window. Accepted writes refresh expiry to the remaining window duration rather than adding
another full window. Rejected requests neither create nor refresh counters. Configure backend
capacity/admission controls and a stable, bounded custom key policy when callers can influence keys;
TTL alone does not bound live cardinality. Storage failures propagate through the service error
handler and never allow the protected route to run.

The memory store performs synchronous reservations, evicts expired entries in batches of at most 32
per request, and caps retained keys at `maxKeys` (default 10,000). It rejects new keys at capacity
and never evicts a live quota to admit another client. There are no timers to shut down. Use it for
tests/development; separate instances have separate quotas.

Fixed windows permit up to two windows' quota near a boundary. This primitive controls a shared
request quota; different start/poll quotas can use additional stages with separate stores/prefixes
and custom keys. A minimum elapsed interval between polls requires a separate policy. See the
[`@netscript/service` reference](/reference/service/#rate-limits-and-client-addresses) for the
public contracts and [KV reference](/reference/kv/#atomic-operations) for adapter atomic semantics.
