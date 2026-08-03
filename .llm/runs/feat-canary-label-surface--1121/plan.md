# Plan: Canary label surface (#1121)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Phase | `plan` |
| Target | Internal release tooling + `release-canary.yml` |
| Archetype | N/A — repository-internal release automation, not a package/plugin or shipped CLI |
| Scope overlays | none |

## Archetype

N/A. No `packages/**` or `plugins/**` public surface changes. The user-selected gate set and focused
release-tool tests are authoritative for this tooling slice.

## Current Doctrine Verdict

N/A for the changed surface. The doctrine verdict covers packages/plugins; this plan neither changes
nor deepens those entries.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| Contract first | The resolved-version JSON and explicit gate report are defined before workflow wiring. |
| Wrap, do not reinvent | Reuse `release:canary`, `readRegistryVersions`, git history, and GitHub APIs. |
| Drift is explicit | Label/JSR set differences fail with named orphan/missing entries. |

## Goal

After a coordinated canary version is actually published, derive `canary:<published-version>`,
compute the PR/closed-issue payload from observed merge history between content points, create and
apply the label idempotently, and fail a target-scoped drift gate on either mismatch direction.

## Scope

- Add a JSON result option to `release:canary`; the workflow consumes it instead of `deno.json`.
- Add one focused release tool that applies the derived label and runs the drift comparison.
- Resolve payload PRs from first-parent commit history and GitHub commit association, then resolve
  closed issues from GitHub's closing-issue relation.
- Invoke the tool immediately after the production publish step and emit named PASS/FAIL results.
- Add focused unit/workflow tests, including a deliberately mismatched label/published pair.

## Non-Scope

- Publish readiness, preflight, OIDC, publisher implementation, green canary pair, rollback, and
  republish mechanics remain owned by `netscript-release` and are not restated or changed.
- Wave sequencing, canary cadence decisions, milestone orchestration skill/profile, and live cut
  authority remain outside this slice.
- `agentic:provider-canary` and `agentic:rollout-canary` remain untouched and semantically unrelated.
- No scaffold/runtime E2E; the user explicitly excludes it.

## Hidden Scope

- Workflow label permissions.
- First-canary stable-tag fallback and later-canary tag-parent baselines.
- Idempotent republish/retry behavior.
- Target-train drift scoping because historical canaries predate this surface.
- Explicit failure output, not only a non-zero exit.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | `release:canary --output <path>` writes resolved identity JSON (`version`, `tag`, `branch`). | The resolver owns the version; downstream consumers never infer it from repo metadata or logs. |
| L2 | Label name is produced only by `canaryLabel(publishedVersion)` after canonical canary validation. | Makes `canary:<version>` an identity construction, not operator input. |
| L3 | JSR `@netscript/cli` metadata is the coordinated published-canary set for drift. | CLI publication implies the coordinated dependency graph reached the registry; partial member uploads are not a completed canary surface. |
| L4 | Drift is scoped by required `--target-version`. | Historical 0.0.1–0.0.3 canaries predate labels and must not block first deployment of this surface. |
| L5 | Current content point is the workflow-captured pre-cut `source_sha`. Previous point is the prior lower same-train canary tag's parent, or nearest reachable stable tag for the first canary. | Uses immutable release provenance and observed content, not dispatch-plan membership. |
| L6 | First-parent commit SHAs are mapped through GitHub associated PRs; closing issues come from `closingIssuesReferences`. | Squash subjects contain issue numbers and are not PR identity. GitHub relations express the actual merge/closure facts. |
| L7 | Label application occurs after real publish and before pinned production E2E. | Failed E2E canaries are still immutable published canaries and must remain observable. |
| L8 | Apply and drift gates print structured named results on PASS and named FAIL output on error. | Silence must never be accepted as proof the gate ran. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Historical canary backfill | safe to defer | Explicit target scoping avoids silently absorbing a migration/backfill program. |
| Dynamic label color/description policy | resolved now | One fixed color/description in the tool; label identity remains the version string. |
| Pagination beyond normal payload sizes | resolved now | GitHub list/closing-issue reads paginate; no silent truncation. |
| Live `.1`/`.2` exercise evidence | safe to defer | Orchestrator-owned after landing; issue boxes stay unchecked until real run URLs exist. |
| Close-gate readiness before live cuts | safe to defer operationally | Implementation can reach IMPL-EVAL PASS, but `status:ready-merge` remains blocked without live evidence; no override is planned. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Wrong identity from `deno.json` | Workflow test rejects repo-version parsing and requires the result artifact. |
| Merge subject mistaken for PR identity | Use GitHub commit association and test an out-of-plan/interleaved PR order. |
| Partial publish receives a label | Require exact version in the CLI JSR metadata before any mutation. |
| Label mutation partly succeeds | Operations are idempotent; rerun repairs missing targets and drift remains explicit. |
| Old unlabeled canaries make deployment impossible | Require target-version scope and test unrelated trains are excluded. |
| Gate throws without evidence | Top-level stage-aware failure renderer always prints a named FAIL. |
| GitHub pagination truncates issues/labels | Follow page information / link pages until complete. |
| Release mechanics expand into this slice | Tool consumes existing publish output; no publisher/preflight logic is copied. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| N/A | internal tooling | Avoid log parsing, repo-version identity inference, silent conditionals, and plan-derived payloads. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Identity construction | yes | Unit test proves `0.0.4-canary.1` output while root metadata remains `0.0.3`. |
| Content-derived payload | yes | Unit test preserves first-parent/interleaved observed order and GitHub associations. |
| Bidirectional drift | yes | PASS test plus deliberate label/version mismatch that fails. |
| Explicit firing | yes | Report test asserts every named gate emits `PASS`; negative emits named `FAIL`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No package/plugin doctrine debt created or deepened. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused release tests | `deno test --allow-all .llm/tools/release/canary_test.ts .llm/tools/release/canary-label_test.ts .llm/tools/release/release-canary-workflow_test.ts` | Explicit pass; mismatch negative is observed inside the test. |
| 2 | Scoped check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | PASS artifact with zero diagnostics. |
| 3 | Scoped lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts` | PASS artifact with zero diagnostics. |
| 4 | Scoped fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts` | PASS artifact with zero diagnostics. |
| 5 | User root check | `deno task check` | PASS artifact. |
| 6 | User full tests | `deno test --allow-all` | PASS artifact. |
| 7 | User quality scan | `deno task quality:scan` | PASS artifact. |
| 8 | Close-gate | `deno run --allow-env --allow-net .llm/tools/validation/check-close-gate.ts --repo rickylabs/netscript --pr <PR> --pretty` | Implementation boxes clear; live-cut criterion remains explicitly blocking until orchestrator evidence. |

## Risks

- Live exercise and final close-gate completion depend on external canary cuts after the code surface
  lands. The PR will not claim `status:ready-merge` before those issue boxes have real evidence.

## Dependencies

- Existing `release:canary` version derivation and tag creation.
- Existing full-history checkout and workflow-captured source SHA.
- JSR CLI metadata and authenticated GitHub APIs.

## Drift Watch

- If GitHub cannot reliably map first-parent commits to PRs, stop and rescope rather than parsing
  commit subjects.
- If CLI registry presence is not a valid coordinated-publish marker, record significant drift and
  ask before widening publish mechanics.
- If close-gate semantics require an override before live cuts, do not apply it without owner
  authorization.
