# IMPL-EVAL — fix-993-release-cut-allow-net--release-permission

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- PR: #1037 · branch `fix/993-release-cut-allow-net` · base `main` @ `3ab64720f`
- Commits inspected: `043ad76a7` (plan), `d5f1d1cc8` (plan correction), `757821bd1` (implementation)
- Pushed tip `757821bd1b774f5ccfc1126b93c02f6797cc9808` == local HEAD (verified via `git ls-remote`)

All gates below were re-run by the evaluator in the worktree. Exit codes were captured directly, not
through a pipe — one lint invocation initially reported a false `0` inherited from `tail`, and was
re-run to get the real status.

## Diff actually reviewed

| File | Change |
| --- | --- |
| `deno.json:97` | `release:cut` gains `--allow-net=api.github.com` (host-scoped, not bare `--allow-net`). |
| `agentic-lib.ts` | `validateGithubToken` rethrows a missing-net `NotCapable` with a flag-bearing message; adds pure exported `isMissingGithubNetPermission`, `buildMissingGithubNetPermissionMessage`, `formatGithubTokenAttempt`, `buildGithubTokenResolutionError`, `GITHUB_NET_PERMISSION_FLAG`. Host derived from `GITHUB_API_BASE_URL`, not hardcoded. |
| `cut.ts` | Extracts `formatReleasePrCreationError` so the operator-facing line is assertable; behaviour unchanged. |
| `agentic-lib_test.ts` | Two hermetic tests: permission classification + rendered operator line; genuine-401 regression. |

## Plan-eval findings — disposition

| Finding | Status | Evidence |
| --- | --- | --- |
| A (blocking) — test could not run under its own gate; would make a hermetic 63-test suite need GitHub egress | **RESOLVED** | D3 was rewritten (`drift.md`, severity *significant*). The suite now passes with **no `--allow-net` and no `--allow-run` at all**: `deno test --allow-read --allow-env … → ok, 65 passed, 0 failed`. That is a stronger result than asked for — hermeticity is proven, not merely claimed. |
| B — assert the rendered operator line, and absence of any `(401)` | **RESOLVED** | Test asserts the `release:cut could not create the release PR:` line names the flag and excludes both `401` and `gh auth login`; confirmed live below. |
| C — narrow `NotCapable` blast radius | **RESOLVED** | `isMissingGithubNetPermission` requires `NotCapable` **and** `Requires net access` **and** the API host; negative cases (a read-permission `NotCapable`, a plain `Error`) are asserted. Original error text is preserved in the message. |

## Gates (evaluator-run, real exit codes)

| Gate | Command | Result |
| --- | --- | --- |
| Scoped check | `deno run -A .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | exit 0 — 194 files, 2 batches, 0 failed, 0 occurrences. Covers all seven resolver/request consumers. |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/lib --ext ts` | exit 0 — 2 files, 0 diagnostics. (Raw `deno lint` on `.llm/**` reports "No target files found" because the root config excludes `.llm/`; the PR body discloses this rather than passing it off as a pass.) |
| Unit tests (hermetic) | `deno test --allow-read --allow-env .llm/tools/agentic/lib/agentic-lib_test.ts` | exit 0 — **65 passed, 0 failed**, no net, no run. |
| Release-side tests | `deno test … cut_test.ts github-release_test.ts verify-canary-pair_test.ts` | exit 0 — 22 passed, 0 failed. |
| Scaffold runtime E2E | not run | Correctly skipped: no scaffold, plugin, DB or Aspire output is touched. |

## Acceptance (the issue's boxes)

**Box 1 — `deno task release:cut -- <version>` opens the release PR without manual `gh pr create`.** MET.
A literal cut is destructive (version bump, commit, branch push, real PR) and was deliberately not run.
Evidence is the full causal chain instead: the only failing step was token validation, and under
*exactly* the updated flag set —

```
$ deno run --allow-read --allow-write --allow-run --allow-env --allow-net=api.github.com …
validateGithubToken -> rickylabs
resolved source -> gh:windows (rickylabs)
```

PR creation `POST /repos/rickylabs/netscript/pulls` goes to the same `api.github.com` host already
granted, so no second permission is outstanding.

**Box 2 — a genuine permission failure reports the missing flag, not `(401)` and not `gh auth login`.** MET.
Under the *old* flag set, what the operator now sees:

```
release:cut could not create the release PR: Cannot reach api.github.com: missing
--allow-net=api.github.com. Requires net access to "api.github.com:443", run again with the --allow-net flag
contains 401? false | contains "gh auth login"? false | names flag? true
```

It also fails on the *first* candidate, so the four identical bogus `(401)` lines are gone. The
genuine-rejection path still yields `env:GH_TOKEN (401)` and the `gh auth login` remedy.

## Residual risk

`validateGithubToken` can now throw where it previously returned `null`. Confined to the missing-net
case, which is the fix itself. All seven consumers type-check, and every task that reaches this code
(`agentic:gh-pr`, `gh-watch`, `gh-token`, `dispatch-openhands`, `release:publish`,
`release:verify-canary-pair`) already carries `--allow-net`, so none changes behaviour.

## Verdict

`PASS` — ready for merge.
