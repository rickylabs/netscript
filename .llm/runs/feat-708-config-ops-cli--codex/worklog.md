# #708 config operations CLI — implementation worklog

## Identity

- Branch: `feat/708-config-ops-cli`
- Worktree: `/home/codex/repos/ns-b9-708`
- Baseline: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d`
- Lane: WSL Codex implementation under beta-9 orchestrator `09e5ae68`
- Archetype: 6 — CLI / Tooling; docs overlay applies to the two required how-to updates.

## Plan

1. **Config operations.** Add the `config` command tree, project `inspect|get|set`, runtime override
   `get|set|clear|list|enable|disable|publish|rollback`, and an atomic Deno-backed runtime snapshot
   store. Prove with focused command/use-case tests plus scoped CLI check/lint/fmt.
2. **Aspire graph operations.** Wire `generate aspire`; add `service ref add|remove` and `service set`
   mutations that update `appsettings.json` and regenerate helpers in the same operation. Prove with
   semantic mutation tests and command-tree coverage.
3. **Deploy discovery and secrets.** Add `deploy list` from `DeployTargetRegistry.entries()` and
   `deploy <target> secrets set|get|list` without moving target-specific policy into presentation.
   Update both acceptance docs and add focused parser/use-case tests.

Locked decisions: dashboard-facing runtime writes use `config override set|clear`; lifecycle verbs
also live under `config override`, while compatibility aliases preserve the issue's accepted
`config runtime publish|rollback` spelling. JSON project mutation targets generated
`appsettings.json`; typed reads use the existing project config loader. Runtime pointer replacement
uses a temp file plus same-directory rename. Deploy discovery derives only from the registry.

Deferred: dashboard audit confirmation metadata and backend control-plane APIs are co-requisite #556,
not invented in this CLI slice. The orchestrator owns `scaffold.runtime` / full CLI E2E execution.

## Design

- Public commands: `config inspect|get|set`; `config override get|set|clear|list|enable|disable|publish|rollback`;
  compatibility `config runtime publish|rollback`; `generate aspire`; `service ref add|remove`;
  `service set`; `deploy list`; target `secrets set|get|list` where supported.
- Domain vocabulary: runtime topics/versions, dotted config paths, service references, deploy target
  descriptors. Existing `DeployOperation`, `DeployTargetPort`, and service shapes remain authoritative.
- Ports/adapters: existing `FileSystemPort`, project config loader, helper regeneration seam, and
  deploy registry; one runtime snapshot store port with a Deno adapter owns atomic rename.
- Spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`. No new layer-2 abstract is introduced.
- Extension axes: existing deploy target registry (`string` → `DeployTargetPort`) is populated in
  public composition and consumed by deploy list/router. No new registry is needed.
- Effects remain in adapters; command files parse, call use cases, and render output.
- Tests assert parsed JSON/files/registry rows and calls, not giant string snapshots.
- Contributor path: add config/service verbs within their vertical feature folder; add deploy targets
  through `DeployTargetRegistry`; extend runtime topics only at the runtime-config topic contract.

## Evidence

### Slice 1 — config operations

- `deno check --unstable-kv packages/cli/bin/netscript.ts`: exit 0.
- Focused config tests: 5 passed, 0 failed (`manage-runtime-overrides_test.ts`,
  `project-config-ops_test.ts`).
- Scoped CLI lint wrapper: exit 0, 610 files selected, zero findings.
- Scoped CLI format wrapper initially found one unrelated pre-existing E2E formatting finding in
  `e2e/src/application/gates/scaffold/runtime-gates.ts`; the owned 13-file include was formatted by
  the wrapper and will receive a clean check before handoff.
- Pointer atomicity is implemented by writing a same-directory UUID temp file and `Deno.rename`;
  rollback first proves the requested topic version exists, preserves other topic pointers, then
  replaces `current`.
- Reconcile: no PR was opened per the slice brief; issue/label reconciliation stays with orchestrator
  `09e5ae68`.

### Slice 2 — Aspire graph operations

- `deno check --unstable-kv packages/cli/bin/netscript.ts`: exit 0 after command wiring.
- `mutate-service-config_test.ts`: 2 passed, 0 failed. The tests prove add/remove references and
  port/enabled changes persist to `appsettings.json`, with helper regeneration invoked in the same
  awaited operation.
- Live local help shows `generate aspire`, `service ref`, and `service set` on the public command
  tree. `deploy-local-aspire.md` now documents regeneration and graph mutation without re-scaffold.
- Reconcile: no PR opened; no issue state changed by this implementation lane.

### Slice 3 — deploy discovery, target secrets routing, docs, final gates

- Focused config/service/deploy test selection: 15 passed, 0 failed.
- Scoped check wrapper: 69 files selected, 1 batch, 0 failed batches, 0 diagnostics; command includes
  `--unstable-kv`.
- Scoped lint wrapper: 67 files selected, 0 findings. Scoped format wrapper: 67 files selected,
  0 findings.
- Live `netscript-dev deploy list --json`: exit 0 and returned all 10 default registry targets with
  each adapter's advertised operation list.
- Target secrets parser test proves `secrets set|get|list` is exposed for a target that advertises
  the canonical `secrets` operation and forwards `{ operation, key, value }` without target-specific
  command logic. Default adapters currently advertise no `secrets` operation until their existing
  deploy-core store wiring is composed; no end-to-end secret backend claim is made here.
- `roll-out-runtime-overrides.md` replaces `cat`/`printf` pointer manipulation with
  `config override publish|rollback` and documents the dashboard-aligned set spelling.
- Full `deno task e2e:cli` / `scaffold.runtime`: **not run by instruction**; orchestrator-owned and
  therefore unproven in this worklog.
- `deno.lock`: unchanged.
- Reconcile: no PR opened; final issue taxonomy/milestone/acceptance reconciliation remains with the
  beta-9 orchestrator.

## Drift

- **D1 (carried, owner-authorized):** PLAN-EVAL is waived in the slice brief. This worklog records a
  short plan/design checkpoint before implementation; this implementation lane does not claim a
  PLAN-EVAL or IMPL-EVAL verdict.
