# Plan

## Profile

- Archetype: 6 — CLI / Tooling, because the owned surface is the CLI E2E command builder.
- Overlays: docs (the suite README receives a narrow behavioral clarification).
- Doctrine verdict: existing CLI remediation remains in progress; this slice introduces no new
  architecture or public surface.
- In-scope anti-patterns: AP-4/AP-5 (keep the policy in the existing command builder, with no new
  abstraction or hidden global state).

## Locked decisions

1. Place `--minimum-dependency-age=0` in the direct published AI `deno x` command immediately after
   `-A`, matching existing suite conventions and Deno global-option placement.
2. Strengthen the existing published-lifecycle unit test to assert the complete command array.
3. Document that this is a release-harness exception for same-age lockstep artifacts.
4. Do not alter shipped CLI shell-outs; record exact call sites in the PR follow-up section.

## Open-decision sweep

- Safe to defer: the user-facing CLI policy for fresh releases; it needs a separate security/DX
  decision and does not affect the release harness fix.
- No decision that would force rework in this bounded slice remains open.

## Slice

1. **S1: release-day published-JSR commands are age-unblocked.** Change
   `plugin-install-gates.ts`, `scaffold-gates_test.ts`, `packages/cli/e2e/README.md`, and the run
   artifacts. Prove with the focused builder test, scoped check, and changed-file quality scan.

## Gates

- Focused `scaffold-gates_test.ts`.
- Scoped Deno check over `packages/cli/e2e` with `--unstable-kv`.
- Changed-file `quality:scan` as requested; `arch:check` because `packages/**` is touched.
- Scoped format/lint if required by changed-file quality evidence.

## Risks

- Flag placement could be parsed as script args: mitigate with a full-array unit assertion.
- Sweep could over-apply the override to local files: mitigate by limiting it to published
  `jsr:@netscript/*` targets.
- Docs could imply users should universally disable the guard: explicitly scope the exception to
  release E2E.

## Deferred scope

- Shipped CLI `deno x` and generated MCP command behavior.
- Full production E2E execution; the requested gates are builder/check/quality, with CI validating
  the release workflow.

