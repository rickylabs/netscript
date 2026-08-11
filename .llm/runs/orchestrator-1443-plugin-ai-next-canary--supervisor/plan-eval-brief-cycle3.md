use harness

You are the **PLAN-EVAL evaluator, cycle 3**, for NetScript PR #1444 (closes #1443 and #1445).

**Provenance:** you are the same evaluator thread as cycles 1 and 2, resumed — the launcher's
one-sender-per-worktree guard blocks a second concurrent sender here. Generator ≠ evaluator still
holds: the plan's author is a native Claude Opus 5 session, not you.

**The two-cycle loop reset.** Cycles 1 and 2 both returned `FAIL_PLAN`. Cycle 2's central finding —
that `loadRegisteredPlugins` imports the configured module and requires a `PluginManifest` export —
was **verified empirically by the supervisor and accepted**; a probe module with a sibling
`scaffold.plugin.json` was rejected with `Error: Plugin spec "./probe/mod.ts" does not export a
plugin manifest.` You were right and the plan was wrong.

That proof generalized: `workers/mod.ts` exports no manifest either, so the defect covers every
first-party plugin. The supervisor escalated; **the owner authorized a rescope** to fix the shared
contract in this PR, and issue **#1445** was filed to track it. Per `run-loop.md` §"Rescoping" an
owner-authorized rescope resets the eval loop. Plan **v4** is what you now evaluate.

## SKILL

- `netscript-harness` — run-loop, plan-gate, evaluator separation, rescope handling.
- `netscript-doctrine` — archetypes 4/5/6 and their fitness gates.
- `jsr-audit` — publishability across `packages/plugin`, `packages/cli`, `plugins/ai`.
- `netscript-cli`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, `rtk`,
  `codex-wsl-remote`.

## Pre-flight

```bash
cd /home/codex/repos/ns-1443-plugin-ai-orchestrator
rtk git status --short --branch
rtk git log --oneline -4
```

Expect head `a6febcdc6`. Do not fetch, reset, rebase, or modify the working tree.

## What to read

`plan.md` (**v4**), `plan-eval.md` (cycle 1), `plan-eval-cycle2.md` (cycle 2), `research.md`,
`drift.md` (note **D-6**, the owner rescope), `escalations/E-1-configured-module-contract.md`,
`worklog.md` `## Design`, `phase-registry.md`. Live: issues #1443 and #1445, and PR #1444's body and
comments.

## Your job

**A. Are cycle-2's findings now answered?** Walk your own seven cycle-2 findings and its failed
plan-gate boxes. For each: `ANSWERED` / `PARTIALLY ANSWERED` / `NOT ANSWERED`, with the v4 location
and your own source verification. Specifically confirm or refute that v4 correctly states:

- D4a — `ai/mod.ts` exports a real `PluginManifest` re-exported from `@netscript/plugin-ai`.
- D1 — the maintainer consumer `official-plugin-source.ts:87-107,212-251` is in the inventory.
- D6 — closure of **5 items** (`markdown`, `citation-chip`, `theme-seed`, `cn`, `public-types`),
  **11 files**, **13 npm deps** including `clsx` and `tailwind-merge`. Verify this against
  `registry.manifest.ts` and `registry.ts:216-258` / `registry-deno-json.ts:17-44`.
- S2 — `workspace-mutator.ts:319-326` is in the file list.
- The service-less `plugin list` value is locked to `-`.
- The consumer gate is a new assertive `consumer-verify.sh`, not the always-exits-zero
  `published-0.0.5-repro.sh`.

**B. Does v4 pass the plan-gate for its NEW, wider scope?** All eight boxes with concrete evidence.
Then stress the rescope specifically:

1. **D9 blast radius.** v4 says every first-party plugin emits a manifest-exporting `<name>/mod.ts`
   *additively*. Check each of `plugins/{workers,sagas,triggers,streams,auth}`: does each package
   actually export a `PluginManifest`-shaped value it can re-export? Name any plugin where it does
   not exist and would have to be authored.
2. **Additivity.** Does adding a manifest export to an existing barrel break any current consumer of
   those barrels (generated registries, `generate plugins`, app imports)? Note that
   `resolveExportedPluginManifest` accepts a default export *or* a **sole** named manifest — if a
   barrel already exported something manifest-shaped, adding a second would make it ambiguous.
   Check.
3. **Import-surface generalization.** v4 points at `PLUGIN_KIND_SOURCE_IMPORTS` /
   `PLUGIN_KIND_ROOT_IMPORTS` (`workspace-mutator.ts:64-140`) as the seam for the `workers`→`zod`
   gap. Is that the right seam for all plugins, and does the local-source vs JSR branch at `:377-428`
   change the answer?
4. **Slice coverage.** Twelve slices — does each still name a gate that passes when it lands, and do
   S10/S11 cover #1445's six acceptance boxes?
5. **Paper-over sweep.** No hardcoded plugin names host-side, no `any`, no casts, no lint
   suppressions, no deleted/skipped tests, no fixture-only special cases. v4 claims the contract is
   proven by one table-driven test rather than six fixtures — verify that is actually achievable.
6. **Is the rescope now too large to land as one PR?** If you believe it should split, say so
   explicitly with a proposed boundary — that is a `FAIL_RESCOPE`-shaped finding and the supervisor
   will take it to the owner.

## Output

Write `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan-eval-cycle3.md` from
`.llm/harness/templates/plan-eval.md`: part A disposition, the eight plan-gate boxes with evidence,
per-acceptance-box coverage tables for **both** #1443 and #1445, numbered findings, and a final
`VERDICT: PASS` or `VERDICT: FAIL_PLAN`.

Post it as a PR comment on #1444 leading with `**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` or
`**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**`.

Do not commit. Report your thread id and verdict in your final message.

Calibration: `FAIL_PLAN` is for defects that would cause rework if implementation proceeded — not
stylistic preference, not correctly-deferred scope, not detail a slice is explicitly scoped to
determine. This is a P0 blocking a consumer; if v4 is implementable as written, return `PASS`.
Findings and evidence only.
