# e2e:cli durable receipt
head: 50710a44af3038fffae9b2adb38d3fc2c2d8f9af
command: deno task e2e:cli   (bare, cleanup enabled)
worktree: /home/agent/projects/netscript/worktrees/007-leaf-1462
started: 2026-08-30T14:00:50Z
exitCode: 1
finished: 2026-08-30T14:03:02Z

## Classification: BASELINE-BLOCKED — not waived, not retried

| Field | Value |
| --- | --- |
| Gates run | **27** |
| Failures | **1** |
| Sole failing gate | `generated.quality-negative` — "Prove every generated quality surface with deliberate failures" |
| Exact error | `TS2345: 'DehydratedState' is not assignable to parameter of type 'Partial<DehydratedState>'` |
| Location | generated project's `packages/fresh/src/application/query/hydration.ts:43` |
| Owning issue | **#1734** — OPEN, `status:impl`, `area:fresh`, `priority:p1`; fix PR **#1736** OPEN (draft) — **internals lane** |

### Attribution, measured not asserted

- This leaf changes **0** files under `packages/fresh/src/application/` and **0** changes to
  `hydration.ts` versus `origin/main@3e5cbabf`.
- Its only `packages/fresh` edits are `src/runtime/server/define-fresh-app.ts` and its test.
- The failing file's last commit is `4d438ce1` (beta.10 wave), long predating this branch.

So the failure is a **pre-existing baseline defect owned by another lane**, reproducible independent of
this leaf. It is recorded exactly as it occurred. **No retry, no waiver, no reword.**

### Everything else passed, including the gates that matter for this leaf

All 26 other gates passed — notably `runtime.aspire-restore`, `behavior.plugin-doctor-missing-module`,
the plugin install/registry generation gates, and the scaffold/UI gates. **No AppHost and no container
was started**, so the failure is a type-check on generated sources rather than a runtime fault.

### Resource proof after the run

| Check | Result |
| --- | --- |
| `agentic:leak-check` | `survivors: []`; `probes.aspire` **ok**; `probes.docker` **ok** |
| `docker ps -a` | **0** |
| `docker volume ls` | **0** |
| `aspire ps` | no running AppHost |
| Owned scratch removed | `.llm/tmp/cli-e2e` (**612 MB**, 2 project trees + 2 logs) deleted |

Sandbox returned to exactly zero; lease released.
