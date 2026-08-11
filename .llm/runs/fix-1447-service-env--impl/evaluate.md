# Evaluation: PR #1449 — generated service environment

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1447-service-env--impl` |
| Target | PR #1449, issue #1447, head `dbd7cd9d1946981709b4fc3b319d952eefdc3724` |
| Baseline | `origin/main` / merge-base `2256a67bf612907195ce5e51df1df7326c504f2b` |
| Archetype | `packages/aspire`: A2; `packages/cli`: A6. The implementation plan records A4 for `packages/cli`, contrary to `ARCHETYPE-6-cli-tooling.md`. |
| Scope overlays | `SCOPE-service.md`; generated Aspire consumer path |
| Evaluator | Fresh native Codex/Sol opposite-family IMPL-EVAL, 2026-08-11T10:54:18+02:00 |
| Authorship | Claude Opus 5 implementation; evaluator did not author the implementation |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Opposite-family evaluator | PASS | Claude Opus 5 authored the implementation; this evaluation is a separate Codex/Sol session. |
| Plan-Gate before implementation | PASS | `plan.md:15-21` records justified `PLAN-EVAL: N/A` before the slices. |
| Design checkpoint | PASS | `worklog.md:3-53` contains public surface, vocabulary, ports, constants, slices, deferred scope, and contributor path. |
| RED precedes implementation | PASS | Commit order is `21cf655f5` RED, then `5df14ebc8` contract/generator, `41cf0075b` executing test, `fa9ba9573` E2E, `dbd7cd9d1` docs. |
| Commit slices match the design | FAIL | `plan.md:108-117` and `worklog.md:37-40` specify six independently committed slices; history contains five commits because contract and generator were combined. |
| Correct archetype selected | FAIL | `plan.md:10-11` calls `packages/cli` A4; the governing profile is `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`. |
| Close-gate | FAIL | Issue #1447 still has all six acceptance boxes unchecked and carries `gate:e2e`; PR #1449 has `Closes #1447` and no completed Definition-of-Done checklist. The PR remains draft. |

## Acceptance Contract

| # | Result | Evidence |
| --- | --- | --- |
| 1. Genuine RED-first generator test with at least two entries | PASS | The first branch commit is test-only `21cf655f5`. An archived checkout of that commit failed independently with checking (`TS2339`, `ServiceEntry.Env` absent, exit 1) and with `--no-check` (`0 passed (3 steps), 2 failed (7 steps)`, exit 1). The fixture declares two entries on each of two services at `service-environment_test.ts:30-42,135-153`. |
| 2. Every entry reaches the correct resource | PASS | Generator blocks are isolated per resource at `service-environment_test.ts:98-111,135-153`; executed registration independently asserts both resource maps at `service-environment-runtime_test.ts:250-270`. Current CLI tests pass. |
| 3. Precedence explicitly defined and tested both directions for OTel, database, PORT, provider, and discovery | FAIL | README defines all categories at `packages/aspire/README.md:159-175`, but collision behavior is exercised only for `DATABASE_URL` (`service-environment_test.ts:164-187`; runtime test `286-303`; live topology `service-env-evidence.ts:75-83`). OTel, `DB_PROVIDER`/engine URI, discovery, and `PORT` receive no colliding declared inputs. The runtime double returns no service references (`service-environment-runtime_test.ts:170-171`) and its local reducer itself imposes last-write-wins (`144-150`), so it cannot detect a change in Aspire's semantics. |
| 4. A scaffold/runtime test proves a running service observes the value | FAIL | `behavior.service-env` runs `verify-service-env.ts`, which executes only `aspire describe` (`verify-service-env.ts:28-56`) and inspects topology. The scaffolded users service never reads either `NETSCRIPT_E2E_SERVICE_*` sentinel. `collectServiceEnvironmentFailures` accepts a missing state and every non-terminal state (`service-env-evidence.ts:20-28,85-89`), so it does not require Running/Healthy. The unit child process is launched separately with a map synthesized by the test (`service-environment-runtime_test.ts:316-339`), not by the generated AppHost. |
| 5. Deterministic regeneration; no helper hand-edit | PASS | `configure-service-env.ts:36-62` edits only `appsettings.json`, runs the real generator twice, snapshots the current flat helper directory, and byte-compares each generated file at `98-123`. Independent `scaffold.runtime` completed the fixture and generated quality gates successfully. |
| 6. Plugin/service parity covered or documented | PASS | Both shapes have canonical `Environment` plus deprecated fallback `Env` in `packages/aspire/config.ts`; both schemas use `EnvironmentFields`; both generators use `renderDeclaredEnvironmentLines`. README documents the single spelling rule at `140-157`; plugin parity tests are at `service-environment_test.ts:222-256`. |
| Missing-contract context resolved | PASS | The base had no service environment member while plugins had `Environment`. The PR makes `Environment` canonical and `Env` a deprecated fallback on both shapes, resolves them once with `Environment ?? Env`, and documents the naming decision. |

## Findings

### F1 — High — the runtime acceptance gate never proves the service observed the value

`behavior.service-env` is named “Users service runs with its declared environment”, but its command
only runs `aspire describe`. It proves that the AppHost resource model contains the values; it does
not prove that the service process received, read, or changed behavior because of them. The generated
users entrypoint reads `PORT`, not either sentinel. The neighboring health gate proves an endpoint is
available, but it is not coupled to a response/log/process observation containing the configured
value. The state check is also false-green: absent, `Starting`, `Waiting`, `Stopped`, `Unhealthy`, and
unknown states pass because only three terminal spellings are rejected.

Required action: make the scaffolded service read the configured value and expose process-level
evidence (for example a behavior endpoint or correlated service log), require explicit
Running/Healthy state, and have the E2E gate assert that evidence from the AppHost-started process.

### F2 — High — precedence coverage substitutes a test-owned model and omits four required classes

The documentation promises generated precedence for OTel, database/provider, discovery, and Aspire's
`PORT`. Tests only introduce a declared collision for `DATABASE_URL`. Assertions that generated
`DB_PROVIDER`, engine URI, and OTel keys exist without a collision do not prove which value wins.
Discovery is disabled by the compat double and `PORT` endpoint options are discarded by the recording
resource. Finally, `resolveEnvironment` implements last-write-wins inside the test, so the test cannot
fail if the actual Aspire SDK changes or resolves duplicate environment keys differently.

Required action: add falsifiable declared collisions and non-colliding controls for OTel,
`DATABASE_URL`, provider/engine URI, discovery, and `PORT`; assert their resolved behavior through the
real Aspire SDK/live resource path or another authority that does not define the expected semantics
inside the test.

### F3 — Medium — the new E2E path hardcodes the resource under test

`runtime-gates.ts:25-26` adds `SCAFFOLDED_SERVICE_RESOURCE = 'users'` and passes that value to both the
fixture and verifier (`222-234`, `379-390`). Moving a literal into a named constant does not remove the
hardcoded resource assumption; the two sides can still agree on the same wrong subject, and a scaffold
default change will invalidate the gate independently of the contract being tested.

Required action: resolve the service key from the generated consumer configuration/resource graph and
pass that discovered identity through the fixture and verification path. Test the discovery failure
mode rather than embedding `users` in the gate registry.

### F4 — Medium — A6 debt was deepened after its recorded stop condition

The run classifies `packages/cli` as A4 even though doctrine assigns it A6. Existing debt entry
`scaffold-runtime-a8-f16-1333` says the scaffold runtime registry and gate directory must be split
“before the next scaffold runtime gate or probe is added.” This PR is that next gate: it grows
`runtime-gates.ts` from 906 to 943 lines (AP-1/F-1) and the directory from 43 to 48 direct children
(F-16), but `plan.md:128-134` reports no new/deepened debt and the debt entry is unchanged.

Required action: honor the recorded split target, or explicitly re-authorize and update the debt with
the new delta, owner/target/rationale, linked run, and gate evidence. Correct the run's archetype and
record the applicable A6 manual gate evidence.

### F5 — Low — the slice history does not match the locked process record

The design says six slices, each ending in its own sign-off commit; the branch has five commits because
slices 2 and 3 share `5df14ebc8`. The RED ordering remains valid, but the process artifact and actual
history disagree.

Required action: correct the run artifacts to state the actual slice/commit shape and stop claiming an
independent commit for every listed slice.

## Static Gates

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| CLI tests | `deno test --allow-all --unstable-kv packages/cli` | PASS | exit 0; `729 passed (510 steps), 0 failed` |
| Aspire tests | `deno test --allow-all --unstable-kv packages/aspire` | PASS | exit 0; `19 passed (72 steps), 0 failed` |
| CLI check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 843 files, 8 batches, 0 occurrences |
| CLI lint | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | PASS | 843 files, 5 batches, 0 occurrences |
| CLI format | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS | 843 files, 0 findings |
| Aspire check/lint/format | scoped wrappers over `packages/aspire` | PASS | 45 files; 0 check/lint/format findings |
| Doc lint | `run-deno-doc-lint.ts --root packages/aspire` and `--root packages/cli` | PASS | both exit 0; total errors 0 across 9 Aspire and 3 CLI entrypoints |
| Quality scan | `rtk proxy deno task quality:scan` | PASS | exit 0; `ok:true`, 0 findings, 7 unchanged repository allowances |
| Architecture | `rtk proxy deno task arch:check` | PASS | exit 0; no mechanical failures; repository warnings remain non-fatal |
| JSR/publish | `rtk proxy deno task publish:dry-run` | PASS | exit 0; `Success Dry run complete` |
| Lock hygiene | `git diff --exit-code origin/main...HEAD -- deno.lock` | PASS | exit 0; lock unchanged |
| Final source state | `git status --short` before evaluator artifact | PASS | clean |

## Runtime and Consumer Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Historical typed RED | PASS | archived `21cf655f5`; exit 1 with `TS2339` on missing `ServiceEntry.Env` |
| Historical assertion RED | PASS | archived `21cf655f5` with `--no-check`; exit 1, `0 passed (3 steps), 2 failed (7 steps)` |
| Current generated registration execution | PASS | included in CLI suite; generated module imported and run against recording builder |
| Full generated consumer smoke | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; exit 0, `82 passed, 0 failed, 2 skipped` (the two skips are pre-existing `#1398` deferred gates, not added by this PR); cleanup passed |
| `runtime.service-env-fixture` | PASS | real consumer config edit plus two generator runs; generated check/lint/fmt gates passed |
| `behavior.service-env` | FAIL | command itself exited 0 in the full smoke, but its evidence is topology-only and admits non-running states; it does not satisfy acceptance item 4 |

## Fitness and Escape-Hatch Sweep

| Check | Result | Evidence |
| --- | --- | --- |
| F-1 / AP-1 file cap | FAIL | `runtime-gates.ts` grows 906 → 943 lines against the recorded 500-line cap/debt target |
| F-16 directory cap | FAIL | scaffold gate directory grows 43 → 48 direct children against cap 12 and the explicit debt target |
| F-2 shared helper | PASS | one `resolveResourceEnvironment`/`renderDeclaredEnvironmentLines` path serves plugin and service generators |
| F-3 layering/mechanical architecture | PASS | `arch:check` exit 0; no new mechanical failure |
| F-5/F-6/F-7 public/JSR/docs | PASS | doc lint and publish dry-run exit 0; canonical/alias contract documented |
| F-10 test shape | FAIL | findings F1-F3 identify topology-as-behavior, test-owned precedence semantics, and a hardcoded resource subject |
| Unsafe type escape | PASS | added diff contains no explicit `any`, `as any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, or unsafe boundary cast; const assertions are compile-time literal narrowing only |
| Suppressions/skips | PASS | no added lint suppression, `.skip`, `.only`, `ignore: true`, or final `--no-check`; the full suite's two skips are unchanged issue-#1398 deferrals |
| Generated helper mutation | PASS | the consumer fixture writes `appsettings.json` and invokes the generator; it does not hand-edit `aspire/.helpers/**` |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | ---: | --- |
| New entries | 0 | no debt-file change |
| Resolved entries | 0 | no debt-file change |
| Deepened violations | 2 | AP-1/F-1 file length and F-16 folder cardinality |
| Unrecorded/unchanged delta | 2 | existing entry still describes 906 lines / 43 children and requires a split before this gate |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `FAIL_FIX` |
| Rationale | Acceptance items 3 and 4 are not proven; the E2E path hardcodes its subject; the A6 scaffold-runtime debt is deepened past its stop condition; process artifacts do not match the governing archetype or commit history. Green commands do not make the missing behavioral evidence pass. |

VERDICT: FAIL_FIX
