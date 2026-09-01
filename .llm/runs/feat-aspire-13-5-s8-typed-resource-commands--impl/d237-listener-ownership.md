# D-237 — listener-fault ownership control

## Verdict

The two failures in workflow run `33460896691` are not the same failure.

- `runtime.typed-db-phase-b` is S8-owned. Its verifier used `aspire resource postgres stop` and
  then waited for the real `postgres_listener` report to become Unhealthy. D-101 commit
  `598ed9ca7` already records that `resource stop` suspends health evaluation and retains the last
  `healthReports` value. The observed `Healthy: postgres listener ready on localhost:31466` is that
  exact known-invalid actuator. The bounded repair reuses D-101's revisioned test-only controller.
- The SQLite `runtime.health.listener-unreachable` failure is not yet attributable. It failed before
  writing a close revision: its baseline poll omitted `healthReports.test_only_garnet_resp` for 30
  seconds. The D-101 controller, fixture, injection, and describe-reader blobs are identical on
  current `origin/main`, the committed S8 head, and the tested PR merge. D-233 can nevertheless
  reach lifecycle ordering indirectly because its successful deploy mapping suppresses the
  post-database restart fallback. A runtime control is required before repairing that path.

No Aspire, Docker, AppHost, or E2E command was run locally.

## What CI actually ran

Actions metadata names branch head `608f8f2da`, but both failing jobs checked out merge commit
`6d367146b`, whose parents are current main `60ae56af0` and S8 `608f8f2da`. The only CLI changes on
main after the S8 merge base `6c195acaf` concern generated agent docs and Windows deploy prebuild;
they do not touch D-101 or the scaffold runtime lifecycle.

Run `33460896691` says:

- Docker: `runtime.health.listener-unreachable` **passed** in 46,670 ms. The following
  `runtime.typed-db-phase-b` failed in 34,980 ms after `resource stop` returned success but the real
  `postgres_listener` report stayed Healthy.
- SQLite: `runtime.health.listener-unreachable` failed in 31,392 ms at the initial baseline
  `Promise.all`, before `commandListenerFaultController` could write a close revision. The decisive
  diagnostic is `garnet omitted healthReports.test_only_garnet_resp`.

This corrects the carried-in statement that both tiers failed after driving a listener closed.

## S8-free control

The available S8-free runtime control is manual main run `33413386485` at `6c195acaf`:

- Docker `runtime.health.listener-unreachable` passed in 53,771 ms; the complete tier passed 91/91.
- SQLite failed earlier at `runtime.wait.garnet` after 300 seconds, so it never reached
  `runtime.health.listener-unreachable` and cannot decide the SQLite question.

Current main is `60ae56af0`. It has no newer `e2e-cli` runtime run. The exact forbidden control
would be to re-check `refs/heads/main == 60ae56af0`, then dispatch
`gh workflow run e2e-cli.yml --repo rickylabs/netscript --ref main`, and inspect only the SQLite
`runtime.health.listener-unreachable` result. D-237's no-runtime constraint prohibits dispatching
it here.

The static control is exact: these four Git blob IDs are identical across `origin/main`,
`608f8f2da`, and tested merge `6d367146b`:

| D-101 surface | Blob |
| --- | --- |
| `listener-fault-controller.ts` | `667c67e6d965face099fe2b13e0764aad7268069` |
| `listener-unreachable-fixture.ts` | `aaf68a760cb05eca078d2b7e573986a20ce4d8df` |
| `prepare-readiness-fixture.ts` | `d65d7aca96a4b33977616d8ac532b0935164e14a` |
| `verify-listener-readiness.ts` | `662622df87ca90d4954017a9b0a76ec2548fb105` |

## Intended D-101 mechanism

`prepare-readiness-fixture.ts` creates
`.netscript/e2e/listener-fault-controller/{main.ts,deno.json,state.json}`, writes revision 0 with
both sockets open, deletes any stale `ack.json`, registers the controller as an Aspire-managed Deno
task, and injects test-only health checks beside markers derived from the real infrastructure
generator.

The controller polls `state.json` every 50 ms. A strictly newer revision opens or closes the
controller-owned sockets on localhost ports 18,998/18,999 and is acknowledged atomically in
`ack.json`. The fixture increments the persisted revision, writes it atomically, and requires an
exact state/ack match within five seconds before polling Aspire health.

The keys are:

| Resource | Test-only key | Real continuity key |
| --- | --- | --- |
| Postgres | `test_only_postgres_listener` | `postgres_listener` |
| Garnet | `test_only_garnet_resp` | `garnet_resp` |

The fault gate first requires the test-only and real keys Healthy. It closes only the selected
synthetic socket, requires the test-only key Unhealthy with the expected TCP/RESP diagnostic while
the real key remains Healthy, proves `aspire wait --status healthy` times out with exit 17, reopens
the socket, and requires recovery to Healthy.

SQLite's failure is at the first step: the injected test-only Garnet report is not visible. No
close revision or acknowledgement is attempted. The typed-db failure is at a different actuator:
stopping the real Postgres resource does not trigger another health evaluation.

## Reachability from the five deltas

- D-224 and D-235/236 change only the generated runner's bounded diagnostic capture/persistence.
  They do not register health checks, write controller files, name listener keys, or order
  resources.
- D-227 changed a connection-string resolver after the unchanged real health attachment block in
  `generate-register-infrastructure.ts`; D-231 removed that resolver. Neither edits the health
  block, controller, test-only injection, or keys.
- D-231 changes typed DB command graph injection and result transport. It does not directly alter
  listener registration or the controller.
- D-233's diagnostic commits do not reach listener behavior. Its deploy-mapping commit `9c5fa1b0b`
  does reach start ordering indirectly: the suite's typed-command-or-restart gate restarts only
  when the typed migrate fails. At `a5f1ab7e0` the gate took 15,116 ms on SQLite and its sibling
  listener fault gate passed in 23,117 ms (86/86). At `608f8f2da` the now-successful typed deploy
  took 1,683 ms without fallback restart, after which the test-only Garnet key was absent. This is
  correlation and a real reachability edge, not sufficient causal proof.
- `verify-typed-db-phase-b.ts` is itself S8-owned and directly contained the invalid stop/start
  actuator. That ownership is conclusive independently of the SQLite question.

## Bounded repair and static proof

The typed verifier now calls the shared revision/ack client, closes
`test_only_postgres_listener`, polls that key Unhealthy, runs the same bounded NetScript migrate
failure assertion, and reopens both synthetic sockets in `finally`. The real Postgres container and
its health evaluator remain running throughout.

The source-contract regression was added before the repair. It exited 1 with 23 passed / 1 failed
because the controller call and test-only key were absent. After the repair:

| Gate | Result |
| --- | --- |
| focused runtime/controller/readiness tests | exit 0; 36/36 passed |
| helper + runtime-builder tests preserving D-224/227/231/233/235 | exit 0; 286/286 passed |
| scoped structured check | exit 0; 3 files, zero diagnostics |
| scoped structured lint | exit 0; 3/3 processed, zero findings/drops |
| scoped structured format check | exit 0; 3/3 processed, zero findings/drops |
| `quality:gate` | exit 0; scanner findings 0; doctrine `FAIL=0` with existing warnings |

No SQLite repair is made. No evaluator is dispatched and no `evaluate.md` is created.
