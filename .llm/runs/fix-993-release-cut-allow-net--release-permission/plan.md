# Plan: make release-cut net permission failures truthful

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-993-release-cut-allow-net--release-permission` |
| Branch | `fix/993-release-cut-allow-net` |
| Phase | `plan` |
| Target | repository release/agentic tooling |
| Archetype | `6 - CLI / Tooling` (gate-selection analogue; no package surface changes) |
| Scope overlays | none |

## Archetype

Archetype 6 is the closest operational profile because `release:cut` is a user-run command flow. Its package folder-shape rules are not applicable to `.llm/tools`; the scoped acceptance commands and consumer checks are the proportional gates.

## Current Doctrine Verdict

N/A. The doctrine verdict table governs `packages/*` and `plugins/*`; neither is touched.

## Goal

Grant `release:cut` the exact GitHub API host permission it needs, and preserve the distinction between a process permission failure and a genuine rejected credential.

## Scope

- Add `--allow-net=api.github.com` to the root `release:cut` task.
- Make `validateGithubToken` rethrow a missing-net `NotCapable` failure with an actionable flag-bearing message.
- Add focused regression tests for permission-failure and genuine-401 behavior.
- Check every named resolver/request consumer through the scoped `.llm/tools` type-check.

## Non-Scope

- No `packages/` or `plugins/` changes.
- No full release cut, publication, scaffold E2E, or release workflow execution.
- No bare `--allow-net` broadening and no unrelated `--allow-run` changes to agentic GitHub tasks.

## Hidden Scope

- `gh-token.ts` directly calls `validateGithubToken`; a permission exception must remain intelligible there.
- The invalid-token path must still return `null` so resolver diagnostics retain `(401)` and `gh auth login`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Rethrow only a `Deno.errors.NotCapable` whose text identifies missing net access to `api.github.com`, wrapping it in a message naming `--allow-net=api.github.com` and retaining the original error text. | Fails on the first candidate without misclassifying a future non-net capability error, while preserving existing handling for HTTP/network failures. |
| D2 | Keep the public return type `Promise<string \| null>`. | Successful and genuine-auth-failure consumers keep their existing contract. |
| D3 | Extract and export a pure missing-net predicate and message builder, then hermetically test classification plus the rendered `release:cut could not create the release PR: ...` line. Keep the real-token request as supervisor-run acceptance evidence only. | Deterministically proves the flag-bearing/no-401/no-auth-advice contract without adding subprocess or network dependencies to the 63-test unit suite. |
| D4 | Host-scope the task permission to `api.github.com`. | Matches the centralized endpoint and least-privilege requirement. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Error detection strategy | resolved now | `instanceof Deno.errors.NotCapable`; no open implementation choice remains. |
| Task snapshot update | safe to defer / N/A | No focused task-surface snapshot was found; direct task-line evidence is required instead. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Catching all `NotCapable` errors could mislabel a future non-net permission failure inside the request path. | Message includes the original error and the exact currently required net flag; scope remains the single `githubRequest` call. |
| A committed live-network test would regress the hermetic agentic library suite. | Unit-test pure classification/rendering only; keep the exact-flags real-token request as separately recorded acceptance evidence. |
| A consumer assumes `validateGithubToken` never throws. | Run the scoped `.llm/tools` check covering every listed consumer and inspect the direct `gh-token.ts` call. |
| Full release cut is destructive. | Do not run it; use exact-flag direct probes and task-line inspection. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-6 process/environment concern hidden as domain failure | existing risk | distinguish missing Deno capability from invalid authentication without adding new abstractions. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Static scoped check | yes | requested `.llm/tools` check wrapper exits 0 |
| Focused lint | yes | requested two-file `deno lint` exits 0 |
| Focused regression test | yes | permission message has flag/no auth advice; invalid token retains `(401)` path |
| Runtime permission probe | yes | real token resolves under exact release-cut flags |
| Release/scaffold gates | no | destructive or unrelated to this tooling-only fix |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| none | none | No package/plugin doctrine debt is introduced or deepened. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | check | `deno run -A .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | exit 0 |
| 2 | lint | `deno lint .llm/tools/agentic/lib/agentic-lib.ts .llm/tools/release/cut.ts` | exit 0 |
| 3 | tests | `deno test --allow-read --allow-env --allow-net=api.github.com .llm/tools/agentic/lib/agentic-lib_test.ts` | exit 0; hermetic classification and rendered-line regressions pass without using the granted network capability |
| 4 | task surface | `deno task --quiet 2>&1 \| grep -n "release:cut"` | host-scoped net flag visible |
| 5 | acceptance probe | direct `validateGithubToken` probe under exact `release:cut` flags | prints authenticated login; recorded in `worklog.md`, not committed as a network test |

## Dependencies

- Live GitHub API and the already-authenticated token from `gh auth token` for acceptance probes/tests.

## Drift Watch

- Any different error shape, endpoint host, task snapshot, or consumer contract discovered during implementation must be appended to `drift.md` and may require re-evaluation.
