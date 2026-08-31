# Research — fix-garnet-readiness-timeout--0.0.7

## Re-baseline

- Carried-in source: leaf brief for issue #1844, including the confirmed 300451 ms and 300465 ms
  Postgres-tier failures and the earlier #1747/#1754 failures.
- Re-derived against `origin/main` at `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d` on 2026-08-31.
  `HEAD`, `origin/main`, and their merge base were identical; the worktree was clean before S1
  artifact creation.
- Widened-mandate re-baseline at 2026-08-31T20:32Z: `origin/main` advanced to
  `9fbc2317291dbd33c325782bb33d86a99ee5a027` through an unrelated plugin-sagas-core documentation
  commit. The S1 artifact commit remains based on `8f1fcb2bc`; no target readiness/version path
  differs between those two main commits.
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

## Version currency and arm comparison

The repo-native dependency wrapper was consulted first. `deno task deps:latest --help` confirms that
it inventories workspace JSR/npm dependencies, not NuGet packages, .NET tools, or container tags.
The upstream verification below therefore used the official `dotnet package search` /
`dotnet tool
search` clients plus primary Aspire/Garnet sources; no registry curl or version
inference was used.

| Component                       | Checked-in pin                   | Upstream/default verified 2026-08-31                                                      | Evidence                                                                                                                                                                                                                                                                                                   | Disposition                                                            |
| ------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Aspire.Hosting.Garnet`         | `13.5.3`                         | NuGet latest stable `13.5.3`                                                              | `SCAFFOLD_ASPIRE_INTEGRATIONS.GARNET`; `dotnet package search Aspire.Hosting.Garnet --exact-match --format json`; [NuGet](https://www.nuget.org/packages/Aspire.Hosting.Garnet/13.5.3)                                                                                                                     | current                                                                |
| `Aspire.Hosting.Redis`          | `13.5.3`                         | NuGet latest stable `13.5.3`                                                              | `SCAFFOLD_ASPIRE_INTEGRATIONS.REDIS`; exact `dotnet package search`; [NuGet](https://www.nuget.org/packages/Aspire.Hosting.Redis/13.5.3)                                                                                                                                                                   | current                                                                |
| Aspire CLI / AppHost SDK        | `13.5.3` / `13.5.3`              | latest stable `13.5.3` for both                                                           | `.github/toolchain.env`; `SCAFFOLD_VERSIONS.ASPIRE_SDK`; exact searches for `Aspire.Cli` and `Aspire.AppHost.Sdk`; [CLI](https://www.nuget.org/packages/Aspire.Cli/13.5.3), [SDK](https://www.nuget.org/packages/Aspire.AppHost.Sdk/13.5.3)                                                                | current                                                                |
| Garnet container arm            | `ghcr.io/microsoft/garnet:1.1.1` | Aspire 13.5.3's `AddGarnet` default is `1.0`; upstream Garnet container latest is `2.1.5` | generator constant; Aspire tag source [`GarnetContainerImageTags.cs`](https://github.com/dotnet/aspire/blob/v13.5.3/src/Aspire.Hosting.Garnet/GarnetContainerImageTags.cs); [Garnet package versions](https://github.com/microsoft/garnet/pkgs/container/garnet/versions?filters%5Bversion_type%5D=tagged) | one major line behind upstream, but newer than Aspire's tested default |
| Docker-less `garnet-server` arm | `1.1.10`                         | NuGet tool latest stable `2.1.5`                                                          | `SCAFFOLD_VERSIONS.GARNET_TOOL`; `dotnet tool search garnet-server --detail --take 10`; [NuGet tool](https://www.nuget.org/packages/garnet-server)                                                                                                                                                         | one major line behind and inconsistent with the image arm              |

### Do the Postgres and SQLite tiers select different arms?

**No in the hosted paths measured here.** Both suites install the same plugin-provisioned entry
`{ Enabled: true, Engine: 'Garnet', Mode: 'Auto' }`, with neither `Port`, `ImageTag`, nor
`ToolVersion`. `Mode: Auto` selects the container arm when `docker info` succeeds. The hosted
reports supply runtime evidence in addition to that static path:

- Both 300-second Postgres failures removed three suite-created containers after the timeout. For a
  Postgres scaffold those are the Postgres, default Redis, and named Garnet resources; the Garnet
  executable arm would not create the third container. Their failure heads generate the explicit
  `ghcr.io/microsoft/garnet:1.1.1` image.
- A later hosted comparison at PR #1773 head `bd239f9160e7b65808bd7c4fc8bbd61c91e3dd99`, run
  [`33425281612`](https://github.com/rickylabs/netscript/actions/runs/33425281612), used one
  suite-created container on the SQLite tier and three on the Postgres tier. The only container in
  the SQLite profile is Garnet. `runtime.wait.garnet` passed in 1758 ms on SQLite and 1007 ms on
  Postgres (jobs
  [`99597333509`](https://github.com/rickylabs/netscript/actions/runs/33425281612/job/99597333509)
  and
  [`99597333333`](https://github.com/rickylabs/netscript/actions/runs/33425281612/job/99597333333)).

**Classification:** version skew is **excluded as the cause of the observed Postgres-versus-SQLite
tier asymmetry** because both select the same `1.1.1` container arm. The later hosted Postgres pass
also proves that image/version can satisfy the check, although it does not explain the two earlier
failures and cannot replace their missing per-check split. The `1.1.1`/`1.1.10` divergence is a
**contributory cross-environment reliability risk** for Docker versus Docker-less runs, not a
demonstrated cause of #1844. This issue should not bump to 2.x or align versions without a
Docker-less failure/compatibility proof; Aspire 13.5.3 itself defaults to the 1.0 image line.

## Maintained RESP client and runtime-boundary investigation

The current Node compatibility helper is not a Redis client. It opens `node:net`, writes inline
`PING\r\n`, installs one `data` callback, and accepts only a first chunk beginning `+PONG`. It does
not accumulate a complete RESP frame, encode an array command, or negotiate RESP3. `NOAUTH` maps to
`Degraded`, a state that can never satisfy `aspire wait --status healthy`. These are reliability
defects, but none identifies the #1844 root cause until the named-check split exists.

### Runtime boundary

| Surface                        | Runtime/evidence                                                                                       | Library conclusion                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Generated `_aspire-compat.mts` | Node AppHost by design; imports `node:net`, `node:path`, `node:fs`, and `node:child_process` under D-7 | Use a maintained npm Node client. Do not force `@db/redis` into this surface.           |
| `listener-fault-controller.ts` | Deno `TcpListener` server                                                                              | `@db/redis` is usable by Deno but is a client, so it cannot replace the fixture server. |
| Future Aspire 13.6/S12 state   | first-party Deno hosting is expected to retire the D-7 copy                                            | Re-evaluate convergence on the JSR client then; it is follow-up scope, not this repair. |

JSR's package page and native `deno info` both resolve `@db/redis` 0.41.2. JSR marks Deno as
supported and Node/Bun/browser support unknown; its graph uses Deno streams and `Deno.connect`-style
runtime APIs. That is sufficient to exclude it from today's Node AppHost even though it is the
natural future Deno-side client.

### Node-client dependency surface

Native Deno inspection was used for graph size/API evidence; the inspection-added lock entries were
removed immediately and the original lock hash was restored. The repository dependency tool reports
`ioredis` `^5.11.1` is already used directly at ten source sites and that stable `6.0.0` is
available.

| Candidate          | Resolved stable inspected 2026-08-31 | Measured graph             | Relevant behavior                                                                                                                                                         | Disposition                                                                                 |
| ------------------ | ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `redis`            | 6.2.1                                | 7 unique packages, 7.65 MB | Official node-redis client; RESP3 configurable; umbrella also installs Bloom/JSON/Search/TimeSeries modules unused by a PING check                                        | Maintained but unnecessarily broad.                                                         |
| `@redis/client`    | 6.2.1                                | 2 unique packages, 5.94 MB | node-redis core without module packages                                                                                                                                   | Smaller package count, but still much larger on disk and a new client family for this repo. |
| `ioredis` current  | 6.0.0                                | 7 unique packages, 1.44 MB | Defaults to RESP3, sends `HELLO 3`, and its source explicitly downgrades to RESP2 only for protocol-negotiation rejection; provides connect, command, and socket timeouts | Preferred candidate if product scope is selected.                                           |
| `ioredis` repo pin | 5.11.1                               | 8 unique packages, 1.01 MB | Existing workspace client family and smallest measured graph, but RESP2-only and one major behind stable                                                                  | Useful compatibility reference, not the new AppHost pin.                                    |

The generated `aspire/package.json` is already an isolated Node package containing runtime and dev
dependencies. Aspire's TypeScript AppHost documentation confirms that the AppHost-root package
manager installs that package before TypeScript validation/startup. A static import in the always-
compiled compatibility helper therefore requires one AppHost dependency. Adding exact `ioredis`
6.0.0 there would add 1.44 MB/7 packages to every generated AppHost, including no-cache scaffolds.
That is a measurable but acceptable tooling-only cost compared with the 7.65 MB `redis` umbrella;
avoiding it would require conditional template topology or a deliberately opaque dynamic import,
which is more complexity than the dependency it saves.

The one-shot health configuration must override client defaults: `lazyConnect: true`,
`retryStrategy: null`, `maxRetriesPerRequest: 0`, `enableOfflineQueue: false`,
`enableReadyCheck: false`, `disableClientInfo: true`, and 2000 ms connect/command/socket timeouts.
It must install an error listener, call `connect()` then `ping()`, and disconnect in `finally`. This
keeps protocol parsing/fragmentation/HELLO in maintained code while retaining the existing
health-result policy and two-second observation bound.

### Authentication reachability

`NOAUTH` is not reachable in the checked-in managed E2E/default path:

- `CacheEntry` exposes `Engine`, `Mode`, `ImageTag`, `Port`, `DataPath`, and `ToolVersion`, but no
  username/password/auth option.
- The container arm supplies only image, endpoint, and optional bind mount. The executable arm runs
  `garnet-server --port 6379`; neither supplies `--auth` or `--password`.
- External mode registers a connection string and does not attach `createRespPingCheck`.
- Garnet's official security documentation says `NoAuth` is the default and auth requires explicit
  `--auth Password --password ...` configuration. Existing hosted passes corroborate the default.

Therefore `NOAUTH` did not cause the two observed failures. It remains a concrete correctness bug in
the check: if a future/custom managed image requires auth, returning `Degraded` creates a permanent
aggregate wait. The repair must return `Unhealthy`, retain the server error/code/host/port, and fail
loudly rather than treating unauthenticated reachability as readiness.

### Synthetic listener consequence

The Deno controller currently replies `+PONG` after any chunk containing a newline; it does not
parse a command or wait for a complete frame. `@db/redis` cannot improve that server role. If the
maintained Node client becomes the AppHost probe, the fixture must accumulate frames and implement
only the client's bounded handshake contract: RESP-array `HELLO 3` with a valid map response and
RESP-array `PING` with `+PONG`, plus deterministic close/error behavior. Focused tests should split
frames across writes so the fixture and probe cannot regress to TCP-chunk assumptions.

## Reliability requirement exposed by the timeout

Irrespective of which key the hosted split implicates, the current verifier has four observable
states but reports only the final aggregate timeout:

1. matching resource never appears in `aspire describe`;
2. resource appears but the required health key never appears;
3. key appears but remains non-Healthy, with its `description`, `data` (`code`, `host`, `port`,
   `elapsedMs`), and possible exception explaining what was observed; or
4. required key is Healthy but another named report blocks aggregate health.

The generated RESP check already distinguishes `ECONNREFUSED`, `ETIMEDOUT`, `EPROTO`, `NOAUTH`, and
other socket codes and records host/port. The information loss is in the E2E verifier: it waits on
aggregate health before it reads `healthReports`, and its parser currently drops report `data` and
exception detail. A reliable verifier must poll the described resource/report, preserve the full
named map, classify the four states explicitly, and terminate a stable unreachable/unpublished
condition on the existing 30-second readiness-fixture observation deadline rather than waiting
silently for the 300-second outer ceiling. The outer ceiling remains unchanged as a fail-safe.

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
| 11 | Both failing Postgres runs and the hosted SQLite comparison select the Garnet container arm; version skew cannot explain the tier asymmetry.                                                                                                                                                  | failure artifacts' created-container receipts; #1773 hosted Postgres/SQLite report artifacts; Auto-arm generator.                    |
| 12 | The two arms are nevertheless pinned inconsistently (`1.1.1` image versus `1.1.10` tool), while upstream is `2.1.5`; this is latent cross-environment risk, not incident causality.                                                                                                           | repo pins; official dotnet searches; Aspire v13.5.3 image-tag source; Garnet package registry.                                       |
| 13 | The RESP factory already reports code/host/port; the verifier discards those fields and cannot distinguish unpublished, expected-key unhealthy, or sibling-key blocking states.                                                                                                               | `_aspire-compat.ts.template`; `verify-listener-readiness.ts`; Aspire 13.5 describe receipt.                                          |
| 14 | The AppHost RESP probe is a hand-rolled single-chunk parser using inline PING; it has framing, encoding, negotiation, and `NOAUTH` liveness defects.                                                                                                                                          | `_aspire-compat.ts.template` plus its focused tests.                                                                                 |
| 15 | `@db/redis` 0.41.2 is Deno-supported but is not an acceptable D-7 Node AppHost dependency, and it is a client rather than a replacement for the Deno fixture server.                                                                                                                          | JSR runtime compatibility, native dependency graph, compatibility-helper runtime header, controller role.                            |
| 16 | `ioredis` 6.0.0 is the preferred Node candidate: current stable, existing client family, 1.44 MB graph, maintained RESP3 negotiation/fallback. This remains a conditional design, not a causal repair.                                                                                        | `deps:latest`/`deps:why`, native `deno info`, ioredis option/event-handler source and official docs.                                 |
| 17 | `NOAUTH` is excluded from the checked-in managed paths because no auth option/flag is emitted and Garnet defaults to `NoAuth`; mapping it to `Degraded` is still a future permanent-wait defect.                                                                                              | cache schema, both managed generator arms, external arm, official Garnet security docs.                                              |
| 18 | A static maintained-client import fits the isolated generated AppHost package, but necessarily adds its dependency to every compiled AppHost helper graph unless template topology is made conditional.                                                                                       | `render-ts-apphost.ts`, `tsconfig.apphost.json` include pattern, Aspire TypeScript AppHost package-manager docs.                     |

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
6. After the split, does the stable failure remain unchanged for the existing 30-second fixture
   observation window? That measurement selects a fail-fast terminal rule without shortening
   transient healthy startup.
7. If the real product path is selected, does `ioredis` 6.0.0 negotiate and PING the pinned Garnet
   1.1.1 image in the hosted Postgres tier? Static protocol support is not a substitute for this
   compatibility proof.
8. Which exact frames does the selected client emit against the synthetic listener after its bounded
   options are applied? Capture this in focused controller tests before the hosted run.
