# PLAN-EVAL — fix-scaffold-generated-output-correctness--0.0.7-wave0

Formal PLAN-EVAL **cycle 1**. Separate session from the generator (generator lane was OpenAI Codex
`gpt-5.6-sol` high, thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`); this evaluator is native Claude.

## Evaluator identity

| Field                 | Value                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Requested route       | native Claude Opus 5, effort **medium**                                                                                        |
| Observed route        | `claude-opus-5`, effort `medium` — **matched**, no substitute                                                                  |
| Fable 5               | unassigned; not used                                                                                                           |
| Session ID            | `bd703a7d-4757-4689-a603-5ca98f7d7323`                                                                                         |
| Remote-control bridge | `cse_015wwEYoUsxCwzT3PQeSqi2A` (enabled at launch, outbound+inbound)                                                           |
| Bridge label          | `NetScript 0.0.7 #1654 PLAN-EVAL`                                                                                              |
| PID                   | `2470890`                                                                                                                      |
| cwd                   | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness`                                                   |
| CLI version           | `2.1.233`                                                                                                                      |
| Route evidence        | `/home/codex/.claude/jobs/bd703a7d/state.json` → `respawnFlags` = `--effort medium … --remote-control … --model claude-opus-5` |

The session is spare-claimed, so its `argv` carries no `--model`/`--effort`; `state.json`
`respawnFlags` is the authoritative route record.

## Head reconciliation (independently resolved; no mismatch)

| Ref                                                                         | SHA                                        |
| --------------------------------------------------------------------------- | ------------------------------------------ |
| `git ls-remote origin refs/heads/fix/scaffold-generated-output-correctness` | `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` |
| PR #1654 `headRefOid`                                                       | `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` |
| Local `HEAD`                                                                | `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` |
| Task-specified source head                                                  | `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` |

`git merge-base HEAD 01e0960494c95ce56eb35892c211a095eb13e6ed` = `01e096049` — the immutable base is
an ancestor. Branch carries exactly three harness commits (`88b735a36`, `42572af32`, `14d8b38b4`);
no product source is modified. PR #1654 is draft, base `main`, labels include exactly one phase
label `status:plan-eval`, milestone `0.0.7`.

Run: `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/`. Surface: Archetype 6 —
CLI/tooling. Scope overlays: none.

## Checklist results

| Plan-Gate item                          | Result               | Evidence / location                                                                       |
| --------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| Research present and current            | **PASS**             | `research.md` re-baselined at `01e096049`; all four load-bearing probes re-verified below |
| Decisions locked                        | **PASS (qualified)** | `plan.md` §"Locked design" 1–4; qualified by the memory-router gap under box 3            |
| Open-decision sweep                     | **FAIL**             | No such section exists in `plan.md`; evaluator found a rework-forcing open decision       |
| Commit slices (< 30, gate + files each) | **FAIL**             | `plan.md` §"Ordered reviewable slices" — 6 slices, ordered, but no per-slice files/gate   |
| Risk register                           | **PASS**             | `plan.md` §"Risk register" — 7 risks, each with a control traceable to the design         |
| Gate set selected                       | **PASS**             | `plan.md` §"Gate family and receipts"; matches Arch 6 matrix + leaf `provingGates`        |
| Deferred scope explicit                 | **FAIL**             | #1262 acceptance item 3 is neither in scope nor deferred                                  |
| jsr-audit surface scan (pkg/plugin)     | **PASS**             | `research.md` §"Public/JSR surface inspection"; matches leaf `jsrAudit.risks`             |

## Independent re-verification of load-bearing findings

Every RED-first claim was re-checked against the working tree at the evaluated head. All four hold.

| Claim                                               | Verified                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1262 placebo seed                                  | `assets/database/seed.ts.template` runs a raw `SELECT 1` health query, then prints "Database seed completed." — it never writes a row                                                                                                                                                                      |
| #1262 schema always has a model                     | `assets/database/schema.prisma.template` renders `model {{modelName}}` with `id/name/createdAt/updatedAt`                                                                                                                                                                                                  |
| #1263 get-by-id throws undefined error              | `assets/service/routers/v1.ts.template:59` — throws a plain `Error` with a "not found" message, not a defined contract error                                                                                                                                                                               |
| #1263 update/delete let `P2025` escape              | `v1.ts.template:66–75` — bare `update`/`delete`, no translation                                                                                                                                                                                                                                            |
| #1263 OpenAPI 404 already projected (fallback)      | `contract-primitives.ts:22–25` `commonErrorMap.NOT_FOUND status 404`; `baseContract` at :81 applies it; `crud/create-crud-contract.ts:29,350` composes `baseContract`                                                                                                                                      |
| #1588 SQLite emits every provider parser            | `generate-engine-mod.ts:34,141` injects the whole `databaseConnectionHelpers` asset unconditionally; `connection-helpers.ts.template` defines `normalizePostgresUrl`/`normalizeMysqlUrl`/`normalizeMssqlUrl`/`parseConnectionParts`; `generate-prisma-config-1.ts.template:43–136` hardcodes the same four |
| `notFound` helper exists                            | `packages/contracts/src/domain/errors.ts:39`                                                                                                                                                                                                                                                               |
| Existing live verifier exists (no new gate sibling) | `packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts`                                                                                                                                                                                                                               |
| Named repo tasks exist                              | `deno.json` — `quality:gate`:52, `arch:check`:163, `gen:assets-barrel`:111, `check:assets-barrel`:115                                                                                                                                                                                                      |

### Boundary amendment — authorized and centrally reflected

Coordinator comment `5286194892` was read verbatim and authorizes exactly the six seams recorded in
`plan.md` §"Authorized boundary amendment" and `drift.md`, denies an expensive-gate lease, and keeps
the already-green #1263 OpenAPI projection as regression coverage only. The central contract has
been amended to match:
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json` →
`contracts[13]` (`scaffold-generated-output-correctness`, issues `1262/1263/1588`, archetype
`6-cli-tooling`, `jsrAudit.applicable: true`) now lists all six seams in `fileSurfaces`, landed by
commit `21a6ec874` ("harness: amend scaffold generator leaf boundary"). The plan's boundary is
therefore sound. **Amendment row: PASS.**

### Expensive-gate sequencing

`plan.md` §"Gate family and receipts" places all cheap evidence (structured check/test/lint/fmt,
`check:assets-barrel`, `quality:gate`, `arch:check`, JSR audit, `deno doc --lint`, publish dry run)
strictly before the leased stage, then runs **exactly one** shared
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, followed by the scoped read-only
`agentic:leak-check` with the correct `--slice-dir`/`--worktree`. Slice 6 is the only slice that may
touch it; slice 5 explicitly states "No Aspire/Docker/runtime execution yet"; the lease is
coordinator-granted and currently denied. The three issues share one verdict and are never split.
**Serialized-lease row: PASS.** No expensive gate was run by this evaluator.

### JSR / publish applicability

Leaf `jsrAudit.applicable` is `true` with two named risks; `research.md` covers both (public exports
and exact `@netscript/*` pins; isolated-declaration publish dry run rejecting runtime asset /
`import.meta` reads) and adds stale embedded assets, each mapped to a planned gate. No public export
change is planned and `deno doc packages/cli/mod.ts` was reported clean at base. **PASS.**

## Open-decision sweep (evaluator-run)

The plan has no open-decision section, so this sweep is entirely the evaluator's. One finding forces
rework if deferred.

**OD-1 (rework-forcing) — the generated memory router has no error map, so `notFound` cannot produce
a defined 404 there.**

Locked design item 2 states: "Import the existing `notFound` contract helper into generated
persistent **and memory** routers", and slice 4 covers "persistent and memory templates". But:

- `assets/service/contract.memory.ts.template` builds every route from bare `oc` (`oc.route({...})`
  at lines 76, 81, 84). The string `errors` appears **zero** times in that file — it never calls
  `.errors(...)` and never composes `baseContract`.
- `notFound()` (`errors.ts:39`) does `constructors.NOT_FOUND({...})` on the handler's `errors`
  object. With no `NOT_FOUND` entry in the route's error map, `constructors.NOT_FOUND` is
  `undefined`, so the call throws a `TypeError` — surfacing as an **undefined 500**, which is the
  exact defect class #1263 exists to remove.
- The memory router's shape also does not match the prescription. It has no get-by-id, update, or
  delete and no Prisma; its only missing-row branch is `updateStatus`
  (`v1.memory.ts.template:52–57`), which throws a plain `Error` over an in-memory `seededRecords`
  array. "Translate only Prisma's `P2025`" has no meaning there.

Deferring this forces rework: the implementer either ships an undefined error on the memory path
(caught only at IMPL-EVAL, after the leased runtime verdict has been spent), or must amend
`contract.memory.ts.template` mid-implementation — a template the plan never names and whose change
sits adjacent to the plan's own "no redundant contract-layer change" rule. Per
`evaluator/plan-protocol.md` step 3 this is an automatic unchecked box.

**OD-2 (safe to defer, but unflagged) — what input drives the "empty schema" seed branch.**
`scaffolder.ts:130` resolves `modelName: options.modelName ?? 'ExampleRecord'`, so no
`DatabaseScaffolder` path ever produces a model-less schema. The empty-schema branch is reachable
only by calling the new generator directly. That is a legitimate generator-level contract, but the
plan presents it as scaffold behavior and requires a test of it without saying what makes it
reachable — leaving a reviewer unable to distinguish "tested contract" from "dead branch".

**OD-3 (safe to defer) — provider-fragment emission mechanism for #1588.** The plan says "make
connection-helper generation provider-aware" without choosing between splitting
`connection-helpers.ts.template` into per-provider assets and selecting fragments in the generator.
Both land inside the authorized `packages/cli/src/kernel/assets` surface, so either choice is
in-boundary and this does not force rework.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Resolve OD-1 and add an explicit open-decision sweep.** Add an "Open decisions" section to
   `plan.md` listing each still-open decision marked `safe to defer` or `must resolve now`. For the
   memory router, decide one of:
   - **(a) In scope** — give `assets/service/contract.memory.ts.template` an explicit error map
     carrying `NOT_FOUND` (via `baseContract` or `.errors(...)`), name that template in slice 4's
     file list, and state which memory operation(s) return the defined 404; or
   - **(b) Out of scope** — remove "and memory routers" from locked design item 2 and drop the
     memory template from slice 4, recording the exclusion under "Deferred scope" with the reason
     that the memory showcase router carries no error map and no CRUD by-id surface.

   Whichever is chosen, the plan must stop prescribing `P2025` translation for a router that has no
   Prisma.

2. **Give every commit slice its files and its proving gate.** Slices 2–6 name what they prove but
   name neither the files they touch nor the gate that proves them; the plan carries only one global
   gate list. Restate each slice as `proves → gate → files`, drawn from the amended
   `leaf-contracts.json` `fileSurfaces`. While doing so, add
   `packages/cli/src/kernel/templates/database/generate-engine-mod.ts` to `plan.md`'s explicit
   surface list — the #1588 runtime fix must edit it (`buildConnectionHelpers()` at
   `generate-engine-mod.ts:34,141`), and although it is present in the central contract, `plan.md`'s
   own amendment list omits it and describes the remainder as "asset/template and `packages/cli/e2e`
   surfaces". That omission is the same false-boundary stop that already cost this run one cycle.

3. **Account for #1262 acceptance item 3.** "Tutorial/docs seed steps verified against the new
   behavior" is neither planned nor deferred. Cheapest truthful fix: record that
   `docs/site/data-persistence/database.md:179` already documents `netscript db seed` as populating
   "baseline rows" — a claim the fix makes true rather than false — and either mark it
   verified-by-inspection in scope, or defer it explicitly with that rationale. The PR body's
   "remaining" list for #1262 should agree with whichever is chosen.

## Notes

- Non-blocking: `worklog.md`'s housekeeping note still says PR #1654 "remains draft at
  `status:plan`"; the live label is `status:plan-eval` (exactly one phase label, correct for this
  phase). Worth correcting on the next artifact touch.
- Non-blocking: OD-2 should be answered in the same edit as fix 1, since both concern the new seed
  generator's input contract.
- This evaluator ran no gate, no Aspire/Docker/`scaffold.runtime` process, and no implementation. No
  lease was requested. No label, milestone, PR readiness, or central cluster state was mutated.
- Loop position: cycle 1 of the permitted two `FAIL_PLAN` cycles. All three fixes are plan-text
  edits; none requires new research or a further boundary amendment.
