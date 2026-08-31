# IMPL-EVAL — #1371 / PR #1728

PASS_IMPL

- **Evaluated head:** `68482a13adf13c9e53bf49d335bd361305a284de` (`fix/aspire-declared-reference-fail-fast`)
- **Base:** `3b32d1628584749af4dd6e97fd331c24e84f0b9e`
- **Evaluator:** independent opposite-family session (Claude Fable 5, background job `2e81752d`), worktree `/home/codex/repos/netscript-007-eval-1371`. Did not author or modify the implementation.
- **Date:** 2026-08-30

## Head-equality assertion

| Source | SHA |
| --- | --- |
| `git rev-parse HEAD` | `68482a13adf13c9e53bf49d335bd361305a284de` |
| `git ls-remote origin refs/heads/fix/aspire-declared-reference-fail-fast` | `68482a13adf13c9e53bf49d335bd361305a284de` |
| PR #1728 `head.sha` (GitHub API) | `68482a13adf13c9e53bf49d335bd361305a284de` |
| Brief | `68482a13adf13c9e53bf49d335bd361305a284de` |

All four equal. Verdict is bound to this head.

## Contract checks (executed)

| # | Check | Command / method | Result |
| --- | --- | --- | --- |
| 1 | Scope | `git diff --name-only 3b32d1628...HEAD` | 8 paths: the 2 contracted code files + 6 run artifacts under `.llm/runs/fix-aspire-declared-reference-fail-fast--1371/`. No lock, cache, or workflow churn. `git diff --diff-filter=DM -- '*_test.ts'` empty → no pre-existing test modified or deleted (the test file is new, `A`). |
| 2 | RED-first is real | detached worktree at `099370709`; `deno test --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts` | **exit 1**: 3 passed / 5 failed steps (4 negative cases `Expected function to reject` + preflight-order assertion). Worklog's "3/6" counts the suite aggregate via the wrapper; same failures. |
| 2b | Focused suite at head | same command at `68482a13a` | exit 0, 1 passed (8 steps), 0 failed |
| 3 | Throw precedes registration | emitted module written to temp dir with builder/resource doubles and executed (`$CLAUDE_JOB_DIR/tmp/probe.ts`, same harness as the committed test) | missing plugin ref → rejects with configuration error; `builder.registrations === []`; no map returned, so the processor is absent. Committed test asserts the same for all four negative cases. |
| 4 | Both kinds, both failure modes | committed test cases ×4 (missing service, missing plugin, unresolvable service endpoint, unresolvable plugin endpoint) | all four reject with exact-equal messages; exit 0 at head, exit 1 at RED commit |
| 5 | Determinism | `gen(P) === gen(P)` on identical inputs (probe) | `true`. Message is built from `name`/`kind`/`ref` only and emitted through `JSON.stringify`; no timestamps, ordering, or identity. |
| 6 | Key shape | probe + committed test `pins the raw hyphenated emitted key…` | emitted `withEnvironment('services__workers-api__http__0', …)` verbatim; `packages/sdk/src/discovery/service-url.ts:60` builds `services__${serviceName}__${protocol}__${index}` — matches. `services__workers_api__http__0` asserted absent for a hyphenated name. |
| 7 | Positive paths | committed tests (service, plugin) + probe | env var set to the resolved endpoint; processor registered and returned in the map |
| 8 | Identifier collisions | probe: `ServiceReferences: ['workers-api','workers-api','workers_api']`, `PluginReferences: ['workers-api','workers_api']` | emitted identifiers `workers_apiServiceEndpoint0/1/2`, `workers_apiPluginEndpoint0/1` — all distinct; module executed successfully (`deno run --check=none`), all 5 env bindings recorded with correct per-kind endpoint values |

## Gates at head (executed)

| Gate | Command | Exit | Evidence |
| --- | --- | --- | --- |
| focused suite | `deno test --allow-all …/generate-register-background_test.ts` | 0 | 1 passed (8 steps), 0 failed |
| `deno task check` | wrapper | 0 | 2,926 files, 25 batches, 0 failed batches, 0 findings |
| `deno task test` | wrapper | 0 | passed 4242, failed 0, ignored 19, total 4261 |
| `deno task lint` | wrapper | 0 | — |
| `deno task fmt:check` | wrapper | 0 | — |
| `deno task quality:scan` | | 0 | `ok:true`, **`allowCount: 7`** |
| `deno task arch:check` | | 0 | WARN-only (existing `export default` / doctrine baseline), no FAIL |
| `deno task check:assets-barrel` | | 0 | regeneration produced no diff |
| CLI publish dry run | `cd packages/cli && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; 6× `unanalyzable-dynamic-import` + 1× `unanalyzable-import-meta-resolve` (baseline) |
| per-member CLI JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text` | 0 | 19 WARN / 0 FAIL: 3× F-DOCT-4 `helpers` vocabulary, 15× F-DOCT-5 cardinality, 1× F-JSR-7 slow-types banner. Baseline; none attributable to this diff. |

Runtime gates (`scaffold.runtime`, `e2e:cli`, Aspire, Docker, browser): **not run** — no runtime lease; Docker and Aspire left untouched.

## Findings

None blocking. No contract clause is violated at this head.

## Observations (out of envelope / pre-existing — not findings)

1. **Reference names containing `'`, `\`, or `` ` `` produce unparseable emitted source.** Reproduced with probe: `ServiceReferences: ["it's"]` → `SyntaxError: Expected ')'`; `"back\\slash"` → `Expected unicode escape`. This is **pre-existing at base** (`3b32d1628` emits `_services.get('it's')` and the identifier `it'sEndpoint`), applies equally to the processor name in `addExecutable('${name}'`, and the schema is `z.array(z.string())` (`packages/aspire/config.ts:466`) with no pattern. The new code escapes the *message* (`JSON.stringify`) but interpolates `'${ref}'` raw into `_services.get(…)` and the env key exactly as base did. Not introduced by this PR; not in the admitted contract; report for a follow-up hardening issue (name-pattern validation at config parse or `JSON.stringify` on every emitted literal).
2. **PR body under-discloses the JSR audit WARN baseline** ("four existing WARN-only findings"); the actual run and the worklog both report 19 WARN. Cosmetic; worklog is correct.
3. RED receipt count: PR/worklog say "3 passed, 6 failed" (wrapper counts the suite aggregate); raw `deno test` shows 3/5 steps. Same failing cases; not a discrepancy of substance.

## Verdict

PASS_IMPL
