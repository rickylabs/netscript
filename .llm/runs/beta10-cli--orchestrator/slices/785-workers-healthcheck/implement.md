use harness

## SKILL

- netscript-harness — you are a Tier-D implementation slice inside a harness run; keep worklog/drift current
- netscript-cli — scaffold/plugin/E2E command surface; the failing gate is a CLI E2E behavior gate
- netscript-doctrine — plugins/workers is framework code; identify archetype + gates before changing it
- netscript-tools — scoped validation wrappers, rtk, gate-evidence rules
- netscript-deno-toolchain — deno doc/why before broad reads
- rtk — prefix read-heavy git/grep with rtk
- netscript-pr — branch/PR/labels/comment conventions

## Slice: fix #785 — scaffolded workers `health-check` job fails with `error: "Not Found"`

Branch: `fix/785-workers-healthcheck` (worktree `/home/codex/repos/b10-785-workers`, based on
`feat/beta10-integration` @ bab5425b). Target PR base: `feat/beta10-integration`.

### Problem (reproduced twice, 2026-07-16, native WSL)

`deno task e2e:cli run scaffold.runtime --cleanup` → 42 passed / 1 failed:
`behavior.workers-executions`. The trigger gate passes (`POST .../jobs/health-check/trigger` via
workers-api), an execution record is created, then the handler terminally fails in ~350–460ms:

```json
{"jobId":"health-check","topic":"default","status":"failed","triggeredBy":"api","error":"Not Found","attempt":0,"maxAttempts":3}
```

Read issue #785 for full context (attribution table, prior art #376 — the beta.3 health-check
entrypoint-resolution failure class).

### Task

1. Reproduce: scaffold via the E2E suite (or `deno task e2e:cli gates scaffold.runtime` subset) and
   capture the workers processor logs for the health-check execution to see what returns "Not Found"
   (HTTP endpoint the job calls? entrypoint resolution? registry lookup?).
2. Root-cause and fix in the framework source (likely `plugins/workers/**` or the scaffold
   generator in `packages/cli/**`), not in the test. State the root cause explicitly in the PR.
3. Add a regression test at the failing layer.
4. Gates: this touches `packages/**`/`plugins/**` → run `deno task quality:gate` (or
   `quality:scan` + `arch:check` + scoped check/lint wrappers) and the full
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — the acceptance is
   `behavior.workers-executions` green with everything else still green.

### Constraints

- Contract first; wrap upstream APIs; no `any`/`as unknown as`/new lint suppressions.
- Do not delete lock files/caches; no `deno cache --reload`.
- Commit by slice; push branch `fix/785-workers-healthcheck` to origin (explicit refspec, never
  push to main); open a PR to `feat/beta10-integration` with body containing `Closes #785`, labels
  `type:fix, area:plugins, area:cli, priority:p1, wave:v1, status:impl-eval`, milestone
  `0.0.1-beta.10`.
- Report progress in commit messages + PR body; you do not self-certify — a separate opposite-family
  session reviews your work.
