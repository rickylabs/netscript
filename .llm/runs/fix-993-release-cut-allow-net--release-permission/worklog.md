# Worklog: release-cut permission diagnosis

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-993-release-cut-allow-net--release-permission` |
| Branch | `fix/993-release-cut-allow-net` |
| Archetype | `6 - CLI / Tooling` analogue |
| Scope overlays | none |

## Design

### Public Surface

- `validateGithubToken(token): Promise<string | null>` — retains login/null behavior but throws an actionable process-capability error when GitHub cannot be reached because net permission is absent.
- Root `release:cut` task — grants the exact GitHub API host permission required by the command flow.

### Domain Vocabulary

- missing-net permission — a process-wide Deno capability failure, distinct from credential rejection.
- invalid token — an HTTP authentication failure that remains represented as `null` by validation and `(401)` by resolver diagnostics.

### Ports

- GitHub REST request boundary (`githubRequest`) — existing boundary; no new port is needed.

### Constants

- `--allow-net=api.github.com` — exact operator remedy, kept as a local diagnostic string to avoid expanding volatile endpoint configuration scope.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bootstrap research and locked plan for #993 | separate PLAN-EVAL | `.llm/runs/fix-993-release-cut-allow-net--release-permission/*` |
| 2 | Make release-cut permission and token diagnostics truthful | requested check/lint/test/task-line commands plus exact-flags live probe | `deno.json`, `.llm/tools/agentic/lib/agentic-lib.ts`, `.llm/tools/agentic/lib/agentic-lib_test.ts`, run artifacts |

### Deferred Scope

- Agentic GitHub task `--allow-run` degradation — separate issue and explicitly excluded.
- Full release cut and scaffold runtime E2E — destructive or unrelated.

### Contributor Path

Start at the root `release:cut` task, follow `cut.ts` into `resolveGithubToken`, and keep process-capability errors distinct from HTTP authentication results in `agentic-lib.ts`; extend the focused unit test for any new classification.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-01T21:21:17+02:00 | 1 | research | Clean requested branch/baseline confirmed; reproduction and consumer/task audit matched the issue lead. |
| 2026-08-01T21:31:00+02:00 | 1 | PLAN-EVAL response | Independent evaluator returned FAIL on D3: replaced subprocess/live-network committed test design with pure classification/message helpers and rendered-line assertions. |
| 2026-08-01T21:45:00+02:00 | 2 | implementation | Added the host-scoped task permission, narrowed missing-net classification, preserved genuine-auth formatting, and added two hermetic regression tests. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Rethrow `NotCapable` from token validation | A missing process permission cannot be repaired by trying more credentials. | reproduction + plan D1 |
| Require both `NotCapable` and a GitHub-host net-access message | Avoid misclassifying future non-net capability failures. | independent PLAN-EVAL finding C + revised D1 |
| Test pure classification and operator rendering hermetically | The focused suite must not acquire subprocess or GitHub egress dependencies. | independent PLAN-EVAL finding A/B + revised D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| none | minor | N/A |

## Gate Results

### Runtime research evidence

```text
validateGithubToken without net permission -> null
validateGithubToken with --allow-net=api.github.com -> rickylabs
githubRequest without net permission:
true
NotCapable
Requires net access to "api.github.com:443", run again with the --allow-net flag
```

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| requested check | `deno run -A .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | PASS | Exit 0; stdout/stderr empty. |
| literal requested lint | `deno lint .llm/tools/agentic/lib/agentic-lib.ts .llm/tools/release/cut.ts` | FAIL | Literal output: `error: No target files found.` Root config excludes `.llm/`; this is not a code verdict. |
| supplemental focused lint | `deno lint --no-config .llm/tools/agentic/lib/agentic-lib.ts .llm/tools/release/cut.ts` | PASS | Literal output: `Checked 2 files` |
| authoritative scoped lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/agentic/lib/agentic-lib.ts --file .llm/tools/release/cut.ts --pretty` | PASS | Selected 2 files / 1 batch; exit 0; 0 occurrences. |
| requested tests | `deno test --allow-read --allow-env --allow-net=api.github.com .llm/tools/agentic/lib/agentic-lib_test.ts` | PASS | `running 65 tests`; `ok | 65 passed | 0 failed (211ms)` |
| task listing | `deno task --quiet 2>&1 | grep -n "release:cut"` | PASS | Literal output: `116:- release:cut` |
| task definition | `grep -n '"release:cut"' deno.json` | PASS | Line 97 includes `--allow-net=api.github.com`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| proportional Archetype-6 review | PASS | independent harness slice-review session | Verified exact permission scope, first-candidate abort before `(401)`, preserved genuine-auth path, hermetic tests, consumer check, and four-file implementation scope; no findings. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| exact-flags authenticated probe | PASS | `rickylabs` | Real `gh auth token`; exact updated release-cut read/write/run/env/net flag set. |
| missing-permission operator probe | PASS | `release:cut could not create the release PR: Cannot reach api.github.com: missing --allow-net=api.github.com. Requires net access to "api.github.com:443", run again with the --allow-net flag` | Contains no `401` and no `gh auth login`; no credential was printed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| named resolver/request consumers | PASS | scoped `.llm/tools` check exited 0 | Shared return contract remains `string | null`; only the classified permission failure throws. |

## Handoff Notes

- PLAN-EVAL should inspect D1/D3, the destructive-release non-scope, and whether the proposed tests prove both acceptance paths.
