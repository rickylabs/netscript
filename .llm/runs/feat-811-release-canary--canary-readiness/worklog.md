# Worklog: canary publish channel and publish readiness

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `feat-811-release-canary--canary-readiness` |
| Branch         | `feat/811-release-canary`                   |
| Archetype      | `6 — CLI / Tooling`                         |
| Scope overlays | none                                        |

## Design

### Public Surface

- `deno task release:canary -- <stable-target> [--dry-run]` — derives, prepares, gates, and
  optionally pushes a canary cut without a PR.
- `deno task publish:readiness` — emits an ordered, structured verdict for the current workspace
  version.
- `deno task release:publish` — existing command, now fails without a green `release/canary-pair`
  status for matching content.
- `.github/workflows/release-canary.yml` — authenticated canary publish and exact downstream
  production-E2E orchestration.

### Domain Vocabulary

- `CanaryVersionPlan` — stable target, derived canary version, and registry/tag evidence used for N.
- `ReleasePreparationResult` — coordinated bump plus ordered gate results shared by stable and
  canary cuts.
- `PublishReadinessCheck` — one named PASS/FAIL evidence row with details and duration.
- `PublishReadinessReport` — target version, new-package set, ordered checks, and composite verdict.
- `CanaryPairStatus` — GitHub commit status context proving canary publish and its exact E2E run are
  green.

### Ports

- JSR metadata fetcher — distinguishes package absence (404) from registry failure and supplies
  version maps.
- Command runner — invokes canonical preflight, provisioning, dry-run, prod-install, and git without
  shell interpolation.
- GitHub transport — existing `githubRequest` plus `resolveGithubToken`, extended with an in-process
  hosts-file fallback.
- Filesystem reader — reads manifests/READMEs/docs pointers and permits deterministic temp-fixture
  tests.

### Constants

- `CANARY_PRERELEASE_LABEL = "canary"`.
- `CANARY_PAIR_STATUS_CONTEXT = "release/canary-pair"`.
- JSR registry/management base URLs remain centralized under
  `.llm/tools/release/config/endpoints.ts`.
- README/tagline caps and required sections reuse the existing validation sources.

### Commit Slices

| # | Slice                           | Gate                                       | Files                                                       |
| - | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| 1 | Harness bootstrap and design    | separate PLAN-EVAL                         | run artifacts                                               |
| 2 | Shared preparation + canary cut | cut/canary tests                           | release command/helper/tests, task, run artifacts           |
| 3 | Composed readiness              | readiness tests; every check witnessed red | readiness/helpers/tests, run artifacts                      |
| 4 | Workflow + pair enforcement     | YAML sanity; GitHub/token tests            | workflows, github-release, agentic lib/tests, run artifacts |
| 5 | Canary-first doctrine           | skill sync/check                           | release skill source/mirror, debt, run artifacts            |
| 6 | Final evidence                  | required gates + separate IMPL-EVAL        | run artifacts and PR trail                                  |

### Deferred Scope

- Live canary publish/yank and repository/JSR permission changes are post-merge owner actions.
- PR #810 scanner implementation remains on its own branch.

### Contributor Path

Add or change one readiness rule as a named evidence-producing check with a seeded failure test;
keep JSR/GitHub/process IO behind the existing injected dependency records. Change publication only
through `run-publish.ts`, and change stable/canary preparation only through the shared preparation
helper.

## Progress Log

| Time       | Slice | Step                   | Notes                                                                                                                                                                                  |
| ---------- | ----- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-17 | 1     | research/design        | Re-baselined at `a5adb706`; existing release suite 29/29 green; implementation blocked on PLAN-EVAL.                                                                                   |
| 2026-07-17 | 1     | PLAN-EVAL retry        | First Qwen evaluator attempted prohibited closed-model delegation and was interrupted; no verdict accepted. Fresh direct-only Qwen retry required.                                     |
| 2026-07-17 | 1     | PLAN-EVAL              | PASS from a fresh OpenRouter/Qwen 3.7-max session; all 8 Plan-Gate items passed. Implementation unblocked.                                                                             |
| 2026-07-17 | 2     | shared preparation     | Factored stable/canary bump, residue, canonical preflight, dry-run, and prod-install gates into `prepare-release.ts`; stable cut now consumes it.                                      |
| 2026-07-17 | 2     | canary cut             | Added stable-target parsing, workspace-wide JSR/tag N discovery, ephemeral branch plus provenance tag, task wiring, and 404/malformed metadata negative tests.                         |
| 2026-07-17 | 2     | opposite-family review | Fable route was unavailable; canonical Opus 4.8 medium fallback returned `SLICE_REVIEW_PASS`.                                                                                          |
| 2026-07-17 | 3     | composed readiness     | Added ordered publish-set, Markdown-pin, lockstep/residue, versionless-specifier, new-package, first-publish, provisioning, and canonical-preflight evidence.                          |
| 2026-07-17 | 3     | negative proofs        | Seeded every readiness rule to fail, including PR #810's canonical preflight boundary and exact sunset criterion; focused suite passed 19/19.                                          |
| 2026-07-17 | 3     | review repair          | Independent review initially failed on an orphaned Markdown audit; wired it into readiness, strengthened partial-registry and absent-only evidence, then received `SLICE_REVIEW_PASS`. |
| 2026-07-17 | 4     | workflow + pair gate   | Added canary publish workflow, exact run dispatch/watch, stable-publish pair enforcement, commit-status evidence, and durable hosts-file token fallback.                               |
| 2026-07-17 | 4     | review hardening       | Exact bump-only inheritance, full-history stable checkout, Actions-token handling, and best-effort cleanup were independently re-reviewed; `SLICE_REVIEW_PASS`.                        |
| 2026-07-17 | 5     | canary-first doctrine  | Made same-content green canary pair mandatory, documented scheme/yanking/no-ad-hoc policy and #810 sunset, closed stale OIDC wiring debt, and synchronized the Claude mirror.          |
| 2026-07-17 | 5     | opposite-family review | Independent Opus review verified source/mirror, mandatory gates, policy, and honest debt closure; `SLICE_REVIEW_PASS`.                                                                 |
| 2026-07-17 | 6     | quality repair         | Changed-file scan exposed legacy `any` suppressions in touched `agentic-lib.ts`; replaced them with unknown-boundary narrowing across the internal GitHub transport consumers.         |
| 2026-07-17 | 6     | final gates            | Release 59/59, agentic 63/63, check/lint/fmt, YAML, mirror sync, and changed-file quality with zero allowances all passed.                                                             |
| 2026-07-17 | 6     | evaluator route proof  | Canonical `claude-openrouter` live provider canary passed with Qwen tools, reasoning, and streaming after three discarded zero-turn/profile probes.                                    |
| 2026-07-17 | 6     | IMPL-EVAL              | Separate direct-only Qwen session `a06700df-b15b-43e4-a35b-e9d0a97c2f06` independently witnessed 122/122 tests and returned `PASS` with no blocking findings.                           |
| 2026-07-17 | 6     | evidence correction    | Same evaluator re-verified and corrected stale metadata in `evaluate.md`; the implementation verdict remained `PASS`.                                                                |

## Decisions

| Decision                  | Reason                                             | Source                         |
| ------------------------- | -------------------------------------------------- | ------------------------------ |
| Shared preparation helper | Stable and canary gates must not drift.            | issue #811 + plan D3           |
| Commit-status green pair  | API-readable, SHA-bound, and workflow-independent. | issue #811 + GitHub status API |
| Call #810 preflight task  | Avoid duplicate scanner ownership.                 | user directive + plan D6       |

## Drift

| Drift                                | Severity | Logged in drift.md |
| ------------------------------------ | -------- | ------------------ |
| Invalid evaluator delegation attempt | moderate | `drift.md`         |
| Fable slice-review route unavailable | minor    | `drift.md`         |
| IMPL-EVAL profile omitted initially  | minor    | `drift.md`         |
| Evaluator evidence transcription     | minor    | `drift.md`         |

## Gate Results

### Static Gates

| Gate                   | Command or check                                                   | Result | Notes                                                                          |
| ---------------------- | ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| release baseline tests | `deno test --allow-all .llm/tools/release/`                        | PASS   | 29 passed, 0 failed before implementation                                      |
| PLAN-EVAL              | `.llm/runs/feat-811-release-canary--canary-readiness/plan-eval.md` | PASS   | Separate direct-only OpenRouter/Qwen session; no delegation                    |
| slice 2 check          | `deno check --unstable-kv` on cut/canary/preparation TS            | PASS   | 5 implementation/test entry points checked                                     |
| slice 2 tests          | focused cut/canary/preparation test command                        | PASS   | 15 passed, 0 failed                                                            |
| slice 2 review         | `slice-2-review.md`                                                | PASS   | Separate Claude Opus 4.8 medium fallback; no blocking findings                 |
| slice 3 focused tests  | focused readiness/preparation/preflight test command               | PASS   | 19 passed, 0 failed; every new readiness row has a seeded violation            |
| slice 3 live readiness | `deno task publish:readiness`                                      | PASS   | 8 ordered checks green; `@netscript/mcp` correctly treated as first-publish    |
| slice 3 review         | `slice-3-review.md`                                                | PASS   | Initial blocking Markdown-audit finding repaired and independently re-reviewed |
| slice 4 focused tests  | workflow, GitHub release, verifier, and agentic-lib tests          | PASS   | 81 passed, 0 failed after review hardening                                     |
| full release tests     | `deno test --allow-all .llm/tools/release/`                        | PASS   | 59 passed, 0 failed after slice 4                                              |
| slice 4 YAML sanity    | `@std/yaml` parse on all three touched workflows                   | PASS   | canary, stable publish, and production-E2E workflows parsed                    |
| slice 4 review         | `slice-4-review.md`                                                | PASS   | Independent Opus re-review; no blocking findings remain                        |
| skill mirror sync      | `deno task agentic:sync-claude:check`                              | PASS   | 17 skills and 21 mirrored files synchronized                                   |
| slice 5 review         | `slice-5-review.md`                                                | PASS   | Independent Opus review; no blocking findings                                  |
| final combined tests   | release suite + `agentic-lib_test.ts`                              | PASS   | 122 passed, 0 failed                                                           |
| touched TS check       | scoped `run-deno-check.ts`                                         | PASS   | 25 files, `--unstable-kv`, zero findings                                       |
| touched TS lint/fmt    | scoped lint and format wrappers                                    | PASS   | 25 files, zero findings                                                        |
| changed-file quality   | `quality:scan --max-allow 0`                                       | PASS   | 25 files, zero findings, zero allowances                                       |
| implementation gates   | `final-gates.md`                                                   | PASS   | All requested local gates green                                                |
| IMPL-EVAL              | `evaluate.md`                                                      | PASS   | Separate direct Qwen session; no blocking findings                             |

### Fitness Gates

| Gate             | Result  | Evidence              | Notes                                                                          |
| ---------------- | ------- | --------------------- | ------------------------------------------------------------------------------ |
| F-9 permissions  | PASS    | `deno.json`           | Registry lookup scoped to `jsr.io`; subprocess/read/write permissions explicit |
| F-10 test shape  | PASS    | focused slice 2 tests | Injected registry/Git transport, residue failure, and exact ref sequence       |
| F-5/F-6/F-7/F-19 | NOT_RUN | `plan.md`             | Final/affected-slice gates pending                                             |

### Runtime Gates

| Gate             | Result | Evidence                        | Notes                                                                    |
| ---------------- | ------ | ------------------------------- | ------------------------------------------------------------------------ |
| live canary pair | N/A    | no registry mutation in this PR | workflow behavior is structurally tested; first live run is owner action |

### Consumer Gates

| Consumer                | Result         | Evidence                                                  | Notes                                                                       |
| ----------------------- | -------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| stable release operator | PASS (slice 2) | existing cut tests + shared-preparation test              | Stable cut consumes same ordered preparation helper                         |
| package publisher       | PASS (slice 3) | live structured readiness verdict + seeded negative tests | Effective 35-member publish set and absent-only first-publish checks proven |

## Handoff Notes

- PLAN-EVAL and IMPL-EVAL are complete and `PASS`; the draft PR may move to `status:impl-eval` but
  must not be merged by this run.
- Live canary publication, canary-pinned production E2E, repository workflow permissions, and JSR
  scope grants remain explicit post-merge OWNER actions.
