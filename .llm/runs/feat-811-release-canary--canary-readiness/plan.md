# Plan: canary publish channel and publish-readiness gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-811-release-canary--canary-readiness` |
| Branch | `feat/811-release-canary` |
| Phase | `plan` |
| Target | release tooling, GitHub Actions, and release doctrine |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 is the smallest fit because the public surface is maintainer-run release commands and workflows. The package-shape spine rules are not applicable to `.llm/tools/release`, but its contract-first, adapter-boundary, structured-output, permission, and negative-proof expectations are.

## Current Doctrine Verdict

`@netscript/cli` remains `Restructure`, but no CLI package source changes in this slice. Release automation is internal tooling; the relevant release-provenance debt is closed only when the new evidence exists.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A7 | Reuse Deno, JSR metadata, GitHub APIs, and existing publisher machinery before adding abstractions. |
| A8 | Version derivation, readiness checks, publication, and pair verification each have one reason to change. |
| A10 | Network/process dependencies are injectable at test boundaries; pure checks remain deterministic. |
| A14 | Every readiness check has a witnessed negative case and the final release decision is evidence-backed. |

## Goal

Make an authenticated, full-workspace canary publish plus canary-pinned production E2E a mandatory precondition for stable-channel publication, and expose one structured publish-readiness verdict that blocks known first-publish, workspace-drift, version, residue, and import-attribute failures.

## Scope

- Add `release:canary` and canary-version derivation from JSR registry metadata.
- Factor the bump/residue/preflight/dry-run/prod-install sequence shared by stable cuts and canary cuts.
- Add structured `publish:readiness` checks and failure evidence.
- Add `release-canary.yml`, dispatch and await the exact `e2e-cli-prod` run, and publish a green-pair commit status.
- Enforce the pair in `github-release.ts` with the shared GitHub API/token resolver and a direct `gh` hosts-file fallback.
- Update canonical release doctrine, regenerate its mirror, and close only the stale OIDC debt.
- Preserve #810 ownership of import-attribute detection and document the call boundary in both PRs.

## Non-Scope

- Publishing a canary during this PR, merging either PR, or changing repository/environment settings.
- Reimplementing PR #810's scanner or generated-asset changes.
- Deleting JSR versions; JSR versions are immutable and yanking is the only retirement action.
- Reworking published package APIs or unrelated README content.
- Automatically yanking successful canaries; that remains an owner operation after the stable release is verified.

## Hidden Scope

- Workflow-to-workflow correlation must use the dispatch response's run id; a fire-and-forget dispatch cannot produce a green-pair verdict.
- A successful pair is recorded on the pre-bump content SHA. `release:publish` accepts it only for the current SHA or an immediate parent whose delta is version-only.
- Failed pre-publication canary tags remain collision inputs; JSR version metadata is primary and local/remote tags are a secondary collision guard.
- The temporary `release/canary-<version>` branch is deleted in workflow cleanup; the `v<version>-canary.N` tag is retained as provenance.
- Workflow permissions require `id-token: write`, `actions: write`, `statuses: write`, and `contents: write`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The input is a bare stable target SemVer with no prerelease suffix; output is `<target>-canary.N`. | Keeps every canary below its target and avoids ambiguous nested prerelease precedence. |
| D2 | `N` is one greater than the maximum matching version across all published workspace package metadata; matching tags are a collision guard. | A partial publish may leave only some members at the attempted N, so one-package lookup is insufficient. |
| D3 | Stable cut and canary cut call one shared bump-and-gates function. | Meets the reuse requirement and prevents gate drift. |
| D4 | `publish:readiness` emits ordered per-check evidence and throws only after collecting the composed verdict where safe. | Gate-log discipline makes CI and tests attributable. |
| D5 | New-package detection uses JSR registry metadata; the first-publish checklist applies only to absent effective publish members. | Existing packages should not be blocked by retroactive first-publish-only checks. |
| D6 | The import-attribute readiness row invokes `release:preflight`; PR #810 owns its scanner and sunset text. | Prevents duplicate implementations while making the composed gate depend on the canonical preflight. |
| D7 | Canary publication calls the existing `run-publish.ts` real preflight and publish modes. | The canary is the production pipeline with a canary version, not a second publisher. |
| D8 | The pair status context is `release/canary-pair`; success is written only after the exact dispatched E2E run exits green. | A single API-readable status expresses both independent verdicts for one content SHA. |
| D9 | `github-release.ts` fails closed when no green pair is found; API lookup errors are errors, not warnings. | The issue calls the gate mandatory; best-effort describes SHA inference, not optional enforcement. |
| D10 | A successful canary tag remains; its temporary branch is deleted. Failed/obsolete JSR canaries may be yanked, never deleted. | Retains provenance while keeping branch clutter bounded and respecting JSR immutability. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Automatic trigger on release-prep branches | safe to defer | `workflow_dispatch` is mandatory; automatic publication on branch push is intentionally omitted to avoid surprise registry writes. |
| Automatic yanking | safe to defer | Requires owner/JSR scope policy; doctrine records the manual policy. |
| Existing-package full README retrofit | safe to defer | First-publish checklist is explicitly scoped to packages absent from JSR. |
| #810 merge timing | resolved now | This PR calls the stable `release:preflight` task and records #810 as a merge-order dependency; it does not copy scanner code. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Canary N collides after a partial or pre-publish failure. | Max across all package metadata plus tag collision guard; tests cover gaps and yanked versions. |
| Workflow claims green before downstream E2E finishes. | Capture dispatch run id, await it with exit status, then write success status and summary. |
| Pair from older content authorizes changed code. | Status is attached to source SHA; verifier accepts only current SHA or a version-only immediate parent. |
| Stable and canary YAML paths drift. | Both invoke the same `publish:readiness`, `run-publish.ts --preflight`, and `run-publish.ts` entrypoints. |
| Network failures masquerade as new packages. | Only HTTP 404 means absent; all other registry/API failures fail the check. |
| First-publish gate scans internal workspaces. | Compare effective publisher members; explicit exclusions remain reasoned and tested. |
| PR #810 changes preflight shape. | Call task boundary rather than importing scanner internals; combined seeded violation is rerun after #810 lands. |
| Token leaks through hosts fallback. | Parse in-process, validate via `/user`, never log token, and test only synthetic text. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep readiness as small named checks and shared orchestration, not one monolithic script body. |
| AP-7 | risk | Factor stable/canary preparation and reuse the real publisher. |
| AP-11 | risk | Network, filesystem, and subprocess behavior stays at explicit injected boundaries. |
| AP-18 | risk | Assert semantic evidence rows and seeded violations, not giant output snapshots. |
| AP-19 | risk | Workflow and task permissions are explicit and documented. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5 public surface | yes | task/CLI parsing tests and contributor documentation |
| F-6 JSR publishability | yes | readiness green/red tests, existing publish dry-run path, canary workflow review |
| F-7 doc-score | yes for new packages | README/tagline/docs pointer checks with seeded failure |
| F-9 permissions | yes | YAML permissions and Deno task allowlists reviewed |
| F-10 test shape | yes | every new check has a negative fixture/seed |
| F-19 scoped runners | yes | focused release tests plus touched-TS check/lint/fmt wrappers |
| F-CLI-* | reviewed/N/A | no package CLI spine or command surface changes; task interfaces receive manual evidence |
| release-gate class | design-only | workflow structurally proves automatic canary-pinned E2E; no live publish occurs in this PR |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `release provenance — OIDC publish workflow deferred` | close | Existing beta.10 OIDC publish plus shared canary OIDC path supersede the stale claim. |
| `ISSUE-167-PROD-JSR-SCAFFOLD-E2E` | no change | Requires a real green canary E2E run after merge. |

## Commit Slices

1. Harness bootstrap and approved release design — PLAN-EVAL; files under this run directory.
2. Shared cut preparation and canary version/cut command — focused `cut`/`canary` tests including version-collision negatives; `deno.json`, `cut.ts`, new shared helper, `canary.ts`, tests, run artifacts.
3. Composed publish readiness — focused readiness/preflight tests with seeded publish-set, new-package README, provisioning, lockstep/versionless, and preflight failures; readiness code/tests plus narrowly refactored reusable validation helpers and run artifacts.
4. Canary workflow and enforced green-pair lookup — YAML parse, workflow contract tests/manual structure, GitHub release/token resolver tests; workflows, `github-release.ts`, agentic token helper/tests, run artifacts.
5. Mandatory canary-first doctrine — skill regeneration/check and relevant debt update; release skill source/mirror, debt, run artifacts.
6. Final gate evidence and evaluator handoff — full release tests, touched-TS checks, YAML sanity, skill sync, changed-file quality scan, then separate IMPL-EVAL; run artifacts and PR phase trail.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | release unit suite | `deno test --allow-all .llm/tools/release/` | all existing + new pass; every new check has witnessed red |
| 2 | agentic token tests | focused `agentic-lib_test.ts` selection/full file | hosts fallback parses and never logs a secret |
| 3 | touched TS type check | scoped `.llm/tools/run-deno-check.ts` with `--unstable-kv` where applicable | exit 0 |
| 4 | touched TS lint/fmt | scoped wrapper invocations over owned tool roots | exit 0 |
| 5 | YAML structural sanity | Ruby/Python-free safe YAML parse plus workflow contract assertions | exit 0 |
| 6 | skill mirror | `deno task agentic:sync-claude` then `deno task agentic:sync-claude:check` | regenerated and clean |
| 7 | changed-file quality | `deno task quality:scan --pretty <changed TS files>` | exit 0, no suppressions |
| 8 | GitHub surface | explicit-refspec push, draft PR body/labels/milestone, per-slice comments | correct and live |
| 9 | IMPL-EVAL | separate Qwen formal evaluator session | `PASS` |

## Dependencies

- PR #810 must land before this PR is merge-ready so the called preflight includes its import-attribute check and sunset criterion.
- JSR registry metadata and management APIs; GitHub Actions/workflow-dispatch/status APIs.
- Existing repository secret `JSR_API_TOKEN` needs package-edit permission for newly detected packages; OIDC remains the publish credential.

## Deferred Scope

- Live canary execution, repository setting changes, environment protection configuration, and JSR scope grants are OWNER actions after merge.

## Drift Watch

- Record any #810 interface change, JSR/GitHub API response mismatch, version file outside the shared bump set, inability to correlate downstream workflow runs, or required permission unavailable to `GITHUB_TOKEN`.
