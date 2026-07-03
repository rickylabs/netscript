**[PHASE: PLAN-EVAL] [VERDICT: FAIL_PLAN]**

# PLAN-EVAL — deploy-s1-targets-config

- Plan evaluator session: separate Opus 4.8 session (per worklog authorization 2026-07-03), 2026-07-03
- Run: `deploy-s1-targets-config`
- Surface / archetype: `packages/config` deploy schema (+ CLI deploy consumers) — ARCHETYPE-1 (small-contract)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result     | Evidence / location |
| --------------------------------------- | ---------- | ------------------- |
| Research present and current            | PASS       | `research.md` off origin/main `56ea68b2`; recon spot-checked against tree — `deploy-schema.ts` anchors (WindowsDeployConfigSchema L8–106, DeployConfigSchema L112–117, docker L99–104), `config-section-types.ts` (WindowsDeployConfig L357–420, DeployConfig L423–426), `resolved-config.ts` (L180, deploy L267) all confirmed accurate. |
| Decisions locked                        | PASS       | L-1…L-5 with rationale. |
| Open-decision sweep                     | **FAIL**   | The F-5 public-export **keep-vs-rename** decision is raised in the Change Map ("decide whether to keep/rename the Windows export names") but is NOT in the sweep table and is left unresolved. It forces rework if deferred (ripples to every re-export barrel). See Finding 2. |
| Commit slices (< 30, gate + files each) | **FAIL**   | No commit-slice section exists in `plan.md` or in a `## Design` section of `worklog.md`. The Change Map (A–D) is a by-area change list, not an ordered slice list naming what each slice proves + its gate. See Finding 1. |
| Risk register                           | PASS       | Risk Register + Risks present with mitigations. |
| Gate set selected                       | PASS       | ARCHETYPE-1 required fitness set (F-1,5,6,7,8,10,11,12,14,15,16,17,18) matches `archetype-gate-matrix.md` exactly; F-2/3/4/9/13 correctly omitted; Static required + Consumer-import (touched→required) included. |
| Deferred scope explicit                 | PASS       | Non-Scope defers adapters/verbs to #339–#343; Dependencies section names unblocked slices. |
| jsr-audit surface scan (pkg/plugin)     | **FAIL**   | `packages/config` is a published package, so this box APPLIES (not N/A). The plan lists F-6 as a gate but never applies the publishability rubric to the *planned* new exports nor names the slow-type risk. See Finding 3. |

## Open-decision sweep (evaluator-run)

Decisions that force rework if deferred and are not resolved in the plan:

1. **Keep vs rename the Windows public export names** (`WindowsDeployConfigSchema`, `WindowsDeployConfig`). This is a public-surface decision that changes which symbols four barrels re-export. Must be resolved *before* slicing, not during. (Finding 2)
2. **Whether non-windows target member schemas ship in this slice at all.** The plan is internally contradictory here (Scope says "provide member-schema stubs for linux/deno-deploy/docker/compose"; Non-Scope + L-4 say "only schema + consumer re-key, adapters are #339–#343"). Shipping unused member schemas is speculative public surface and collides with F-5/F-7. Must be resolved now. (Finding 4)

The keyed-object-vs-discriminated-union decision IS correctly resolved (keyed object) and is sound — see "What's good."

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Add an enumerated commit-slice list (Plan-Gate "Commit slices" box).** Even for a small contract, list ordered slices (< 30), each naming *what it proves*, *the gate that proves it*, and *the files it touches*. The A–D Change Map is a good input but is not a slice list. Suggested shape: (S1) schema + types + base/windows-target in `packages/config` — proved by scoped `run-deno-check.ts --root packages/config` + F-5/F-6/F-7; (S2) CLI resolver/resolved-config re-key — proved by `run-deno-check.ts --root packages/cli/...deploy` (consumer-import gate); (S3) tests + migration note — proved by config test task. Order and files per slice must be explicit.

2. **Resolve the public-export rename decision AND complete the Change Map's re-export surface.** Where: Change Map §A + Open-Decision Sweep. The plan names only `src/public/mod.ts` and `src/domain/mod.ts`, but `WindowsDeployConfig` is ALSO re-exported from **`packages/config/mod.ts:117`** (package-root public barrel) and **`packages/config/src/merge/mod.ts:46`** (the `@netscript/config/merge` entrypoint) — neither is in the Change Map. Decide keep-vs-rename explicitly; if any new/renamed type or schema is public, enumerate its addition to ALL FOUR barrels (root `mod.ts`, `src/public/mod.ts`, `src/domain/mod.ts`, `src/merge/mod.ts`) so F-5 stays consistent. The "grep keys" safety net lists `WindowsDeployConfig` but the Change Map must not delegate surface completeness to a post-hoc grep.

3. **Apply the jsr-audit publishability rubric to the PLANNED new exports and name the slow-type risk.** Where: F-6 / a jsr-audit line in the plan. The existing schemas dodge JSR slow-types via explicit annotation (`z.ZodType<WindowsDeployConfig | undefined>`). Any new exported Zod schema (`DeployTargetBaseSchema`, `WindowsDeployTargetSchema`, and any member stub) MUST carry the same explicit `z.ZodType<…>` annotation or it becomes an inferred slow type and fails `deno publish`/F-6. State this requirement in the plan before slicing — it is the single highest-probability defect for a Zod-schema-export change.

4. **Resolve the stub-scope contradiction (L-4 vs Scope).** Decide and state whether this slice ships ONLY `DeployTargetBaseSchema` + the `windows` target + the docker-image migration (recommended — keeps F-5 "exports are intentional" and F-7 doc-score clean, lets #339+ add their own members by extending the exported base), OR ships minimal linux/deno-deploy/docker member schemas now (then each must be JSDoc'd and justified against F-5 as intentional surface despite having no consumer). The current plan asserts both.

## Notes (non-blocking observations for the implementer)

- **Merge granularity shift (hidden scope, worth a test).** `packages/config/src/merge/mod.ts:184` deep-spreads deploy one level: `{ ...base.deploy, ...contribution.deploy }`. Under the old `{ windows }` shape a plugin fragment replaced at the `windows` key; under `{ targets: { … } }` a fragment now replaces the entire `targets` map wholesale (coarser). If any plugin contributes a `deploy` fragment this is a behavior change. Add a merge test or explicitly note it as accepted.
- **Comment-only references** at `deploy-config-background.ts:156` and `constants/windows.ts:5,176` mention `deploy.windows` in prose; update for accuracy but they are not type-load-bearing.

## What's good

- Recon is accurate: every cited line anchor verified against the tree.
- The keyed-object decision (L-5 / Change Map) is correct and sound: the root schema composes members via plain `z.object`, and `deploy` is already `z.object({ windows })`, so `z.object({ targets: z.object({ windows, … }) })` is the consistent shape. A `z.discriminatedUnion` would be wrong — `targets` is a name-keyed map, not a tagged array. Good call, and it correctly preserves `config.deploy.targets.windows.*` access.
- Clean break (D5) is faithfully reflected: no alias in Locked Decisions, Non-Scope, or Change Map.
- Archetype selection (ARCHETYPE-1) and the required-gate set are correct and complete per the matrix.
- Keeping the resolved layer windows-shaped this slice (deferring multi-target resolution to #339+) is the right under-reach — avoids building adapter surface prematurely.
