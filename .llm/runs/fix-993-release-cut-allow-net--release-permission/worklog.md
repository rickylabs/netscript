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

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Rethrow `NotCapable` from token validation | A missing process permission cannot be repaired by trying more credentials. | reproduction + plan D1 |

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
| requested check | pending implementation | NOT_RUN | |
| requested lint | pending implementation | NOT_RUN | |
| requested tests | pending implementation | NOT_RUN | |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| proportional Archetype-6 review | PENDING_SCRIPT | focused diff review after implementation | `.llm/tools` is outside package fitness scanner scope. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| exact-flags authenticated probe | NOT_RUN | pending implementation | Must run after task fix. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| named resolver/request consumers | NOT_RUN | scoped `.llm/tools` check | pending implementation |

## Handoff Notes

- PLAN-EVAL should inspect D1/D3, the destructive-release non-scope, and whether the proposed tests prove both acceptance paths.

