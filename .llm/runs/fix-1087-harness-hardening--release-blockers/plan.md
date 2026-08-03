# Plan: release-blocking harness hardening (#1087, #1084, #1080, #1083)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1087-harness-hardening--release-blockers` |
| Branch | `fix/1087-harness-hardening` |
| Phase | `plan` |
| Target | internal agentic tooling, CI, and 0.0.4 release notes |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` for #1083 and harness/run documentation |

## Archetype

Archetype 6 is the smallest fit because `.llm/tools/agentic/` is an internal CLI/tooling control
system with provider/process adapters and human-facing commands. This slice does not change the
published `@netscript/cli` package, so package-shape and JSR-only gates are N/A. The docs overlay
applies to the release intro and harness guidance.

## Current Doctrine Verdict

The published `@netscript/cli` remains `Restructure`, but this slice does not edit it. Internal
agentic tooling already documents a ports-and-adapters control-system shape; new code must preserve
its adapter boundaries and avoid process/network access outside edge modules.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 / A4 | Model policy and publication ownership are finite typed contracts, not prompt prose. |
| A5 / A9 | Cost and issue-closing safety fail closed at the actual side-effect boundary. |
| A11 | Network/process/file side effects stay in Claude/GitHub/validation adapters and CLIs. |

## Goal

Land four independently evidenced commits, in issue priority order, then obtain a separate
open-model IMPL-EVAL and drive one draft PR to ready-for-merge without weakening evaluator route
invariants or silently skipping Redis regressions.

## Scope

- Guard all local formal-evaluator inference requests against `OPEN_EVALUATOR_MODEL_IDS`, abort and
  log a prohibited child request with model and requesting session.
- Make `agentic:gh-pr` stage every publication body in a unique session directory and verify its
  ownership/fingerprint before use; update active guidance.
- Give `check-test` a healthy Redis service and explicit URL, run the two integrations visibly, and
  run a negative-control mutation that removes #1075 serialization and must make those tests fail.
- Add the hand-authored 0.0.4 release intro with a Breaking Changes entry and prove live references
  to the removed option are absent.
- Mirror exact acceptance evidence to the PR/issues only after commands and CI prove it.

## Non-Scope

- Loading or exposing the OpenRouter credential value.
- Changing the approved open-model set or the formal evaluator route.
- Refactoring Redis connection pooling or the saga/Redis production implementation.
- Cutting or publishing 0.0.4; this slice supplies release-note input only.
- Running `scaffold.runtime`; these changes do not touch its owned surfaces and the user forbids
  concurrent execution.

## Hidden Scope

- The child guard must preserve streaming requests/responses and non-secret headers.
- Runtime output capture currently drains child output; prohibited attempts therefore need a
  dedicated redacted JSONL audit path in addition to stderr.
- The gh-pr task needs scoped write permission for its session staging root.
- The Redis negative control must restore the adapter in `finally`, verify the mutation matched
  exactly, and treat a missing executable as a hard failure rather than a non-zero result.
- Draft close-gate remains intentionally red until issue acceptance boxes have linked evidence.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Insert a loopback Anthropic-compatible request guard for the bound local evaluator; exact model ids come only from `OPEN_EVALUATOR_MODEL_IDS`. | It constrains the spawned environment's actual request path, including child agents, rather than trusting a prompt or only the launch route. |
| D2 | The wrapper owns a UUID session id, passes it to Claude, logs only event/model/session/path-safe metadata, returns 403, kills the evaluator, and exits non-zero on violation. | This makes an attempted paid spawn loud, attributable, and terminal without credential/body leakage. |
| D3 | Guard only the formal-evaluation preset selected by the runtime adapter; ordinary OpenRouter design/workflow routes keep their existing semantics. | The cost invariant is evaluator-specific; widening behavior would be unplanned. |
| D4 | `gh-pr` stages inline or file content under `.llm/tmp/agentic/gh-pr/<session>/`, stores owner+SHA-256 metadata, and refuses owner/fingerprint mismatch before network publication. | The exact published artifact is written and verified by the current invocation, with collision-free paths. |
| D5 | Active templates/guidance require `.llm/tmp/<run-id>/<session-id>/...` for publication scratch; durable PR bodies may live in the run directory. | Concurrent slices cannot share one filename, while durable harness artifacts remain reviewable. |
| D6 | CI uses `redis:7-alpine` with health checks and a job-level `NETSCRIPT_TEST_REDIS_URL`; an explicit integration runner fails if the variable is absent. | A missing service/config cannot degrade to green skips. |
| D7 | CI also runs an isolated negative control that mechanically removes exactly #1075's `atomicTail` serialization, runs both real-Redis files, requires non-zero, and restores the source in `finally`. | This permanently proves regression sensitivity without a bad commit or force-push. |
| D8 | The 0.0.4 intro lives in this tracked run directory and is the intended `release:publish --notes-file` input. Historical run logs are evidence, not lingering live docs/generated references. | Matches established release workflow and keeps the breaking note tied to the release slice. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Missing/non-string `model` on an inference request | resolved now | Reject and abort on the messages endpoint; non-inference endpoints may pass through. |
| Whether prohibited child use may continue after a 403 | resolved now | No; kill the evaluator parent and return a dedicated non-zero exit. |
| Redis server version | resolved now | `redis:7-alpine`, matching the stable protocol required by the adapter tests. |
| Historical `assertResolvable` run evidence | safe to defer / preserve | Do not rewrite immutable evidence or logs; exclude them from the live-surface absence check. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Proxy breaks streaming/body forwarding. | Unit-test allowed/rejected requests through a local fake upstream and run the existing Claude adapter/provider suites. |
| Guard is bypassed on resume. | Use the same guarded wrapper path and explicit resumed session id for launch and resume tests. |
| Audit log leaks headers/body. | Schema contains only fixed event name, requested model, requesting session, and timestamp; tests assert secret-shaped input is absent. |
| gh-pr staging becomes a cosmetic copy. | Verify owner id and SHA-256 immediately before `buildPullRequestBody`; cross-session/tamper tests must fail. |
| CI says Redis ran but tests still skip. | Explicit runner requires env, prints targeted test names/output, and job summary records the lane. |
| Negative control corrupts checkout. | Exact transform count plus `try/finally` byte-for-byte restore; root suite runs after restoration. |
| Close-gate keywords close unmet issues. | Keep PR draft/status:impl until linked evidence exists; tick nothing without command/run proof. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 / AP-25 | risk | Keep HTTP/process/file effects in Claude/GitHub/validation edge modules. |
| AP-18 | risk | Assert semantic ownership/model decisions, not large output snapshots. |
| AP-21 | risk | Add focused modules beside their concern rather than expanding existing CLIs into monoliths. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static | yes | scoped check/lint/fmt wrappers over `.llm/tools/agentic` and validation scripts; root `deno task check`. |
| F-1/F-3/F-5/F-10/F-11/F-12 | yes/manual | focused file size, layering, public surface, test-shape, naming and side-effect review. |
| Agentic guard tests | yes | `deno test --allow-all .llm/tools/agentic/`, including volatile/routing guards and new child/publish tests. |
| Redis integration | yes | explicit real-Redis targeted run, root package suite, and negative-control non-zero evidence. |
| Docs overlay | yes | source alignment, terminology, link/path checks, and live-surface `rg` absence proof. |
| JSR/publish/scaffold runtime | no | No published export or scaffold/runtime surface changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none expected | No intentional doctrine violation or deferred implementation is planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | #1087 focused | new proxy/wrapper/adapter tests + routing-policy and no-hardcoded-volatile tests | prohibited request logs id/session, aborts, allowed open request streams; existing Gemini rejection remains green |
| 2 | #1084 focused | publication staging tests + `agentic:gh-pr create --dry-run` | concurrent paths unique; cross-session/tamper refused |
| 3 | #1080 focused | Redis service + explicit runner + negative control | current code passes both files; serialization-removed code fails; absent env fails before test launch |
| 4 | #1083 focused | live-surface `rg` + release-note review | Breaking Changes names removal and fail-fast startup; no live stale ref |
| 5 | required static | `deno task check`; scoped check/lint/fmt wrappers | zero findings |
| 6 | full agentic | `deno test --allow-all .llm/tools/agentic/` | all tests pass, including config/routing guards |
| 7 | package blast radius | `deno test --allow-all packages/kv packages/plugin-sagas-core` with Redis URL | package suites pass, real Redis tests run |
| 8 | CI/close gate | GitHub check-test/quality/close-gate and acceptance mirror | final head green; close-gate only after evidence boxes are mirrored |

## Dependencies

- Deno 2.9, local Claude CLI, GitHub Actions services, and Redis protocol service.
- No credential value is needed in code, tests, logs, artifacts, or commands.

## Drift Watch

- Any Claude request shape that does not carry `model` on the messages endpoint.
- Any active template/shared scratch literal missed by the repository sweep.
- Any Redis regression file not reached by the root test task.
- Any issue acceptance criterion that cannot be supported by an observed command or CI URL.
