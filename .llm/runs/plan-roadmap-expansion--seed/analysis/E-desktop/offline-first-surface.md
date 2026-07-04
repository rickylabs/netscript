# Offline-first surface: tursodb single-writer, Turso Sync, unified-vs-multi-process precedent

## The constraint

tursodb's native driver holds an exclusive OS file lock per database file (`os error 33` on
double-open — see `eis-chat-desktop-shell-options.md` for the exact quote from
`docs/DESKTOP-SHELL.md`). This means: **at most one OS process may hold the local db file open at
a time**, full stop, regardless of desktop packaging strategy.

## What Turso Sync does and does not solve

Turso Sync (research summarized in `research/E-desktop/turso-sync-offline-first.md`) is a
local-SQLite-file ↔ Turso-Cloud sync layer: local writes happen against the local file, `push()`
sends them to the cloud, `pull()` brings remote changes down, with a default "Last-Push-Wins"
conflict policy and a `transform` hook for custom merge logic.

- **Solves:** cross-device / cross-session durability and multi-device consistency for a workload
  that is otherwise offline-capable — i.e., "offline-first" in the conventional sense (works
  without connectivity, reconciles later).
  it does not, and architecturally cannot, allow two OS processes on the same machine to hold the
  same local db file open concurrently.
- **Practical implication for topic E:** Turso Sync is a clean fit for architecture option (c) (true
  single-process desktop — see `eis-chat-desktop-shell-options.md`), where "one process = the one
  local writer, and that writer periodically syncs to cloud" is exactly the intended usage pattern.
  It does **not** help options (a) or (b), where the constraint that matters is *local, same-machine,
  same-moment* process count, not cross-device sync.

## What "offline-first" concretely means for NetScript, given this

Two genuinely different asks get conflated under "offline-first" and should be named separately
for the topic-E owner:

1. **Offline-capable single-process desktop app** (matches option (c) exactly): one process owns
   the tursodb file, can operate fully disconnected, and syncs opportunistically via Turso Sync
   when connectivity returns. This is a real, buildable feature once option (c)'s architecture
   (in-process service mount + sdk link-mode adapter) exists.
2. **Multi-process local dev/production topology continuing to work without a shared network
   dependency** (matches eis-chat's current option (b) reality): this is really a *local KV/queue*
   topology question, not a tursodb question, and NetScript already has a shipped, validated answer
   for it (see below).

## The unified-vs-multi-process precedent that already exists: #371/#372 (KV/queue layer)

Issue #371 ("feat(aspire): restore shared Deno KV Connect cache/queue resource", **CLOSED**) is the
concrete, already-shipped precedent for exactly this class of "unified (single-process) vs
multi-process" decision, at the KV/queue layer rather than the SQL layer:

- **Unified/single-process mode**: services use **local in-process Deno KV** — no shared resource,
  no network hop, zero extra Aspire wiring. This is the default when nothing else is configured.
- **Multi-process mode**: services share a **remote/shared Deno KV Connect backend** (Garnet or
  compatible), so multiple independently-running processes see a consistent KV/queue state. This
  is entirely config-driven — `getDenoKvConnectionFromEnv()` + `KvPollingAdapter`'s
  `isKvConnect()` branch select the backend with **zero `@netscript/sdk` or `@netscript/kv` code
  change** required by callers.
- Live-validated via sibling issue #372: a Docker-less Garnet-executable resource was added to the
  Aspire generator so this multi-process mode works even without Docker/Compose available (relevant
  because Windows bare-metal dev, the same environment eis-chat's desktop POC ran in, often lacks
  Docker).

**Why this matters for topic E:** it shows NetScript's own architecture already has a working,
tested template for "detect unified vs multi-process topology, switch backend transparently,
provider-provisioned via Aspire generator, no SDK surface change" — at the KV/queue layer. The
desktop single-process story (tursodb + sdk link-mode) is a structurally similar problem one layer
down (SQL rather than KV), and could reuse the same *shape* of solution (config-driven backend
selection + Aspire-generator-side provisioning), even though the concrete plumbing (`ClientLinkPort`
adapter vs `KvPollingAdapter`) is necessarily different. This is offered as a sequencing/pattern
observation only, not a scoping commitment — delegated to the supervisor.

## Issue #349's second sense of "unified"

Issue #349's own title uses "unified-mode" to mean **tier-3 serverless bundling** (Nitro/Vercel/CF),
which is a third, distinct sense from both (1) desktop single-process and (2) local-KV-vs-shared-KV.
A comment on #349 cross-links #371 specifically to clarify this distinction for readers — i.e. the
issue-graph author was aware of the terminology collision and flagged it, rather than the three
senses being silently conflated. Quoted for precision:

> (#349 comment, 2026-07-03, paraphrased from the fetched issue JSON) clarifies that the KV/queue
> unified-vs-multi-process story (#371/#372) is a separate, already-solved axis from this issue's
> own tier-3-serverless "unified mode," and that neither should be assumed to cover the desktop
> single-process case.

This three-way terminology overlap ("unified mode" meaning: (i) desktop single-process hosting,
(ii) local-vs-shared KV topology, (iii) tier-3 serverless bundling) is itself worth flagging to the
topic-E supervisor as a naming-hygiene item independent of any scheduling decision.
