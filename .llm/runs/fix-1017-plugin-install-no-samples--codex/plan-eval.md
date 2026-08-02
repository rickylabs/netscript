# PLAN-EVAL — fix-1017-plugin-install-no-samples--codex

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- Run: `fix-1017-plugin-install-no-samples--codex`
- Issue: rickylabs/netscript#1017 — `plugin install` ignores `--no-samples`
- Surface / archetype: Archetype 6 (CLI/Tooling) primary, Archetype 5 (plugin connectors) affected
- Scope overlays: none
- Waiver basis: implementation is delegated to Codex (GPT-5.6 Sol); generator and evaluator are
  different sessions and different model families, satisfying the harness independence invariant.
  The open-model `formal_evaluation` route is not used, per the owner instruction of 2026-08-01.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` findings 1–7 spot-checked live against worktree HEAD `5eb82a5d9` (base `origin/main`). Verified independently: `collectInstallArtifacts(plugin)` at `packages/plugin/src/adapter/commands/install.ts:81` takes **no options** and flat-maps every `starterResources` entry — the flag is inert at the adapter, exactly as claimed. `packages/cli/src/kernel/adapters/plugin/scaffolder.ts:77,175` does honour `includeSamples`, confirming official installs bypass it. Sibling callers confirmed: `release-eject.ts:242` and `install-local-plugin.ts:242`. |
| Decisions locked | **FAIL** | D1, D3, D4, D5 are locked with rationale. **D2 is not implementable as written** — see Finding 1. |
| Open-decision sweep | **FAIL** | The sweep marks "exact optional policy name" as "resolved as part of D2 before code". The unresolved item is not the *name* but the *mechanism*, and deferring it to the contract-first edit forces rework of the published `@netscript/plugin/adapter` type — the one surface the plan itself flags as hardest to change. Per the Plan-Gate rule, an open decision that forces rework when deferred is `FAIL_PLAN`. |
| Commit slices | PASS | `worklog.md` §Commit Slices: 1 ordered slice, names what it proves (no-samples crosses the official-plugin boundary, valid sample-free workspaces for all four plugins), its gates, and its files. 1 < 30. |
| Risk register | PASS | `plan.md` §Risk Register: 5 risks (behaviour regression, dangling barrels, sibling dispatch flows, E2E runtime sample dependence, public slow-type/doc), each with a mitigation. |
| Gate set selected | PASS | §Fitness Gates selects F-1/F-3/F-5/F-10–F-19 plus F-6/F-7 for the exported adapter type, F-CLI-* reviewed. Release-gate class correctly engaged: the change alters plugin scaffold output, so `e2e:cli run scaffold.runtime` is scheduled once (validation step 8). |
| Deferred scope explicit | PASS | `plan.md` §Non-Scope and `worklog.md` §Deferred Scope: parser/kernel scaffolder, resource lifecycle redesign, existing doctrine debt. |
| jsr-audit surface scan | PASS | `research.md` §jsr-audit covers the `@netscript/plugin/adapter` export map and `InstallStarterResource`, names slow-type risk, requires an explicit named type and explicit return types, and confirms no export-map or dependency change. Undefined-policy-preserves-behaviour is the correct additive posture. |

## Findings

### Finding 1 (blocking) — D2's "fallback input" mechanism cannot produce an empty barrel

D2 offers two policy branches: **omit** the resource, or supply a **no-samples fallback input** for a
sample-dependent structural resource. D3 then relies on the second branch to emit empty barrels.

That branch does not work against the tree as it stands. The barrel artifact is produced by
substituting tokens into a **fixed stub source**, not by anything the input controls
(`plugins/workers/src/adapter/resources/barrel/barrel.stub.ts`):

```
source: `export { %%JOB_EXPORT%% } from './jobs/%%JOB_FILE%%.ts';
export { %%TASK_EXPORT%% } from './tasks/%%TASK_FILE%%.ts';
`
```

`barrelScaffolder.emit` (`barrel.ts`) always emits both export lines for any `BarrelInput`, whose
fields are only `jobId` and `taskId`. **No value of the input yields a barrel without the two sample
re-exports.** Any fallback input still produces a `workers/mod.ts` that re-exports files
`--no-samples` did not write — precisely the dangling-barrel failure D3 exists to prevent, and the
hazard the brief asked to be answered rather than shipped.

Confirmed as a class, not a one-off: all four official plugins carry a `barrel/barrel.stub.ts` +
`barrel/barrel.ts` pair of the same shape, and the barrel is a member of `starterResources` in each
(`plugins/workers/src/adapter/plugin.ts:21-26`, `plugins/streams/src/adapter/plugin.ts:19-22`).

**Required amendment.** D2 must let a starter resource declare a no-samples **alternative artifact
source** — an alternate `ItemScaffolder` (with its own input), not merely an alternate input to the
same scaffolder. Each of the four plugins then supplies an empty/structural barrel stub. Re-state D2
with the concrete policy shape and the exported type's name before the contract edit, since it is
published surface.

### Finding 2 (non-blocking, for IMPL-EVAL)

`streams` has no runtime-glue resource (`streamsStarterResources` is stream + barrel only), so D3's
"keep barrel and runtime glue" phrasing over-generalises. Harmless, but the implementation must not
invent a glue resource for streams to satisfy a symmetry the plan implies.

### Finding 3 (non-blocking) — evidence bar for acceptance box 2

Issue box 2 requires black-box assertion of **six exact paths**. D5 is correct to make the path list
a single constant, but the four installs in the reproduction must each be exercised — a suite that
installs only `workers` cannot evidence the sagas/triggers/streams paths. IMPL-EVAL will check that
all four kinds are installed in the no-samples project.

## Self-review of the supervisor's own framing

The brief specified the adapter marker as `readonly sample?: boolean` — "skip marked entries". That
framing is **wrong**, and the plan was right to move past it: a pure skip leaves four dangling
barrels. The brief also under-scoped the hazard to workers ("For workers, only the job and task
starters are samples"); the plan's drift entry correctly generalises it to all four. Finding 1 is the
residue of my own framing not being carried far enough — the plan replaced "skip" with a two-branch
policy but did not check that the second branch is expressible against the existing stub mechanism.
It is being failed here rather than discovered during implementation because the affected type is
published surface and would be the expensive thing to rewrite.

## Verdict

`FAIL` (`FAIL_PLAN`)

One narrow, fully-specified amendment: re-state **D2** so the no-samples policy can name an
alternate `ItemScaffolder` for a sample-dependent structural resource, name the exported policy type,
and confirm D3's empty-barrel outcome is reachable through it for all four plugins. All other boxes
pass. On amendment, implementation may begin without a further plan cycle; the evaluator accepts the
amendment inline and records the result below.

## Amendment result

`ACCEPTED` — D2 now names the published `InstallStarterSamplesPolicy<TAlternateInput>` type and
requires its `alternate` branch to carry a distinct `ItemScaffolder` plus that scaffolder's own
input. D3 is reachable: workers, sagas, triggers, and streams each select an empty-barrel alternate
scaffolder that emits a valid `export {};` module instead of invoking the fixed sample-export stub.
Undefined policy still emits the original starter unchanged. Streams remains barrel-only and gains
no runtime-glue resource. Per the evaluator instruction, implementation may proceed without another
plan cycle.
