# IMPL-EVAL — fix-1012-aspire-executable-health-probe--readiness

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- Implementation under evaluation: `11d5c469b` (source) + `0a6650c22` (evidence)
- Branch: `fix/1012-aspire-executable-health-probe` · PR #1033
- Method: the diff was read in full and every gate was re-run by the evaluator. Nothing below is
  carried over from the slice's self-report.

## Diff verification

| Claim | Verified | How |
| --- | --- | --- |
| The `entry.Port` gate is removed from the app probe | YES | `generate-register-apps.ts`: `if (type === 'app' && entry.Port)` → `if (type === 'app')`. One-line change at the exact defect site. |
| Services and plugins emit a probe after their endpoint | YES | Both generators insert the probe immediately after the `renderHttpEndpointCall(entry)` line, so ordering holds by construction, and both new generator tests assert `indexOf('.withHttpEndpoint(') < indexOf('.withHttpHealthCheck(')`. |
| `HealthCheckPath: false` opts out on all three | YES | `entry.HealthCheckPath !== false` guard in both new sites; `resolveHealthCheckPath` unchanged for apps. Tests cover default, custom, and `false` for service and plugin. |
| Contract extended on both type and schema | YES | `ServiceEntry`/`PluginEntry` gain `HealthCheckPath?: string \| false` with JSDoc; both Zod objects gain `z.union([z.string().min(1), z.literal(false)]).optional()`, matching `AppEntry`. Schema tests assert `/ready`, `false`, and rejection of `''`. |
| Fixtures used by the new tests exist | YES | `UNPINNED_SERVICE`, `UNPINNED_PLUGIN`, `UNPINNED_APP` all pre-exist in `generators-test-support.ts`; no fixture was invented to make a test pass. |
| Nothing outside scope was touched | YES | `tauri`/`desktop`/`task` untouched; `generate-register-background.ts` and `generate-register-tools.ts` register no `withHttpEndpoint` at all, so they correctly get no probe. |
| C2 satisfied | YES | `RESOURCE_DEFAULTS.AppHealthCheckPath` JSDoc rewritten to cover apps *and* service/plugin builders, citing #954 and #1012. |
| C1 satisfied | YES | PR body states the service/plugin custom-`Entrypoint` behaviour change and the `HealthCheckPath: false` migration. |

One substantive note the slice did not flag: the app regression test was retargeted from
`MINIMAL_APP` (pinned) to `UNPINNED_APP`, so the pinned-app probe case is no longer directly
asserted. Acceptable — after this change the two cases share one code path with no port condition
between them, and `generateRegisterApps host ports` still covers pinned endpoint rendering.

## Gates (re-run by the evaluator)

| Gate | Result | Real output |
| --- | --- | --- |
| CLI template check | PASS | 28 files, 0 failed batches, 0 findings, exit 0 |
| Aspire check | PASS | 45 files, 0 failed batches, 0 findings, exit 0 |
| CLI generator tests | PASS | `ok | 18 passed (159 steps) | 0 failed (7s)` |
| Aspire tests | PASS | `ok | 18 passed (68 steps) | 0 failed (13s)` |
| Lint | PASS | Checked 45 files |
| Format | PASS | Checked 48 files |
| Runtime E2E `scaffold.runtime` | 44 passed / 1 failed — failure attributed to baseline | see below |

The runtime suite was run because this change alters Aspire helper generation. It is the only gate
that proves `withHttpHealthCheck(...)` is valid on the service/plugin receiver — there the receiver
is the result of `.withHttpEndpoint(...)`, not the bare `addExecutable(...)` receiver the app path
has used since #954. `generated.deno-check` (178s) and `runtime.aspire-start` (40s) both PASSED, so
the composition type-checks and the AppHost starts with probes on services and plugins.

`behavior.service-health` FAILED (156s). **Attributed, not assumed:** the identical suite was run on
unmodified `main` @ `3ab64720f` and failed on the same gate — `FAILED 118011ms`, `passed=44
failed=1`. Pre-existing, and independent by construction: that gate probes the users service's
`/health` over HTTP and asserts an aggregate body shape; it never reads Aspire's `healthStatus`.
`main` is currently red on it. Not this slice's defect and not fixed here.

## Acceptance criteria (the issue's boxes)

| Box | Verdict | Evidence |
| --- | --- | --- |
| 1 — HTTP-advertising executable not `Healthy` until a readiness probe succeeds | MET | Every generated app, service, and plugin now emits `withHttpHealthCheck({ path, endpointName: 'http' })` after its endpoint, unless opted out. Proven at generator level and composed successfully in a live AppHost start. |
| 2 — no-report resources distinguishable from passing-report resources | MET, with a scoping statement | NetScript's lever is ensuring reports exist; after this change no generated HTTP-advertising resource lacks one by default. Aspire's own collapse of zero reports to `Healthy` is upstream and deliberately unmodified — I confirmed NetScript has no consumer of `healthStatus` anywhere in `packages/`, so there is no NetScript surface on which to draw the distinction differently. |
| 3 — integration test: alive process, port never binds, reported not-healthy | PARTLY MET | Generator-level coverage plus a live AppHost start with the probes registered. There is no live dead-port fixture in this harness and the PR does not claim one. The not-healthy verdict for a never-binding port is not directly asserted. |

## Verdict

`PASS with reservation` — the fix is correct, minimal, sits exactly at the defect, and is fully
gated. **Not marked ready for merge.** Three human-review triggers apply:

1. Box 3 is only partly evidenced (no live dead-port test).
2. Default behaviour change: a service or plugin with a custom `Entrypoint` that serves no
   `/health` flips to `Unhealthy` on upgrade. Bounded — nothing `waitFor`s a service or plugin —
   and opt-out documented, but it reaches existing projects.
3. Public-surface change: two new fields on `@netscript/aspire`'s `ServiceEntry`/`PluginEntry`.

Left as a draft with this reasoning recorded rather than marked ready on thin evidence.
