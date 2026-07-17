# D1 — Implementation-lane brief skeletons

One brief per D1 sub-issue draft. These are **skeletons** for the Stage-I handoff — they are filled
with the live issue number once D3's manifest is filed at Stage H. Each brief carries `use harness`
+ a `## SKILL` chapter and the verbatim stop-lines block (an omitted stop-lines section makes a brief
invalid — seed brief rule).

Routing note: select provider/model/effort per `.llm/harness/workflow/lane-policy.md`; do not hardcode
a model here. Framework source under `packages/` is a WSL Codex daemon-attached slice (CLAUDE.md).

---

## Verbatim stop-lines (the exact block materialized in EVERY brief below)

```
## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.
```

---

## Brief D1-1 — Composition root

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine` (composition-root archetype, layering), `netscript-service`
surface via `deno doc @netscript/service`. Frame: design pack `design/D1-composition-host/proposal.md`
§1 and epic #823.

- **Goal:** single composition-root module wiring service + oRPC + Fresh into one logical graph; the
  no-application-loopback invariant holds on every preset.
- **Contract first:** define the mount/prefix/lifecycle registry type before implementation.
- **Files (expected):** new composition-root module in the unified-runtime host package; consumes
  `ServiceApp` (`packages/service/src/types.ts:13-20`) and `defineFreshApp()` results.
- **Gates:** G-ROOT (proposal.md §6); `deno task check`, targeted unit test, `gate:e2e` boot.
- **Defers to D2:** the per-preset `process` capability column — do not decide it here.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief D1-2 — Nitro host bridge (listener/lifecycle/close)

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine`, `aspire`/`deno-fresh` as applicable, and
`research/nitro-v3.md` Lifecycle row. Frame: proposal.md §2.

- **Goal:** bind the graph into Nitro as a synchronous plugin; Nitro owns the sole listener + `error`
  observation; the `close` hook invokes the **UR-0 hostable-service lifecycle contract** (which
  reuses the shipped `ServiceShutdownCoordinator` policy — idempotency, bounded drain, LIFO,
  structured report). Do NOT invent a bespoke disposer registry (Stage-F finding 5).
- **Contract first:** consume UR-0's exported build/start/stop surface; async construction resolved
  before synchronous plugin registration.
- **Gates:** G-LISTEN, G-CLOSE (proposal.md §6) — include an idempotent double-close test.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief D1-3 — Fresh mount + route/static ownership

**use harness**

### SKILL
Read: `netscript-harness`, `deno-fresh` (App/handler/islands), `research/orpc-fresh.md` Route/Static
rows. Frame: proposal.md §3.

- **Goal:** mount Fresh via `app.handler()` (never `listen()`); declare disjoint route spaces and
  static-asset ownership; preserve the shipped wrapper middleware/routes intact.
- **Files:** consumes `packages/fresh/src/runtime/server/define-fresh-app.ts` unchanged (no framework
  edit unless a `*Namespace` export gap forces a WSL Codex slice).
- **Gates:** G-ROUTE, G-STATIC, no-nested-listen assertion.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief D1-4 — In-process oRPC bridge

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine`, service surface via `deno doc`, and
`research/orpc-fresh.md` (composition boundary + bridges) + `research/drift-ledger.md` D-07. Frame:
proposal.md §4.

- **Goal:** in-process delegation over `ServiceApp.fetch`/oRPC `RPCHandler` — no socket loopback, no
  second codec; single canonical prefix into H3 match + `handler.handle`; `toServiceContext` seam +
  abort signal; RPC-domain errors as typed responses; streamed + WS-upgrade conformance cases.
- **Reuse, do not reinvent:** `packages/service/src/primitives/handlers.ts:115-143`.
- **Scope boundary:** host-side bridge ONLY — this is a **subset** of #451's public SDK transport
  surface. #451 stays **OPEN and KEEP**; this PR carries **NO `Closes #451`**. The SDK↔service
  dependency direction (#451 O-1) is decided by fork **F-7** before the separate #451 SDK slice starts.
- **Gates:** G-RPC, G-ERR, G-STREAM (WebSocket-upgrade case per fork F-4).

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief D1-5 — Version pins + H3-bridge conformance gate

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-deno-toolchain` (pins, `deno doc`, catalogs), `.llm/tools/deps`
wrappers, `research/drift-ledger.md` D-11 + `research/nitro-v3.md` board input 1. Frame: proposal.md §5.

- **Goal:** pin exact Nitro v3 version + compatibility date and oRPC generation; write the H3-bridge
  conformance test against the pinned generation; document Nitro upgrade compatibility as a gate.
- **Toolbelt:** decide "latest" via `deno task deps:latest`, never `deno outdated --latest`.
- **Gates:** G-PIN, `gate:e2e` composed build on pinned versions.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief UR-0 — Hostable-service lifecycle contract (NEW prerequisite, precedes UR-2)

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine` (service archetype, ports/adapters),
`netscript-deno-toolchain` (`deno doc @netscript/service`). Frame: `design/canonical/UR-0.md` +
proposal.md §2.3–§2.4.

- **Goal:** export a build/start/stop (or `[Symbol.asyncDispose]`) surface that preserves
  `onStartup`/`onShutdown` behavior when a host (Nitro/desktop/tests) drives the service **without**
  owning a listener; startup-failure rollback preserved.
- **Reuse, do not reinvent:** wrap the shipped `ServiceShutdownCoordinator` policy
  (`packages/service/src/builder/service-shutdown.ts:1-135` — idempotency, bounded drain budget, LIFO
  order, structured report). Do NOT invent a second "exactly once" lifecycle.
- **Contract first:** the exported lifecycle surface type; package/export ownership recorded against
  UR-11. Framework source under `packages/service` → WSL Codex daemon-attached slice (CLAUDE.md).
- **Gates:** per `design/canonical/UR-0.md` acceptance; scoped `deno check`, unit tests incl.
  double-stop idempotency + parity with `serve()` lifecycle.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Brief UR-11 — Architecture contracts (NEW prerequisite, precedes UR-1/UR-4/UR-5)

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine` (archetype selection, layering, public-surface rules
under `docs/architecture/doctrine/`), `netscript-deno-toolchain` (JSR export surface, `deno doc`),
`netscript-pr` (labels/milestones). Frame: `design/canonical/UR-11.md`.

- **Goal:** name the unified-runtime host package (path/`deno.json`/export map), select the doctrine
  archetype(s) + per-package fitness/JSR/E2E gate matrix, define the composition-compiler requirement
  schema + build/CLI seam (consumed by UR-5), reconcile the F-7 import direction, and normalize board
  + code language to `@netscript/database` (retire `@netscript/data`; facade only if F-8 selects it).
- **Contract first:** this is the architecture-decision card the other lanes consume — settle it
  before UR-1/UR-4/UR-5 start. Split any oversized contract into its own prerequisite card.
- **Gates:** per `design/canonical/UR-11.md` acceptance.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.
