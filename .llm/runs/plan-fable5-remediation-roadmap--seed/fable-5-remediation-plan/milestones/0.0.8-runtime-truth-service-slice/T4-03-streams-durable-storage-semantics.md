# fix(streams): STREAMS_DATA_DIR is set by nothing the framework generates, so "durable streams" is always in-memory — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-03 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:fix` `area:plugins` `area:aspire` `area:docs` `priority:p1` `status:triage` ·
**Depends on:** none · **Coordinate with:** #1326, #1329 (plan as a trio; do not merge scopes)

## Summary

The streams service selects file-backed storage only when `STREAMS_DATA_DIR` is set; unset means
in-memory, non-durable, and the service warns once and then reports healthy anyway. `STREAMS_DATA_DIR`
appears in exactly five files repo-wide, all of them the streams service itself, its test, its README
and one docs paragraph — no scaffold, no Aspire contribution, no generated AppHost, and no template
ever sets it. The default every user gets is therefore a plugin named "durable streams" whose data
does not survive a restart, backed by an upstream `DurableStreamTestServer`. Worse, the documented
escape hatch is itself unproven: a measured wave-4 run found file-backed mode silently swallowing
producer writes. The roadmap must decide between durable-by-default and honestly-ephemeral; it
cannot keep shipping the name without the property.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §4.2, §8 ledger row 7; `research/wave-4.md` §2.2
  — "`STREAMS_DATA_DIR` file-backed mode **silently swallows all producer writes**; `flush()` after
  upsert does the same; `flush()` resolves either way"; `SYNTHESIS.md` §1.4, §6 (T4 pack, "stream
  durability" — no existing owner).
- `plugins/streams/services/src/main.ts:36-40` — reads `STREAMS_DATA_DIR`, calls
  `describeStorageDurability(dataDir)`, `console.warn`s when not durable, then starts.
- `plugins/streams/services/src/durability.ts:16-29` — unset or empty ⇒
  `{ durable: false, message: 'Streams service storage is non-durable (in-memory)…' }`.
- `plugins/streams/services/src/main.ts:50-53` — the backing store is
  `new DurableStreamTestServer({ port, host: '127.0.0.1', dataDir })`, i.e. a *test* server used as
  the product substrate.
- Repo-wide grep for `STREAMS_DATA_DIR` (excluding `.llm/`, `.git/`) returns five files only:
  `docs/site/durable-workflows/streams.md:287`, `plugins/streams/README.md:20-22`,
  `plugins/streams/services/src/durability.ts`, `.../durability_test.ts`, `.../main.ts`. **Zero hits
  in `packages/cli/`, zero in any template or generated AppHost.**
- `plugins/streams/src/aspire/streams-contribution.ts:41-44` — `declareEnv()` sets only
  `DURABLE_STREAMS_URL`, so even the (unread) declaration seam never mentions persistence.
- Health check ignores durability:
  `plugins/streams/services/src/main.ts:58-70` registers `healthChecks.custom('durable-streams-server', …)`
  which probes upstream reachability only.
- Adjacent open issues: #1326 (p0, producer never reconnects), #1329 (p0, SSE envelope), #1280
  (blocked, backing-service health), #431 (dashboard streams panel).

## Current surface

Durability is opt-in via an env var that no generated artifact sets, so it is effectively
unreachable for the scaffold user; the only documentation of it is a prose callout telling the user
to set it themselves. The service reports healthy in both modes and advertises no storage mode on
its health payload, so neither the dashboard nor `plugin doctor` can tell an operator which one they
are running. On the durable branch there is no restart proof anywhere in the repo: `durability_test.ts`
asserts only the two message strings.

## Target contract

The generated AppHost must take exactly one of two positions, recorded in the plugin manifest and
enforced by a gate:

- **(A) Durable by default.** The AppHost mounts an explicit persistent volume/data directory for
  the streams resource, sets the corresponding service configuration, and proves that events written
  before a restart are readable after it. Retention, corruption behavior (unreadable/partial data
  dir), and backup/restore expectations are documented as part of the contract.
- **(B) Explicitly ephemeral.** The service, its resource name, its README, the docs page and the
  package's own description state that stream storage is in-process and non-durable; every "durable"
  claim is corrected; and any durable mode is gated behind an explicitly-opted, restart-proven
  configuration rather than an undocumented env var.

In both branches: the storage mode appears on the health/status payload; the service refuses to
report a durability property it has not proven; and the wave-4 write-swallowing symptom on the
file-backed path is reproduced and fixed (or the path is removed) before that path is advertised.

## Acceptance

- [ ] The generated AppHost either provisions persistent stream storage or declares the service
      ephemeral — with the choice recorded in the plugin manifest.
- [ ] Events written before a service restart are readable after it, proven by an executed test
      (branch A) or explicitly refused as a claim (branch B).
- [ ] The health/status payload reports the active storage mode.
- [ ] The file-backed write path is proven to deliver producer writes, or is removed rather than
      documented.
- [ ] Retention, data-dir corruption, and backup/restore expectations are documented for the shipped
      branch.
- [ ] Every "durable" claim in `plugins/streams/README.md`, `docs/site/durable-workflows/streams.md`
      and package metadata matches the shipped branch.
- [ ] A negative test proves an unwritable or missing data directory fails startup or degrades
      health, rather than silently falling back to memory.
- [ ] A negative test proves the service cannot report a durability property it has not proven.
- [ ] `DurableStreamTestServer` is either replaced as the product substrate or its use is recorded
      as an accepted, named architecture-debt entry with an exit condition.

## Boundaries

- **#1326 owns producer reconnect, buffer bounds, readiness and shutdown semantics.** This issue must
  not change `DurableStreamProducer` connect/retry behavior. **#1329 owns the versioned SSE event
  envelope**; storage-mode fields do not enter the wire envelope without #1329's schema.
  Plan all three together; land them as separate PRs with separate closing keywords.
- **#1280** (blocked upstream) owns backing-service health checks; the streams service is
  NetScript-authored and is not covered by that block.
- **T4-06** owns the hardcoded `4437` in the streams contribution and the generated consumer stub;
  do not fix ports here.
- **#431** (dashboard streams panel) consumes the storage-mode signal; it does not define it.
- Choosing an alternative durable-stream backend, or introducing a new persistence plugin archetype,
  is out of scope — if branch A cannot be met with the current substrate, the outcome is branch B
  plus a follow-up, not an unplanned backend swap.

## Docs/consumer proof

`docs/site/durable-workflows/streams.md` states one storage story that matches the shipped branch,
with the restart behavior demonstrated rather than described. Consumer proof: on a scaffolded
project, restart the streams resource and re-read a stream — branch A shows the prior events,
branch B shows an empty stream *and* a status payload that said so before the restart. Either
outcome is checkable by an unfamiliar agent without reading plugin source.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Grep counts and file:line
citations re-verified against worktree baseline `fac9e339042c`; the file-backed write-swallowing
symptom is a wave-4 measurement carried forward, not re-measured in this planning run.
