# Worklog — quality/q754-tail

## Identity

- Issue: #754 (baseline-green epic #746)
- Worktree: `/home/codex/repos/ns-q754-tail`
- Branch: `quality/q754-tail`
- Baseline: `3b3d615bb535d985e49a4d2dcdcce5e03097babc`
- Session: WSL Codex, beta-9 orchestrator `09e5ae68`
- PLAN-EVAL: owner-waived in the slice brief

## Design and short plan

This is a bounded quality remediation over existing package surfaces. The selected archetypes remain
those of the seven packages; no package shape, export map, or runtime behavior is intentionally
changed. The relevant doctrine constraints are A1/A2/A14 and F-5/F-6/F-19. Fresh UI also carries
the frontend overlay. JSR risk is limited to declaration soundness and oRPC private/invariant types;
publish dry-runs and full-export doc lint are required per package.

1. Re-baseline the scanner and classify each finding as a concrete local type, an `unknown` boundary
   requiring narrowing, a comment-only lexical hit, or a genuinely irreducible upstream invariant.
2. Replace findings package by package without lint suppressions or behavior changes; use a specific
   `quality-allow` only when upstream typing makes a cast irreducible.
3. Re-run the scoped scanner, wrapper check/lint/fmt, package tests, doc lint, and package-local JSR
   publish dry-runs. Verify `deno.lock` is unchanged.
4. Review the complete diff, record exact evidence here, commit the fixes plus worklog, and push the
   mandated branch ref. No PR is opened.

Risks: event variance in Preact/Fresh, oRPC private generic types, and dynamic OpenTelemetry module
shapes. Mitigation: derive types from upstream public signatures where possible, otherwise narrow
from `unknown`; prove unchanged behavior with existing tests and package publish gates.

Deferred scope: pre-existing findings outside the seven named roots and unrelated architecture or
documentation debt. No new debt is planned.

## Baseline inventory

- Scanner: FAIL, 16 findings, 0 allowances.
- Roots with findings: telemetry (6), sdk (2), fresh-ui (3), aspire (1), bench (1),
  plugin-ai-core (1), plugin-auth-core (1).

## Implementation

- Replaced telemetry's dynamic SDK `Record<string, any>` with minimal structural module contracts
  and a generic lazy loader; replaced oRPC interceptor `any` boundaries with `unknown` and a local
  options shape. Removed all three blanket `deno-lint-ignore no-explicit-any` comments.
- Preserved six irreducible Preact/oRPC invariant casts with concrete inline `quality-allow`
  reasons (fresh-ui 3, sdk 1, plugin-ai-core 1, plugin-auth-core 1).
- Reworded three comment-only lexical findings in aspire, bench, and sdk.
- Added `--allow-read` to the Fresh UI package test task because an existing source-inspection test
  requires it; the original task failed 1 of 133 tests solely on missing permission.
- No public export map or runtime behavior changed.

## Validation

- Code-quality scanner: PASS, 0 findings, 6 reasoned allowances across all seven requested roots.
- Scoped wrappers (`run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`, `--ext ts,tsx`):
  PASS with 0 findings for telemetry, sdk, fresh-ui, aspire, bench, plugin-ai-core, and
  plugin-auth-core.
- Package tests: PASS — telemetry 51, sdk 15, fresh-ui 133, aspire 18 tests/58 steps, bench 22,
  plugin-ai-core 2, plugin-auth-core 27.
- `deno publish --dry-run --allow-dirty`: PASS without `--allow-slow-types` for telemetry, sdk,
  fresh-ui, aspire, plugin-ai-core, and plugin-auth-core. Bench is intentionally non-publishable
  (`"publish": false`), so the publish command is N/A and rejects by design.
- `deno task doc:lint --root <pkg> --pretty`: recorded for all seven roots. Aspire reports 0
  combined errors. Pre-existing combined doc/private-type diagnostics remain: telemetry 7, sdk 1,
  fresh-ui 123, bench 118, plugin-ai-core 2, plugin-auth-core 2. These are outside the scanner slice
  and were not changed or represented as green.
- `deno task arch:check`: exit 0; warnings are pre-existing doctrine/catalog warnings.
- Lock hygiene: generated Fresh UI lock churn was removed; no `deno.lock` is modified.
