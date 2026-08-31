# Research — fix-garnet-readiness-timeout--0.0.7

## Re-baseline

- Carried-in source: leaf brief for issue #1844, including the confirmed 300451 ms and 300465 ms
  Postgres-tier failures and the earlier #1747/#1754 failures.
- Re-derived against `origin/main` at `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d` on 2026-08-31.
  `HEAD`, `origin/main`, and their merge base were identical; the worktree was clean before S1
  artifact creation.
- Branch: `fix/garnet-readiness-timeout`.
- What changed versus the carried-in brief: no defect claim changed. Static inspection found that
  the current failing path cannot preserve the per-check evidence the brief requires, so the split
  remains unresolved rather than guessed.

## First measurement — per-check split

**Status: UNRESOLVED. No diagnosis is claimed.**

The required question is whether `garnet_resp`, `test_only_garnet_resp`, or both are unhealthy at
the `runtime.wait.garnet` timeout. The supplied timeout records do not contain that detail, and no
checked-in artifact at the base commit contains the missing health snapshot.

Static inspection explains why the existing gate output is insufficient:

1. `verifyListenerReadiness()` calls aggregate `aspire wait <resource> --status healthy` first.
2. It calls `aspire describe --format Json` and reads the named report only after that wait
   succeeds.
3. On a wait timeout, `runAspire()` throws before `describe` runs. The failure therefore records
   neither `garnet_resp` nor `test_only_garnet_resp`.

This is an evidence-collection gap, not evidence that either check is defective. The smallest
measurement change is to make the existing failure path capture the Garnet resource's complete
`healthReports` object before rethrowing. That path is under `packages/cli/e2e/**`, which PR #1773
currently owns; S2 must not begin until the supervisor sequences that collision.

## Aspire-lane evidence request

At 2026-08-31T19:05Z, a bounded read-only request was sent to an Aspire-focused lane for:

- the exact run ID and job ID for the 300451 ms observation;
- the exact run ID and job ID for the 300465 ms observation; and
- DCP/`aspire describe` health detail from both runs, including `garnet_resp` and
  `test_only_garnet_resp`.

The request explicitly forbade a new hosted dispatch and asked for no diagnosis without the
per-check reports. The Aspire lane returned the exact identities and inspected both raw job logs and
uploaded suite artifacts. It found no uploaded DCP/health export, so the split remains unresolved.

| Observation                          | Run/job identity                                                                                                                                                                                      | Head and result                                                                                                                                                  | DCP/per-check detail                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 300451 ms, #1747                     | run [`33404321608`](https://github.com/rickylabs/netscript/actions/runs/33404321608), attempt 2; job [`99529603502`](https://github.com/rickylabs/netscript/actions/runs/33404321608/job/99529603502) | `2032d4ed7e88f5687e7191109046fa09b0547633`; Postgres wait PASS 1541 ms; Garnet aggregate FAIL 300451 ms; suite 46 pass / 1 fail                                  | uploaded report artifact `9763351747` contains only aggregate timeout; `test_only_garnet_resp` occurs 0 times |
| 300465 ms, #1744/S7 forced `ci:full` | run [`33425247583`](https://github.com/rickylabs/netscript/actions/runs/33425247583); job [`99597228455`](https://github.com/rickylabs/netscript/actions/runs/33425247583/job/99597228455)            | `bd3dbc843a4785ca0a61a7779aa56d03f5cbe9ef`; raw log records `ci:full` force; Postgres wait PASS 1337 ms; Garnet aggregate FAIL 300465 ms; suite 46 pass / 1 fail | uploaded report artifact `9770814732` contains only aggregate timeout; `test_only_garnet_resp` occurs 0 times |
| Earlier #1754 failure                | run `33404324013`; job `99545166227`                                                                                                                                                                  | supplied brief: 46 gates green, then aggregate Garnet timeout                                                                                                    | no per-check evidence supplied                                                                                |

The two failures reference runner-local files that the workflow did not upload:

- run `33404321608`: `/home/runner/.aspire/logs/cli_20260831T150133_bc5ec6d3.log` and AppHost
  `/home/runner/.aspire/logs/cli_20260831T150115836_detach-child_14ab775ce7a942938aab23fba51856a7.log`;
- run `33425247583`: `/home/runner/.aspire/logs/cli_20260831T183424_12281773.log` and AppHost
  `/home/runner/.aspire/logs/cli_20260831T183406976_detach-child_8734e4f54aff43d89717cb2ead3965b9.log`.

`.github/workflows/e2e-cli.yml` uploads the suite JSON/NDJSON and listener receipt, but not these
Aspire logs. The runner-local paths are therefore provenance for missing evidence, not readable
evidence. Existing Aspire 13.5 receipt
`.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-aspire-describe-1.json`
confirms that `aspire describe --format Json` is the source that can preserve named `healthReports`
status/description/exception before cleanup.

## Lead tested — PR #1740 endpoint port change

Supervisor lead: PR #1740, commit `2a1248d33d55a9529d1e4822d9c850bc6caa4c16` (parent
`bc33c2aa319c057dda6525d91cb8adcae56b3d77`, merged 2026-08-30) changed the infrastructure generator
so an explicit cache `entry.Port` can flow into the Garnet executable endpoint. This was tested as a
lead only.

### Check 1 — does the Garnet `entry.Port` differ by tier?

**No.** At both failing heads, plugin installation provisions this exact Garnet entry when absent:

```json
{ "Enabled": true, "Engine": "Garnet", "Mode": "Auto" }
```

It has no `Port`. The Postgres suite begins with cache enabled and may retain its separately named
default Redis entry; the SQLite suite begins with `cache: false`. Plugins requiring KV then call
`ensureSharedCache(..., 'garnet')` in both tiers and create/reuse the same unpinned Garnet entry.
`PrimaryCache ??=` can differ, but `runtime.wait.garnet` targets the named Garnet resource and its
Garnet entry has no `Port` in either tier. Static inspection was repeated at failure heads
`2032d4ed7e...` and `bd3dbc843a...`, not inferred only from current `main`.

### Check 2 — does #1740 change the generated Garnet endpoint for those inputs?

**No for the observed unpinned input.** `cacheEndpointOptions(undefined)` emits:

```ts
{ name: 'tcp', targetPort: 6379, scheme: 'tcp' }
```

which is byte-equivalent to the pre-#1740 executable-arm literal. The Auto container arm already
called `cacheEndpointOptions(entry.Port)` in #1740's parent. Thus the generated Garnet endpoint and
the adjacent `endpoint.host()` / `endpoint.port()` RESP check are unchanged for the actual no-Port
entry. The #1740 diff is behaviorally relevant only when `entry.Port` is defined; the checked-in
tier inputs do not satisfy that premise.

### Check 3 — does RESP reach the real or synthetic listener?

**Not answered by static evidence.** This remains downstream of the per-check split. If
`garnet_resp` is unhealthy, the hosted failure snapshot must record callback host/port/data and the
Aspire logs must show whether the real listener was reached. If only `test_only_garnet_resp` is
unhealthy, the #1740 lead is dead outright.

**Lead disposition:** the proposed `entry.Port` tier asymmetry is falsified by the checked-in
inputs, and #1740 does not change the generated Garnet endpoint for those inputs. It is therefore
not a supported diagnosis or the current prime suspect. Keep it only as a contingent runtime check
if the split implicates the real check and hosted evidence contradicts the static no-Port path.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                       | How to verify                                                                                                                        |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | `runtime.wait.garnet` resolves the real key `garnet_resp` with a 300-second budget.                                                                                                                                                                                                           | `listener-readiness-gates.ts`: `listenerReadinessExpectation()`; focused test baseline.                                              |
| 2  | The gate waits for aggregate resource health before reading any named report. A timeout skips the later `describe`, so current failure evidence cannot split the two checks.                                                                                                                  | `verify-listener-readiness.ts`: `verifyListenerReadiness()` and `runAspire()`.                                                       |
| 3  | The readiness fixture attaches `test_only_garnet_resp` to the same `garnet` resource after the real `garnet_resp` attachment marker.                                                                                                                                                          | `prepare-readiness-fixture.ts`: `injectListenerFaultHealthChecks()`; focused splice test.                                            |
| 4  | The real Garnet callback resolves its host and port from `garnet.getEndpoint('tcp')` inside every health invocation.                                                                                                                                                                          | `generate-register-infrastructure.ts`: `appendRespReadinessLines()`.                                                                 |
| 5  | The synthetic Garnet callback instead uses fixed `localhost:18999`; the synthetic Postgres TCP callback uses `localhost:18998`.                                                                                                                                                               | `prepare-readiness-fixture.ts`; `listener-fault-controller.ts`.                                                                      |
| 6  | The controller implementation accepts RESP and returns `+PONG\r\n`; this rules out only the controller's protocol vocabulary, not hosted reachability or startup.                                                                                                                             | `listener-fault-controller.ts`; existing controller focused test. Per brief, this is already ruled out and is not re-diagnosed here. |
| 7  | The nested `packages/cli/e2e` workspace is an Archetype-6-owned harness, not a separately published doctrine unit. `packages/cli` currently has doctrine verdict **Keep**.                                                                                                                    | doctrine files 06, 09, and 10; `ARCHETYPE-6-cli-tooling.md`.                                                                         |
| 8  | `runtime/` already has 12 immediate children. Existing debt `scaffold-runtime-a8-f16-1333` forbids adding a thirteenth; the diagnostic must edit the existing `verify-listener-readiness.ts` rather than add a probe file.                                                                    | direct-child measurement; `.llm/harness/debt/arch-debt.md`.                                                                          |
| 9  | PR #1773 is live at head `bd239f9160e7b65808bd7c4fc8bbd61c91e3dd99` (merge ref `5d846f212099a81fa9420b68f1e58b06adb56451`) and changes seven `packages/cli/e2e/**` paths. It does not directly edit the proposed two diagnostic files, but its declared ownership makes the collision active. | `git ls-remote origin refs/pull/1773/{head,merge}`; base-to-head name diff.                                                          |
| 10 | The #1740 `entry.Port` hypothesis does not explain the tier asymmetry statically: both failing heads supply the same unpinned Garnet entry, and undefined produces the pre-change endpoint declaration.                                                                                       | failure-head `workspace-mutator.ts`, suite defaults, #1740 parent/commit generator diff, and current generator test fixture.         |

## Baselines measured at the base commit

All commands below ran at base `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d`. No Aspire, Docker,
scaffold, `e2e:cli`, or generated runtime command was run.

| Gate                           | Result          | Measurement                                                                                                                                                 |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2E workspace check            | PASS            | Structured check wrapper selected 185 TypeScript files in 2 batches; 0 diagnostics.                                                                         |
| E2E workspace format           | PASS            | Structured format wrapper selected/processed 185 TypeScript files; 0 findings/refusals.                                                                     |
| E2E workspace lint             | REFUSAL, exit 2 | 185 selected; detached `fixtures/desktop-native` batch could not resolve catalog `zod`; 0 lint findings. This is not a source PASS and not a source defect. |
| Diagnostic-path check          | PASS            | Structured check wrapper selected 2 planned files; 0 diagnostics.                                                                                           |
| Diagnostic-path lint           | PASS            | Structured lint wrapper selected/processed the same 2 files; 0 findings/refusals.                                                                           |
| Diagnostic-path format         | PASS            | Structured format wrapper selected/processed the same 2 files; 0 findings/refusals.                                                                         |
| Focused readiness/splice tests | PASS            | Structured test wrapper: 8 passed, 0 failed across `listener-readiness-gates_test.ts` and `prepare-readiness-fixture_test.ts`.                              |
| Lock hygiene                   | PASS            | `deno.lock` SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`; byte-identical to base.                                             |

## JSR-audit surface scan

- Surface scanned: N/A.
- Reason: this S1 changes run artifacts only. The planned diagnostic changes the nested, unpublished
  CLI E2E harness and no `mod.ts`, `deno.json` export, JSDoc/public API, or published package
  surface. A real-check diagnosis that later requires `packages/cli/src/**` must receive a new
  scoped plan and repeat this determination.

## Open questions

1. Which report is unhealthy at failure: `garnet_resp`, `test_only_garnet_resp`, or both? This is
   safe to defer through S1 but **must be resolved before any repair**.
2. If the test-only check is unhealthy, is the controller resource running and is `localhost:18999`
   reachable from the AppHost process at the check time?
3. If the real check is unhealthy, what host/port/data did the callback report, and does it match
   the live Garnet endpoint?
4. What Postgres-tier ordering or resolution fact differs from the other tiers? This question is
   downstream of the split and must not be used to speculate before it.
5. If the real check is implicated, does hosted `describe` show a host/port that contradicts the
   statically unpinned endpoint path? Only that evidence would reactivate the #1740 lead.
