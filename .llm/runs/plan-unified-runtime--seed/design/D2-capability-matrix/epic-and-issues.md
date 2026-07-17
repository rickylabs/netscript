# DRAFT TEXT ONLY — NOT FILED ON GITHUB

**These are issue DRAFTS for Stage-E lock / Stage-H owner-ratified filing. Nothing here is filed.**
No GitHub mutation occurs from this pack (seed-run Stage-D contract: packs are drafts). Bodies carry
`Part of #823` and **never** a closing keyword (issue bodies and epics never carry `Closes/Fixes/
Resolves` — `netscript-pr` skill + AGENTS.md). Labels, milestones, and the epic slug below are
**suggestions**; the authoritative epic decomposition, milestone train, and supersession map are
owned by pack **D3 board-mechanics** and finalized at Stage-E. Draft IDs (`D2-S1`…) map to live
issue numbers only in the Stage-H `FILING-LOG.md`.

Assumed epic: **#823** (unified runtime / Nitro v3). Assumed epic slug for titles: `unified-runtime`
(owner/D3 fork — could be `deployment`; see open-questions Q1). Milestone suggestions follow the RFC
train (beta.12+, synthesis "Milestone anchor") and are owner forks at Stage-E.

---

## D2-S1 — Preset capability manifest + build-time rejection compiler

**Title:** `[unified-runtime S?] Preset capability manifest + build-time rejection compiler`

**Body:**

Part of #823.

Define the machine-readable **capability manifest** each of the four v1 runtime cells ships
(`deno_server`, `deno_deploy`, one Node server preset, one isolate/serverless preset), and the
**composition compiler** that cross-checks the app's logical graph requirements against the selected
preset's manifest, failing the **build** (never runtime, never a silent downgrade) on an
unsupported combination.

- Manifest encodes per-capability `lossless | partial | unsupported` + saga declaration + writer /
  offline flags (see `design/D2-capability-matrix/proposal.md` §3–§4).
- Compiler reads requirements from the logical composition root (sagas mounted? long-running queue
  listener? CAS-dependent trigger/idempotency store? exclusive-lock single-writer DB?).
- `unsupported` → hard build failure with a diagnostic naming capability + cell + externalize path.
  `partial` → build warning with the named degraded axis, requiring explicit adapter selection.
- Preserves logical graph identity across all cells (synthesis §3); gates only physical/one-process
  guarantees per cell.

Evidence: `drift-ledger.md` D-06; `sagas-constraint.md` Board consequence 2; `adapter-mapping.md`
KV-atomics + One-off-task rows.

**Labels:** `type:feat` · `area:cli` · `area:config` · `epic:unified-runtime` · `priority:p1` ·
`wave:v1` · `status:triage`

**Milestone (suggested):** `0.0.1-beta.12`

**Acceptance / gates:**
- [ ] gate: each of the four cells ships a capability manifest matching proposal.md §3.
- [ ] gate: an app mounting a saga runtime under a `deno_deploy`/`cloudflare_module` build **fails
      the build** with a diagnostic naming the externalize path (no runtime fallthrough).
- [ ] gate: a `partial` mapping (e.g. polling KV watch) emits a build warning naming the degraded
      axis, not a hard fail.
- [ ] gate: no Nitro primitive (unstorage / db0 / Nitro-task / H3 / Hono) is reachable from
      application code in any cell.

---

## D2-S2 — Per-preset sagas declaration & durability-tier proof

**Title:** `[unified-runtime S?] Per-preset sagas capability declaration & durability-tier proof`

**Body:**

Part of #823. Supersedes the categorical "Nitro excludes sagas" rule (#327 D1) with a per-preset
declaration.

Implement `sagas: supported | externalized | rejected` per cell and prove each against duration,
lifecycle, connector, and `SagaDurabilityTier` gates. In-process is allowed **only through the
NetScript saga runtime** (store/transport/outbox/idempotency ports authoritative); "externalized" =
macro-service split of the **same app model**; **never** a downgrade to Nitro tasks.

- C1 `deno_server`, C3 `node_server` → **supported** (long-lived; shutdown bound to Nitro `close`).
- C2 `deno_deploy`, C4 `cloudflare_module` → **externalized**, else **rejected** at build.

Evidence: `sagas-constraint.md` Verdict + Board consequence 1–3; `drift-ledger.md` D-05;
`adapter-mapping.md` Saga + Startup/shutdown rows; `proposal.md` §2.1.

**Labels:** `type:feat` · `area:plugins` · `epic:unified-runtime` · `priority:p1` · `wave:v1` ·
`status:triage`

**Milestone (suggested):** `0.0.1-beta.12`

**Acceptance / gates:**
- [ ] gate: supported cells run the shipped saga runtime in-process and drain on Nitro `close`
      (no orphaned transitions).
- [ ] gate: bounded-window cells reject an in-process saga at build unless a macro-service
      externalization target is configured.
- [ ] gate: no code path substitutes a Nitro task for a `SagaDefinition` (correlation / transitions
      / compensation / retry / idempotency / outbox preserved).

---

## D2-S3 — KV / queue / database host-binding adapters behind NetScript ports

**Title:** `[unified-runtime S?] KV/queue/database Nitro host-bindings behind NetScript ports`

**Body:**

Part of #823. Realize the ownership mappings in `proposal.md` §2.2–§2.4: NetScript `KvStore`,
`MessageQueue`, and `DatabaseAdapter` remain authoritative; Nitro unstorage / db0 / task primitives
are host bindings **behind** the ports, never exposed to application code. Board language uses the
shipped name `@netscript/database` (not `@netscript/data`).

- KV: map Nitro mounts behind `KvStore`; a CAS-dependent consumer on a non-CAS mount is a build
  rejection (S1), not best-effort. Nitro `ocache` is a host HTTP/function cache only — never durable
  KV/workflow state.
- Queue: `@netscript/queue` owns delivery/consumer/retry/DLQ; a Nitro task runner may dispatch into
  it but not replace it. Long-running `listen` is externalized on bounded-window cells.
- Database: `@netscript/database` owns health/lifecycle/telemetry/transactions; a db0 bridge is
  optional and provider-scoped. Durable provider-backed backing required on bounded-window cells;
  volatility removed from the definition of "in-process".

Evidence: `adapter-mapping.md` KV/Queue/SQL/Cache rows + "Adapter boundary"; `drift-ledger.md`
D-03/D-06/D-12; `nitro-v3.md` KV-storage/SQL/Cache rows.

**Labels:** `type:feat` · `area:kv` · `area:database` · `area:service` · `epic:unified-runtime` ·
`priority:p1` · `wave:v1` · `status:triage`

**Milestone (suggested):** `0.0.1-beta.12`

**Acceptance / gates:**
- [ ] gate: each cell's KV/queue/database mapping matches proposal.md §3 (L/P/U per row).
- [ ] gate: application code imports only `@netscript/kv|queue|database` surfaces — no unstorage /
      db0 / Nitro-task symbols leak.
- [ ] gate: Nitro response cache and durable KV are separate surfaces (no conflation test).

---

## D2-S4 — Writer-ownership & exclusive-lock capability (D-08)

**Title:** `[unified-runtime S?] Writer-ownership & exclusive-lock database capability`

**Body:**

Part of #823. Make writer ownership and exclusive-lock compatibility a **declared database
capability**; "default embedded" (single-writer Turso at the root) must not silently override
topology constraints. Long-lived cells (C1/C3) may hold an exclusive lock; bounded-window cells
(C2/C4) mark it `unsupported in-cell` → externalize or build-reject.

Evidence: `drift-ledger.md` D-08 (+ RFC §3 "locks earn a graph edge"); `proposal.md` §2.5.

**Labels:** `type:feat` · `area:database` · `epic:unified-runtime` · `priority:p2` · `wave:v1-min` ·
`status:triage`

**Milestone (suggested):** `0.0.1-beta.12`

**Acceptance / gates:**
- [ ] gate: exclusive-lock single-writer requirement builds on C1/C3 and build-rejects (or
      externalizes) on C2/C4.
- [ ] gate: embedded-Turso default never activates where a topology constraint forbids it (no
      silent override).

---

## D2-S5 — Task / schedule activation-adapter mapping

**Title:** `[unified-runtime S?] Task/schedule activation-adapter mapping`

**Body:**

Part of #823. Bind Nitro as a preset-aware **clock/activation adapter** while worker + trigger cores
keep definition, event record, backfill, retries, dispatch, and durable workflow. Nitro same-name
task coalescing must not silently change a worker's declared concurrency (→ build diagnostic, S1).
Cron is lossless on long-lived cells and partial (provider-native schedule generation, bounded
window) on C2/C4; durable workflow externalizes on bounded-window cells.

Evidence: `adapter-mapping.md` Cron / One-off-task / Durable-workflow rows; `nitro-v3.md`
Tasks/schedules + Cloudflare rows; `proposal.md` §2.7.

**Labels:** `type:feat` · `area:plugins` · `epic:unified-runtime` · `priority:p2` · `wave:v1` ·
`status:triage`

**Milestone (suggested):** `0.0.1-beta.13`

**Acceptance / gates:**
- [ ] gate: cron activation dispatches into NetScript definitions on all four cells per proposal.md
      §2.7 (L/P as declared).
- [ ] gate: Nitro same-name coalescing that would alter declared worker concurrency raises a build
      diagnostic, not silent acceptance.

---

## D2-S6 — Four-cell capability conformance gate suite

**Title:** `[unified-runtime S?] Four-cell capability conformance gate suite`

**Body:**

Part of #823. Author the conformance suite that proves each cell's manifest against real behavior:
`deno_server` (Node-built + `--unstable` launch, perms audited), `deno_deploy` (separate flow),
`node_server`, `cloudflare_module`. Treats `deno_server` and `deno_deploy` as **separate** cells.
Includes the Nitro-version / compatibility-date pin and an upgrade-conformance gate (beta maturity).

Evidence: `nitro-v3.md` Board inputs 1–2 + Deno-preset table; `proposal.md` §1, §4.

**Labels:** `type:test` · `area:cli` · `area:tooling` · `epic:unified-runtime` · `gate:e2e` ·
`priority:p1` · `wave:v1` · `status:triage`

**Milestone (suggested):** `0.0.1-beta.13`

**Acceptance / gates:**
- [ ] gate: each cell's declared L/P/U/saga manifest is asserted by an executed conformance case.
- [ ] gate: an exact Nitro v3 version + compatibility-date is pinned and an upgrade drift check runs.
- [ ] gate: `deno_server` and `deno_deploy` are exercised as distinct cells (no shared-behavior
      assumption).

---

## D2-S7 (defer) — Offline-sync database-target capability profile (D-09)

**Title:** `[unified-runtime S?] Offline-sync database-target capability profile`

**Body:**

Part of #823. Model offline sync (e.g. Turso Sync, #455) as a **database-target capability/profile**,
not a unified-runtime invariant and not an assumption on every Nitro preset. Consumed by the D-04
desktop target adapter; server/edge cells expose it as `profile` / `n/a` only. Track-only in v1
unless the desktop wave pulls it forward.

Evidence: `drift-ledger.md` D-09; `nitro-v3.md` SQL-database maturity; `proposal.md` §2.6.

**Labels:** `type:feat` · `area:database` · `epic:unified-runtime` · `priority:p3` · `wave:defer` ·
`status:triage`

**Milestone (suggested):** `0.0.1-stable` (or `Backlog / Triage` if track-only)

**Acceptance / gates:**
- [ ] gate: offline sync is declared on the database target, not inherited by every preset.
- [ ] gate: cross-reference to the D-04 desktop adapter recorded (no D2 ownership of desktop
      distribution).
