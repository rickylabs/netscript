# PLAN-EVAL — fix-scaffold-generated-output-correctness--0.0.7-wave0

Formal PLAN-EVAL **cycle 2**, the final permitted plan cycle. Separate session from the generator
(generator lane was OpenAI Codex `gpt-5.6-sol` high, thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`,
which also authored the cycle-1 repair); this evaluator is native Claude. The cycle-1 verdict is
preserved verbatim as `plan-eval-cycle-1.md`.

## Evaluator identity

| Field                 | Value                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Requested route       | native Claude Opus 5, effort **medium**                                                                                        |
| Observed route        | `claude-opus-5`, effort `medium` — **matched**, no silent substitute                                                           |
| Fable 5               | unassigned; not used; no coordinator amendment sought                                                                          |
| Session ID            | `06451c1e-a9b8-47d2-8934-be2247ef5347`                                                                                         |
| Remote-control bridge | `cse_01AFoKjRXMVCaXUzJ9HqDvGt` (enabled at launch, inbound+outbound)                                                           |
| Bridge label          | `NetScript 0.0.7 #1654 PLAN-EVAL cycle 2`                                                                                      |
| PID                   | `2546956`                                                                                                                      |
| cwd                   | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness`                                                   |
| CLI version           | `2.1.233`                                                                                                                      |
| Route evidence        | `/home/codex/.claude/jobs/06451c1e/state.json` → `respawnFlags` = `--effort medium … --remote-control … --model claude-opus-5` |

The session is spare-claimed, so its `argv` carries no `--model`/`--effort`; `state.json`
`respawnFlags` is the authoritative route record.

## Head reconciliation (independently resolved; no mismatch)

| Ref                                                      | SHA                                        |
| -------------------------------------------------------- | ------------------------------------------ |
| `git fetch origin fix/scaffold-generated-output-correctness` → `FETCH_HEAD` | `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` |
| PR #1654 `headRefOid`                                    | `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` |
| Local `HEAD`                                             | `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` |
| Task-specified source head                               | `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` |

`git merge-base --is-ancestor 01e0960494c95ce56eb35892c211a095eb13e6ed HEAD` exits 0 — the immutable
base is an ancestor. PR #1654 is draft, base `main`, milestone `0.0.7`, with exactly one phase label
`status:plan-eval`. Working tree was clean at session start.

**Repair diff is artifact-only.** `git diff --stat 14d8b38b4…5b3c6fcf2` touches exactly five files,
all inside the run dir: `context-pack.md`, `plan-eval.md`, `plan.md`, `supervisor.md`, `worklog.md`.
`git diff --name-only 01e096049…HEAD` confirms the whole branch touches only
`.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/**`. **No product file, and no
unstated boundary, was introduced by the repair.**

Run: `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/`. Surface: Archetype 6 —
CLI/tooling. Scope overlays: none.

## Re-test of the three cycle-1 findings (re-derived, not read from the repair summary)

### Cycle-1 finding 1 — open-decision sweep, memory-router scope, empty-schema contract

**Resolved.** `plan.md` §"Open decisions" now exists with three rows, each dispositioned, and states
"No unresolved **must resolve now** decision remains."

- **OD-1 → option (b), out of scope — factually re-verified.**
  `grep -c errors packages/cli/src/kernel/assets/service/contract.memory.ts.template` = **0**: the
  memory contract composes no error map and never calls `.errors(...)`, so `notFound()` there would
  dereference an undefined `NOT_FOUND` constructor — the exact undefined-500 class #1263 removes.
  `assets/service/routers/v1.memory.ts.template` exposes only `list` (:35) and `updateStatus` (:52),
  whose missing-row branch is a plain `throw new Error` (:56) over an in-memory array — no by-id
  GET/PATCH/DELETE and no Prisma, so `P2025` translation has no referent. The plan's locked design §2
  now reads "into the generated persistent router **only**", slice 4 names no memory file, and
  §"Deferred scope" records the exclusion with that reason. The plan no longer prescribes `P2025`
  translation for a router that has no Prisma.
- **OD-2 → resolved, and the reachability claim holds.**
  `adapters/database/scaffolder.ts:130` is `modelName: options.modelName ?? 'ExampleRecord'`, so no
  `DatabaseScaffolder` path yields a model-less schema. The plan now states the empty-schema branch
  is a **generator-level direct-call contract** (omitted optional `modelName` on a direct
  `generateDatabaseSeed` call) and explicitly disclaims it as scaffold-level behavior — a reviewer
  can now distinguish a tested contract from a dead branch.
- **OD-3 → correctly marked safe to defer.** Split provider assets and generator-selected fragments
  both land inside `packages/cli/src/kernel/assets` / `…/templates/database`, both are judged by the
  same four-engine required/forbidden-symbol matrix, and neither changes public behavior, slice
  order, or gates. Deferring it forces no rework.

### Cycle-1 finding 2 — `proves → gate → files` per slice, including `generate-engine-mod.ts`

**Resolved.** Slices 2–6 each carry an explicit **Proves**, a single **Decisive gate** (a concrete
structured `run-deno-test.ts` invocation for slices 2–5; the leased one-pass `scaffold.runtime` for
slice 6), and an enumerated **Files** list. Slice 1 is the already-landed artifact-only bootstrap and
correctly carries no product gate.

`packages/cli/src/kernel/templates/database/generate-engine-mod.ts` is now named in slice 2's file
list (`plan.md:120`) and in §"Authorized boundary amendment" (`plan.md:84`). That is the right file:
`generate-engine-mod.ts:34` calls `buildConnectionHelpers()`, and `:140–141` returns
`readTemplateAssetSync(TEMPLATE_KEYS.databaseConnectionHelpers)` unconditionally — the exact seam
where selected-provider emission must be implemented for #1588.

### Cycle-1 finding 3 — #1262 acceptance item 3

**Resolved, and independently inspected.** Issue #1262 acceptance item 3 is "Tutorial/docs seed steps
verified against the new behavior". `plan.md` §"Locked design" 1 now marks it **verified-by-inspection
in scope**. I read the cited doc: `docs/site/data-persistence/database.md:179` reads
`"# Run the workspace seed scripts (database/postgres/scripts/seed.ts)\n# to populate baseline rows.\nnetscript db seed"`.
The claim "populate baseline rows" is present today and is made *true* by slice 3 rather than needing
a docs edit; the one shared runtime acceptance verifies the generated behavior. The disposition is
explicit and truthful, which is what the box requires.

### Worklog live-phase wording

**Corrected.** `worklog.md:46` now reads "PR #1654 remains draft at exactly one phase label,
`status:plan-eval`" (cycle 1 flagged the stale `status:plan` wording). The live PR carries exactly
one phase label, `status:plan-eval` — the record and reality agree.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                          |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Research present and current            | **PASS** | `research.md` re-baselined at `01e096049`; every load-bearing probe re-verified below                        |
| Decisions locked                        | **PASS** | `plan.md` §"Locked design" 1–4; the cycle-1 memory-router qualification is now removed at source             |
| Open-decision sweep                     | **PASS** | `plan.md` §"Open decisions" — OD-1/OD-2 resolved now, OD-3 safe to defer; evaluator sweep found nothing more |
| Commit slices (< 30, gate + files each) | **PASS** | `plan.md` §"Ordered reviewable slices" — 6 slices, ordered, each `proves → gate → files`                     |
| Risk register                           | **PASS** | `plan.md` §"Risk register" — 7 risks, each with a control traceable to the locked design                     |
| Gate set selected                       | **PASS** | `plan.md` §"Gate family and receipts"; superset of leaf `provingGates` + Archetype 6 universal family        |
| Deferred scope explicit                 | **PASS** | `plan.md` §"Deferred scope" — 6 entries incl. the memory router with its reason; #1262 item 3 now disposed   |
| jsr-audit surface scan (pkg/plugin)     | **PASS** | `research.md` §"Public/JSR surface inspection"; matches leaf `jsrAudit.risks`                                |

## Independent re-verification of load-bearing findings

Re-checked against the working tree at the evaluated head. All hold.

| Claim                                                | Verified                                                                                                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1262 placebo seed                                   | `assets/database/seed.ts.template:13–14` — `$queryRaw\`SELECT 1\`` then `console.log('✅ Database seed completed.')`; no row written                                        |
| #1262 scaffolder always resolves a model             | `adapters/database/scaffolder.ts:130` — `options.modelName ?? 'ExampleRecord'`                                                                                             |
| #1262 seed generator does not yet exist              | `templates/database/` contains no `generate-database-seed.ts`; the plan correctly marks it **new**                                                                          |
| #1263 get-by-id throws an undefined error            | `assets/service/routers/v1.ts.template:59` — `throw new Error(\`{{modelName}} ${input.id} not found\`)`                                                                     |
| #1263 OpenAPI 404 already projected (fallback)       | `packages/contracts/src/application/contract-primitives.ts:22` — `NOT_FOUND` in `commonErrorMap`; preserved as regression coverage only, per coordinator                    |
| #1588 SQLite emits every provider parser             | `templates/database/generate-engine-mod.ts:34,140–141` injects the whole `databaseConnectionHelpers` asset unconditionally for every engine                                 |
| `notFound` is reachable from the **generated** service | `deno doc --filter notFound packages/contracts/mod.ts` resolves to `src/domain/errors.ts:38`; `assets/service/contract.ts.template:8` already imports `@netscript/contracts` in the same generated workspace — no import-map or generated-dependency change is needed, so slice 4's file list is sufficient |
| Existing live verifier exists (no new gate sibling)  | `packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts` present; `e2e/tests/application/gates/` already holds `verify-live-db-endpoint_test.ts` and `generated-app-endpoint_test.ts`, so the planned `generated-router-template_test.ts` is a conventional sibling test, not a new gate directory |

### Boundary amendment — authorized, and the plan stays inside it

Coordinator comment `5286194892` was read verbatim: it authorizes `generate-prisma-config.ts`,
`database-generators.ts`, new `generate-database-seed.ts` plus its focused test, `generators_test.ts`,
`scaffolder.ts`, and `scaffolder_test.ts`; preserves the already-green #1263 OpenAPI projection as
regression coverage only; forbids contract-package work; and grants no expensive-gate lease. No later
comment widens that grant.

The declared boundary authority is milestone `leaf-contracts.json`, which I read directly at
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`.
Its `scaffold-generated-output-correctness` entry (issues `1262/1263/1588`, archetype
`6-cli-tooling`, `jsrAudit.applicable: true`) lists `generate-engine-mod.ts` in `fileSurfaces`, along
with the `packages/cli/e2e` and `packages/cli/src/kernel/assets` prefixes. **Each of the 16 product
files in `plan.md`'s amendment list is covered** — including `assets/embedded.generated.ts` and both
e2e files, via those prefixes. The plan is a strict subset of the authorized boundary: it declines
`v1.memory.ts.template` even though the central contract permits it, and records that exclusion. No
contract-package change is planned. **Amendment row: PASS.**

### Expensive-gate sequencing

`plan.md` §"Gate family and receipts" places every cheap gate strictly *before* the lease —
structured check/test/lint/source-only fmt, `check:assets-barrel`, `quality:gate`, `arch:check`, CLI
JSR audit, `deno doc --lint`, publish dry run — then, **after an explicit singleton lease only**,
exactly one `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, followed by the
scoped read-only `agentic:leak-check` with the correct `--slice-dir`/`--worktree`. Slice 6 is the
only slice that may consume it; slice 5 states the cheap gates are "prerequisites, not substitutes
for the runtime gate". All three issues share the one verdict and are never split.
**Serialized-lease row: PASS.** This evaluator ran no expensive gate.

### JSR / publish applicability

Leaf `jsrAudit.applicable` is `true` with two named risks. `research.md` §"Public/JSR surface
inspection" covers both (public exports plus exact `@netscript/*` pins; isolated-declaration publish
dry run rejecting runtime asset / `import.meta` reads) and adds stale embedded assets as a third,
each mapped to a planned gate in the pre-lease family. No public export change is planned — the
change is to *generated consumer output*, not to `packages/cli`'s own surface. **PASS.**

## Open-decision sweep (evaluator-run)

I ran the sweep independently rather than accepting the plan's three rows. Beyond OD-1/OD-2/OD-3,
I probed five further candidates and none forces rework:

1. **Typed delegate access in the seed.** `client.{{modelName | camelCase}}` is already the
   established idiom (`v1.ts.template:8,17`) and the template engine supports the `camelCase` pipe,
   so "typed delegate, no Prisma metadata reflection" is expressible as locked.
2. **Required fields for the representative row.** `schema.prisma.template` renders
   `id/name/createdAt/updatedAt`; the plan pins the `name` field explicitly. Resolved.
3. **`notFound` availability in the generated workspace.** Confirmed reachable (see the table
   above). Had it not been, slice 4 would have had to touch an unnamed generated asset — the same
   false-boundary stop that cost cycle 1. It does not.
4. **Static template assertions vs runtime proof for #1263.** Slice 4's decisive gate asserts on
   generated template source; actual missing-row runtime behavior is proved once, in slices 5–6, by
   the extended `verify-live-db-endpoint` inside the single leased `scaffold.runtime`. The plan
   states this layering explicitly, so it is a deliberate division, not a coverage gap.
5. **Embedded asset mirror.** Every slice touching an asset lists `assets/embedded.generated.ts`,
   and `check:assets-barrel` is in the pre-lease gate family. Resolved.

No unflagged rework-forcing decision remains.

## Verdict

`PASS`

Every Plan-Gate box is checked. All three cycle-1 findings are repaired at source, not merely
summarized, and each repair claim was re-derived against the tree at the evaluated head. The repair
is artifact-only and introduces no product file and no unstated boundary. Implementation may begin.

### Non-blocking notes (do not gate implementation)

- `plan.md` §"Status" and `supervisor.md`/`context-pack.md` still describe cycle 2 as pending an
  updated immutable source brief and a coordinator grant. Both conditions are now satisfied — this
  cycle-2 evaluation ran under that grant against source head `5b3c6fcf2`. Refresh that wording on
  the next artifact touch so the resume state is not misread as still blocked.
- Implementation must still honor the standing stops that this verdict does not lift: the
  `scaffold.runtime`/Aspire/Docker singleton lease remains coordinator-granted and is **not** granted
  by this PASS; `codex-root-0.0.7` alone may merge, publish, or mutate milestone state; and a fresh
  opposite-family IMPL-EVAL plus Tier-A slice review remain mandatory, with no lane self-certifying.
- Per `netscript-harness`, any slice touching `packages/**` must additionally clear
  `deno task quality:scan` and `deno task arch:check` at Tier-A review; a new `// deno-lint-ignore`
  or `as unknown as` added to green a wrapper is a review-blocking finding.

### Evaluator conduct

This evaluator ran no product gate, no Aspire/Docker/`scaffold.runtime` process, and no
implementation. No lease was requested. No label, milestone, PR readiness, branch protection, or
central cluster state was mutated. Only `plan-eval-cycle-1.md` (preserved cycle-1 verdict) and this
`plan-eval.md` were committed.

Loop position: cycle 2 of the permitted two `FAIL_PLAN` cycles, closed with `PASS`.
