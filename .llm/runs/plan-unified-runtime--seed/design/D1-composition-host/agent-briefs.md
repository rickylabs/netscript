# D1 — Implementation-lane brief skeletons

One brief per D1 sub-issue draft. These are **skeletons** for the Stage-I handoff — they are filled
with the live issue number once D3's manifest is filed at Stage H. Each brief carries `use harness`
+ a `## SKILL` chapter and the verbatim stop-lines block (an omitted stop-lines section makes a brief
invalid — seed brief rule).

Routing note: select provider/model/effort per `.llm/harness/workflow/lane-policy.md`; do not hardcode
a model here. Framework source under `packages/` is a WSL Codex daemon-attached slice (CLAUDE.md).

---

## Verbatim stop-lines (paste into EVERY brief below)

> ### Stop-lines (HARD)
> 1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
>    merge authorization once that bar is met.
> 2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
>    owner sign-off in-turn only; a stale or relayed approval does not count.
> 3. HARD STOP before closing milestone 13 — owner sign-off only.
> 4. These stop-lines are repeated verbatim in every sub-agent brief.
> 5. The #824 seed run is drafts-only until owner ratification; board filing needs the owner in-turn.

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

[paste stop-lines]

## Brief D1-2 — Nitro host bridge (listener/lifecycle/close)

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-doctrine`, `aspire`/`deno-fresh` as applicable, and
`research/nitro-v3.md` Lifecycle row. Frame: proposal.md §2.

- **Goal:** bind the graph into Nitro as a synchronous plugin; Nitro owns the sole listener + `error`
  observation; `close` hook drains a disposal registry exactly once (idempotent).
- **Contract first:** the disposer-registry interface + registration order; async construction resolved
  before synchronous plugin registration.
- **Gates:** G-LISTEN, G-CLOSE (proposal.md §6) — include an idempotent double-close test.

[paste stop-lines]

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

[paste stop-lines]

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
- **Folds in:** #451 (in-process oRPC over `ServiceApp.fetch`).
- **Gates:** G-RPC, G-ERR, G-STREAM.

[paste stop-lines]

## Brief D1-5 — Version pins + H3-bridge conformance gate

**use harness**

### SKILL
Read: `netscript-harness`, `netscript-deno-toolchain` (pins, `deno doc`, catalogs), `.llm/tools/deps`
wrappers, `research/drift-ledger.md` D-11 + `research/nitro-v3.md` board input 1. Frame: proposal.md §5.

- **Goal:** pin exact Nitro v3 version + compatibility date and oRPC generation; write the H3-bridge
  conformance test against the pinned generation; document Nitro upgrade compatibility as a gate.
- **Toolbelt:** decide "latest" via `deno task deps:latest`, never `deno outdated --latest`.
- **Gates:** G-PIN, `gate:e2e` composed build on pinned versions.

[paste stop-lines]
