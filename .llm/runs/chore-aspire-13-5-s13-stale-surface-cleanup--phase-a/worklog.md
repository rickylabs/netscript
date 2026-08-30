# Worklog: S13 stale surface cleanup

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Archetype | `6 — CLI / Tooling` with MCP Archetype 2 integration seam |
| Scope overlays | `docs` |

## Design

### Public Surface

- `resolveTelemetryEndpoint` remains the single endpoint policy function and is exported from the
  existing package root so generated consumers can reuse the policy rather than copy it.
- Scaffold outputs change only at the named telemetry example, Windows env, and consumer CI files.

### Domain Vocabulary

- `TelemetryEndpointSource` gains `aspire_ps`.
- `AspirePsDashboardPort` is the injected discovery seam; absence is a normal outcome.
- `AspirePsDashboardReader` is the infrastructure adapter around the Aspire CLI process boundary.

### Ports

- One synchronous dashboard-reader port is justified by the existing synchronous resolver and CLI
  composition. Tests replace it with deterministic S2/empty fixtures; domain code performs no IO.

### Constants

- `DEFAULT_TELEMETRY_ENDPOINT` remains the named compatibility value.
- Aspire CLI argv is finite and centralized in the infrastructure adapter.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED-first executable contracts | Focused tests fail for the intended missing behavior | tests + run dir |
| 2 | D-17 resolver and injected Aspire-ps adapter | MCP focused tests, scoped framework gates | `packages/mcp/**` |
| 3 | Owned cleanup and generated consumers | CLI focused tests + freshness gates | CLI templates/adapters/assets, skill mirror, teardown |
| 4 | Parity phase 2 | validation tests for phases 1/2 and report sweep | `.llm/tools/validation/**`, manifest tooling |
| 5 | Exact-head evidence and evaluator handoff | full listed static gate set | run dir only unless an evaluator fix is required |

### Deferred Scope

- CI phase-2 flip — deferred until S1/S9/S11 are all on main.
- Runtime E2E and canary C — coordinator-owned and explicitly prohibited in this dispatch.

### Contributor Path

Change endpoint precedence in `telemetry-endpoint.ts`, process interpretation in the Aspire-ps
infrastructure adapter, and consumer rendering in the focused scaffold sources; then run the named
source and generated-carrier freshness gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | bootstrap | PLAN-EVAL disposition | Epic exhausted two evaluator cycles, then coordinator ratified D-1…D-17 and dispatched S13; leaf PLAN-EVAL is N/A under the authorized escalation path. |
| 2026-08-30 | bootstrap | host preflight | Deno 2.9.5, .NET 10.0.400, Aspire 13.5.3; `aspire ps` returned `[]`; `docker ps -a` returned no containers. |
| 2026-08-30 | 1 | RED-first contract | Structured test wrapper exited 1 before executing tests: missing Aspire-ps adapter, resolver lacks the third injected-port argument and `aspire_ps` source. This is the intended pre-implementation failure. |
| 2026-08-30 | 2 | D-17 implementation | Added the injected dashboard port and runtime-edge `AspirePsDashboardReader`; wired query, doctor, MCP server, and CLI composition through the one resolver. |
| 2026-08-30 | 3 | stale-surface cleanup | Reused the shared reader from generated telemetry and `.netscript/aspire-cli.ts`; removed bare dashboard defaults, stale wording/pin, paired consumer CI with `SCAFFOLD_VERSIONS`, and updated teardown MCP ownership. |
| 2026-08-30 | 3 | generated carriers | Regenerated CLI/publish assets, synchronized Claude skill mirrors, and regenerated the 798-row Aspire surface manifest with zero unmatched paths. |
| 2026-08-30 | 4 | parity phase 2 | Imported the S1 checker baseline without pins/CI, kept phase 1 default, added phase-2 enforcement, fixed 13.5.3 compat assertions, stale/unmatched manifest detection, and report-only exit mode. |
| 2026-08-30 | 4 | convergence sweep | Regenerated an 800-row manifest (zero unmatched) and ran phase 2 in report mode: 24 non-archival failures remain, all outside S13 ownership. |
| 2026-08-30 | 4 | flip ordering | Refreshed `origin/main` at `24f6642f`; toolchain.env remains 13.4.6, proving S1 is not on main. The CI/default phase-2 flip is deferred; S9 and S11 convergence cannot satisfy the all-three prerequisite without S1. |
| 2026-08-30 | 5 | receipt wiring | Registered `aspire-version-parity` in the durable gate catalog so the required phase-2 report can produce an exact-head JSON receipt. |
| 2026-08-30 | 5 | public docs lint | Added member-level JSDoc to the new endpoint/reader exports; targeted `deno doc --lint` passes. Root MCP doc lint still exposes the pre-existing private `SchemaViewName` reference outside S13 scope. |
| 2026-08-30 | eval 1 | independent IMPL-EVAL | Native Claude/Fable 5 medium session `5263170d-bbd6-4832-aea5-08a1a26dd669` returned `FAIL_FIX`: the workspace runner's new `@netscript/mcp` import was unmapped in public scaffold modes. |
| 2026-08-30 | 6 | evaluator remediation | Added exact JSR/local root import mappings and paired generator coverage, restored the Aspire-port HTTPS fallback, and recorded the new package dependency, synchronous example-route trade-off, and merge-head manifest regeneration obligation. |
| 2026-08-30 | eval 2 | independent IMPL-EVAL | Fresh native Claude/Fable 5 medium session `b7095b3b-13aa-466e-895f-c560309a4e48` evaluated exact implementation head `fc0a0c8c` and returned `PASS`; Phase A is complete and S13 has no Phase B. |
| 2026-08-30 | closeout | host postflight | `aspire ps --format Json --nologo --non-interactive` returned `[]`; `docker ps -a` returned empty. No AppHost, container, runtime, or `e2e:cli` was started. |
| 2026-08-30 | Tier-A fix | export corpus regeneration | Supervisor Tier-A cycle 1 found `check:mcp-export-corpus` red at `ba989e9a`. Regenerated the corpus for the D-17 MCP exports, then regenerated publish assets and the CLI asset barrel; only the corpus changed. D-65 prohibits this lane from launching evaluation or writing `evaluate*.md`. |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED focused contracts | `run-deno-test.ts` over 7 focused test files | EXPECTED_FAIL (exit 1) | 9 type errors identify the missing adapter/port/source; stderr SHA-256 `c005517a…`. |
| MCP tests | `run-deno-test.ts -- --allow-all packages/mcp/tests` | PASS | 139 passed, 0 failed. |
| MCP check | `run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 117 files; no findings. |
| MCP lint/fmt | structured lint/fmt wrappers for `packages/mcp` | PASS | 116 files; no findings. |
| Framework quality | `deno task quality:scan` | PASS | No findings; existing allowance count 7. |
| Architecture | `deno task arch:check` | PASS | No failures; existing repository warnings retained. |
| CLI/teardown focused tests | structured test wrapper over 8 files | PASS | 96 passed, 0 failed. |
| CLI touched-root check | `run-deno-check.ts` over touched CLI roots | PASS | 83 files; no findings. |
| Raw lint/fmt | `deno lint --no-config` and `deno fmt --no-config` with repository style flags | PASS | 19 config-excluded touched TypeScript files; one pre-existing regex spacing form corrected without an ignore. |
| Claude mirror | `deno task agentic:sync-claude:check` | PASS | 18 skills, 22 mirrored files. |
| Emitted samples | `deno task check:emitted-samples` | PASS | 47 emitted TypeScript samples from 37 artifact paths. |
| Framework quality (slice 3) | `deno task quality:scan` | PASS | No findings; existing allowance count 7. |
| Architecture (slice 3) | `deno task arch:check` | PASS | No failures; existing repository warnings retained. |
| Parity tests | structured test wrapper over `.llm/tools/validation/check-aspire-version-parity_test.ts` | PASS | 10 passed, 0 failed; both phases, fixed compat train, archival handling, freshness, and default selector covered. |
| Validation check | `run-deno-check.ts --root .llm/tools/validation --ext ts,tsx` | PASS | 18 files; no findings. |
| Validation raw lint/fmt | `deno lint/fmt --no-config` with repository style flags | PASS | Checker, tests, and manifest generator clean. |
| Phase-2 convergence report | `deno task check:aspire-version-parity -- --phase 2 --report` | REPORT PASS (exit 0) | `manifestFresh=true`; 799 checked, 24 enforcement hits, 6 archival info, 1 lockfile skipped, 0 missing. |
| New MCP exports doc lint | `deno doc --lint` over telemetry endpoint and Aspire-ps reader modules | PASS | New public types, members, and constructor documented. |
| Evaluator-fix focused tests | structured test wrapper over workspace generators, route templates, and plan-init | PASS | 57 passed, 0 failed. |
| Evaluator-fix check | structured check over workspace/app template TypeScript | PASS | 19 files; no findings. |
| Evaluator-fix raw lint/fmt | `deno lint/fmt --no-config` over touched config-excluded TypeScript | PASS | 3 files clean after applying repository formatting to the touched generator. |
| Evaluator-fix consumer/fitness | emitted samples, `quality:scan`, `arch:check`, Claude mirror | PASS | 47 emitted samples; no quality/doctrine failures; mirrors current. |
| Independent IMPL-EVAL cycle 2 | native Claude/Fable 5 medium at exact `fc0a0c8c` | PASS | Full verdict and independently rerun evidence in `evaluate.md`; remaining findings are coordinator bookkeeping or low/info only. |
| MCP export corpus | `deno task check:mcp-export-corpus` | PASS | Hash `8f773fd4…`; 35 packages, 270 subpaths, 7,641 symbols. |
| Publish assets | `deno task check:publish-assets` | PASS | Exit 0; no generated publish-asset diff. |
| CLI asset barrel | `deno task check:assets-barrel` | PASS | Exit 0; no generated asset-barrel diff. |
| MCP tests (Tier-A fix) | structured test wrapper over `packages/mcp/tests` | PASS | 139 passed, 0 failed. |
| Framework quality (Tier-A fix) | `deno task quality:scan` | PASS | No findings; existing allowance count 7. |
| Architecture (Tier-A fix) | `deno task arch:check` | PASS | No failures; existing repository warnings retained. |

Runtime gates are N/A by explicit scope.

## Reconcile — slice 1

- Issue #1724 remains the sole closing issue; epic #1712 is reference-only. Draft PR will be opened
  after this commit at the required S10 base. No contract or scope readjustment was needed.

## Reconcile — slice 2

- D-17 remains unchanged: explicit option → NetScript env → Aspire dashboard port → injected
  `aspire ps` adapter → named default. The adapter selects a running AppHost by canonical path and
  treats the authoritative empty array as unavailable. Domain code performs no process or file IO.

## Reconcile — slice 3

- Generated telemetry now delegates to the package resolver and renders the required unavailable
  guidance instead of materializing the compatibility default. The generated workspace Aspire task
  also consumes the shared reader, completing the D-17 extraction.
- S7's `aspire agent mcp` ownership update was not present on this S10 sibling stack, so S13 applied
  it once here with the RED-first test already committed in slice 1.
- Asset freshness commands compare against committed state; their exact-head checks are scheduled
  immediately after this slice commit and again in the final gate receipt pass.

## Reconcile — slice 4

- Remaining non-archival phase-2 hits by manifest owner: S1 (7), S3 (5), S9 (4), S11 (2), derived
  carriers (2), S1/S4 (2), S4/S6 (1), and S4/S5/S6/S8 (1). No S13-owned hit remains.
- Phase 1 remains the no-argument default and `.github/workflows/ci.yml` is unchanged. The phase-2
  flip must follow S1 #1727, S9 #1759, and S11 #1771 on `main`; current-main toolchain evidence is
  still `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6` and `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6`.

## Handoff Notes

- Under D-65, only the supervisor may dispatch any next evaluator or audit session. This lane must
  not create or modify `evaluate*.md`. The supervisor should verify the corpus-only corrective diff,
  clean host state, and unchanged phase-2 flip disposition at the new head.

## Reconcile — evaluator cycle 1

- F-1 was a valid generated-consumer defect: public JSR/local root configs did not resolve the
  shared reader imported by `.netscript/aspire-cli.ts`. The remediation maps the direct dependency
  only when Aspire tasks are emitted and copied packages are not already workspace members.
- F-2 is fixed by consuming the resolver's `httpsFallback` for `ASPIRE_DASHBOARD_PORT`.
- F-3/F-4/F-6 are explicitly dispositioned in `drift.md`; F-5 remains a non-blocking diagnostic
  improvement. The plan and ratified D-17 contract remain unchanged.

## Reconcile — evaluator cycle 2

- Cycle 2 independently verified F-1 and F-2 fixed and accepted the recorded F-3/F-4/F-6
  dispositions. It found no remaining blocking implementation issue and returned `PASS`.
- The phase-2 flip remains correctly deferred: S1 #1727, S9 #1759, and S11 #1771 are not all on
  `main`. `.github/workflows/ci.yml` remains unchanged and phase 1 remains the no-argument default.
- This verdict certifies S13 Phase A only. D-58 retargeting, merge-head manifest convergence,
  issue close-gate evidence, canary C, and runtime validation remain coordinator-owned.

## Reconcile — Tier-A cycle 1 correction

- The reported red was reproducible as stale generated public-surface evidence, not a D-17 design
  change. `gen:mcp-export-corpus` updated only
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`; the
  dependent publish-asset and asset-barrel generators produced no additional changes.
- All named corrective gates and the MCP suite pass. `aspire ps` remains `[]`, Docker remains empty,
  and no runtime was started. Further audit/evaluation is supervisor-owned under D-65.

## D-155 corrected-stack un-stack

- Rebased the nine S13 commits with
  `git rebase --onto c9e3fcbe8 a46ea16d0`. The final merge-base is exactly `c9e3fcbe8`; the old
  lineage contains 36 commits exclusive of corrected S10 and has zero overlap with the rebased
  head. `a46ea16d` is not an ancestor.
- `git range-diff --creation-factor=100 a46ea16d0..d3f71c0b7 c9e3fcbe8..HEAD` maps every old commit
  to the same ordinal. Commits 1, 2, 6, 7, and 8 are patch-identical; commits 3, 4, 5, and 9 differ
  only at ruled/generated convergence surfaces. The explicit creation factor pairs the ninth
  evidence commit after its tree-bound manifest and D-155 run artifacts were regenerated.
- Conflict resolutions:
  1. kept S13's deletion of `SCAFFOLD_COMMUNITY_TOOLKIT` while retaining
     `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` unchanged;
  2. took the upstream Aspire surface manifest, then regenerated it at the post-deletion tree;
  3. preserved current-main's parity implementation/tests as the base and additively retained S13
     phase-2 freshness, selector, archival-class, fixed-compat, and report behavior;
  4. set only `check:aspire-version-parity` to
     `deno run --allow-read --allow-run=git .llm/tools/validation/check-aspire-version-parity.ts`.
  The generated MCP export corpus took upstream under the standing generated-file rule.
- The regenerated manifest contains 815 rows and zero unmatched paths. Parity runs with the exact
  restricted task line and reports `fail: 0`, `missing: 0`, and `manifestFresh: true`.

| D-155 verification | Exit | Result |
| --- | ---: | --- |
| corrected S10 merge-base assertion | 0 | `git merge-base HEAD c9e3fcbe8 == c9e3fcbe8` |
| nine-commit range-diff | 0 | all nine commits mapped in order |
| stale-lineage overlap | 0 | 36 stale exclusive commits examined; overlap 0 |
| `deno task gen:assets-barrel` | 0 | generated assets unchanged |
| `deno task check:assets-barrel` | 0 | diff-clean |
| manifest generator | 0 | 815 rows, 0 unmatched |
| `deno task check:aspire-version-parity` | 0 | `fail: 0`, manifest fresh |
| focused parity tests | 0 | 13 passed, 0 failed; base and phase-2 cases retained |
| changed-source check | 0 | 33 files, 1 batch, 0 failed batches |
| changed-source lint | 0 | 33/33 processed, 0 findings |
| changed-source format | 0 | 33/33 processed, 0 findings |
| `deno task quality:gate` | 0 | no quality findings; doctrine failures 0 |
| `deno task check` | 0 | 2,982 files, 25 batches, `failedBatches: 0` |

The first changed-source lint attempt exited 2 by correctly refusing partial coverage from root
config exclusions. The final wrapper run used a temporary invocation-only config, processed all 33
files, and found nothing; the temporary file was removed. No source lint ignore or repository
permission/config widening was added. No Aspire, Docker, AppHost, runtime, PLAN-EVAL, or evaluator
command ran.

## Reconcile — D-155

- The coordinator's corrected stacked baseline supersedes the prior `a46ea16d` handoff without
  changing the PR base. The tree-bound manifest is regenerated at the corrected stack head.
- A separate GLM IMPL-EVAL remains supervisor-owned after push; this lane does not modify
  `evaluate*.md` or dispatch evaluation.
