# IMPL-EVAL Addendum: Post-eval CI repair for PR #1232

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `feat-openapi-mcp-activation-s9--1135`                   |
| Addendum scope | `f6c8d0a7f..7891c5e70` (1 commit: `test(cli): derive migration target release`) |
| Files changed  | 2 (`init-agent_test.ts`, `worklog.md`)                   |
| Evaluator      | `open-model evaluator (Qwen 3.7 Max) / 2026-08-04`      |

## Repair Summary

The version-drift guard flagged the S-18 test's literal `jsr:@netscript/cli@0.0.5` pin as a
stale-on-bump risk. The repair replaces the hardcoded migration-target specifier with a value
derived at test time from `NETSCRIPT_RELEASE_VERSION`:

```ts
const MIGRATION_TARGET_SPECIFIER =
  `jsr:@netscript/cli@${format(increment(parse(NETSCRIPT_RELEASE_VERSION), "patch", {}))}`;
```

The prior-release JSON fixtures are untouched. The prior-version assertion switches from
`assertStringIncludes` on the literal `0.0.4` to a structural check: the prior specifier must
match the `jsr:@netscript/cli@<semver>` pattern and must not equal the derived migration target.

## Verification

| Check                                    | Result | Evidence                                                                                             |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Prior-release fixture byte-exact         | PASS   | `git diff f6c8d0a7f..7891c5e70 -- fixtures/prior-release.mcp.json fixtures/prior-release-tools.json` — empty diff; both files unchanged |
| Target derived from NETSCRIPT_RELEASE_VERSION | PASS | `MIGRATION_TARGET_SPECIFIER` uses `format(increment(parse(NETSCRIPT_RELEASE_VERSION), "patch", {}))`; `NETSCRIPT_RELEASE_VERSION` re-exports `CLI_PACKAGE_VERSION` from `publish-assets.generated.ts`, sourced from `deno.json` `"version": "0.0.4"` — current target resolves to `0.0.5` |
| S-18 causal path preserved               | PASS   | Test structure unchanged: read prior fixture → assert prior specifier matches semver pattern and `!== MIGRATION_TARGET_SPECIFIER` → assert prior tools exclude triad → `initAgent` rewrites `args[4]` to target → simulated restart lists 21 tools including triad |
| Version-drift guard satisfied            | PASS   | When `deno.json` version bumps to X, target auto-advances to X+1 patch; prior fixture stays `0.0.4`; the `prior !== target` invariant holds for any X ≠ `0.0.4` (guaranteed post-bump) |
| Test count                               | PASS   | Recorded: guard + agent-init suites, 17 passed, 0 failed                                             |
| No other files modified                  | PASS   | `git diff --stat f6c8d0a7f..7891c5e70` — only `init-agent_test.ts` (+7/-5) and `worklog.md` (+11/-4) |

## Impact on Prior Verdict

No finding from `evaluate.md` is affected. The repair:

- Does not alter any source file, only the test's migration-target constant and one assertion shape.
- Does not change the fixture bytes that the consumer gates depend on.
- Does not introduce new ignores, casts, or dependencies (imports `@std/semver` `format`/`increment`/`parse` and `@std/assert` `assertMatch`, both already in the workspace).
- Strengthens the test against future version bumps — the exact failure mode the version-drift guard exists to catch.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The post-eval CI repair is minimal, correct, and preserves all evidence chains from the original evaluation. The prior-release JSON fixture is byte-exact unchanged. The migration target is now derived from the canonical `NETSCRIPT_RELEASE_VERSION` constant, satisfying the version-drift guard. The S-18 causal path (prior pin → agent-init rewrite → host restart exposes 21 tools including the OpenAPI triad) is structurally preserved. All 17 tests pass. No other files were modified. |
