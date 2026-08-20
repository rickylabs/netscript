# F6 plan amendment — precise browser-child termination

## Stop boundary

This artifact records a plan-only repair. No source, test, template, fixture, generated asset,
lockfile, or `docs/**` path changed. No test, binding gate, `scaffold.runtime`, `fresh-browser`,
Aspire command, Docker command, evaluator, lease, readiness, or metadata action ran.

## Disposition

S5 attempt 4 stopped at `passed=69 failed=1 skipped=0`. The sole failure was the leaf-added browser
probe's teardown calling `child.kill('SIGTERM')` after the child had already exited. The cleanup
exception prevented evidence return, so settled-refetch behavior remains unknown. It is neither a
product failure nor a behavioral pass.

The runtime did confirm two earlier repairs: `generated.deno-fmt-check` passed in 343 ms against a
real generated project, proving F5 beyond its cheap 12-path test, and
`generated.service-client-contract` passed, preserving F4. The passing-gate progression remains
20 → 32 → 69 across attempts 1, 3, and 4.

The attempt-4 report and raw log remain append-only:

- `reports/s5-attempt4-runtime-failure.md`
- `reports/s5-attempt4-scaffold-runtime-20260815-2037.log`
- SHA-256: `b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23`

Every earlier S5 attempt, S4/F4/F5 report and receipt, Fresh's 45 and SDK's 3
`PRE_EXISTING_FAIL` diagnostics, and the separately identified plugin-streams diagnostic remain
unchanged.

## Exact later path ceiling

F6 implementation may modify only:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

Both are already owned by this leaf. No third path is planned. A compiler-proven need outside this
ceiling stops the repair for another amendment and fresh Tier-A review.

## Named internal helper

Place this same-package test seam in `service-client-browser-probe.ts`, immediately after
`collectBrowserRefetchEvidence` and before `waitForCompletedStableBaseline`:

```ts
export async function terminateBrowserProcess(
  child: Pick<Deno.ChildProcess, 'kill' | 'status'>,
  drain: Promise<void>,
): Promise<Deno.CommandStatus>
```

It is not re-exported through a package barrel. The helper sends `SIGTERM`, awaits and returns
`child.status`, and awaits the raw stderr-drain promise. Deno's local API exposes `kill(): void` and
no typed already-terminated code/property. Therefore the only tolerated exception is the exact
runtime-observed conjunction:

```ts
error instanceof TypeError && error.message === 'Child process has already terminated'
```

Every other thrown value is rethrown unchanged. The current `pipeTo(...).catch(() => {})` is not
passed to the helper; the raw pipe promise is, so an unrelated drain failure cannot be mislabeled as
successful cleanup. Profile deletion remains in an enclosing `finally`, preserving the original
termination/drain error while retaining best-effort temporary-profile cleanup.

The helper satisfies A6 because it encodes a NetScript probe policy and is the exact side-effect
seam exercised by focused tests. A separate helper module would add an unjustified third path.

## Cheap deterministic proof matrix

| Scenario | Required assertion |
| --- | --- |
| Natural exit | Spawn a short Deno child, attach its raw stderr drain, await natural successful exit, call the helper, and require no throw plus the same successful status and completed drain. |
| Active child | The existing allow-all test file can spawn a real Deno child without a new harness. Wait for its readiness marker while it remains alive, call the helper, and require an unsuccessful `SIGTERM` status only after drain completion. |
| Unrelated failure | Through the helper's structural `Pick` seam, require an unrelated `TypeError` to propagate by identity; also require a plain `Error` carrying the terminated-child message to propagate. With a successful kill/status fake, require a rejecting raw drain promise to propagate by identity too. These cases pin both halves of the kill discriminator and prevent drain swallowing; all fail under a broad catch. |
| Production wiring | Assert the probe delegates to `terminateBrowserProcess(child, drain)` and no longer performs an unguarded kill in `finally`. |

Fresh Tier-A review is required before either authorized code path changes.

At F6 turn start, `leak-report.md` already had a timestamp-only refresh with unchanged Aspire/Docker
`ok` and empty-survivor content. It is retained without editing; F6 did not run leak-check.
