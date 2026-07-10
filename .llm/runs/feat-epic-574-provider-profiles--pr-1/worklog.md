# Worklog: native + OpenRouter provider profiles (#577)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-provider-profiles--pr-1` |
| Branch | `feat/epic-574-provider-profiles` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Design

The locked Design checkpoint is in `plan.md` under `## Design`. It names the preserved controller
surface; provider/profile/canary vocabulary; value-free environment and process ports; finite
constants; structured canary shape; exact file/LOC budgets; S0–S4 commit slices; deferred #578–#582
scope; and the registry-based contributor path. No implementation file may be created before the
coordinator Plan-Gate approves that checkpoint.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | S0 | pre-flight | Direct fetch failed on stale origin refspec; scoped integration/feature fetch succeeded. HEAD descends `93eb4f02`; integration 0/1, feature remote 0/0. |
| 2026-07-10 | S0 | research/design | Re-baselined merged controller and current primary provider/profile docs; no implementation performed. |
| 2026-07-10 | S1 | implementation | Added finite runner/provider profiles and OpenRouter presets; removed only #577 route deferral while preserving #578 and #580 blocks. |
| 2026-07-10 | S2 | implementation | Added late-bound child environment policy and adapter; credential values exist only in the fresh child env passed directly to `Deno.Command`. |
| 2026-07-10 | S3 | implementation | Wired supported Claude model/base-route env and Codex named profile mechanisms; custom Claude explicitly reports Remote Control unavailable and experimental non-Anthropic behavior. |
| 2026-07-10 | S4 | implementation | Added runnable read-only canaries that reduce private JSONL to structured evidence and block fan-out unless tools, reasoning, and streaming are all observed supported. |

## Provider slug verification

Verified 2026-07-10 against current OpenRouter model pages:

- `minimax/minimax-m3`
- `z-ai/glm-5.2`
- `x-ai/grok-4.5`

All three planned slugs were current; no registry correction or slug drift was required.

## Gate Results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Plan-Gate | APPROVED | Coordinator approval received in the existing implementation thread before S1. |
| Implementation/static/runtime gates | PASS | Per-slice evidence below; final complete runtime and wrappers green. |
| Secret hygiene | PASS (plan slice) | Artifacts name environment keys only and contain no credential values. |
| Dependency/lock hygiene | PASS (plan slice) | No dependency or `deno.lock` change. |
| S1 focused tests | PASS | Exit 0; 30 passed, 0 failed across profile, provider-adapter, and planner suites. |
| S1 scoped check/lint/fmt | PASS | Exit 0 each; 22 files selected, zero findings. |
| S1 patch/secret/lock | PASS | `git diff --check` clean; new profile/run artifacts contain no credential value; `deno.lock` unchanged. |
| S1 LOC | PASS | profile 161; provider adapter 113/280; ports 220/300; planner 350/420; contract 221/250; tests <=436/450. |
| S2 focused tests | PASS | Exit 0; 10 passed, 0 failed across child-environment and profile suites. |
| S2 scoped check/lint/fmt | PASS | Exit 0 each; 24 files selected, zero findings. |
| S2 environment invariant | PASS | Fresh child env clears rivals and contains only selected target binding; injected parent map is unchanged; missing credential does not spawn. |
| S2 patch/effect/secret/lock | PASS | `git diff --check` clean; no `Deno.env.set/delete`; `Deno.env`/`Deno.Command` only under adapters; credential scan clean; lock unchanged. |
| S2 LOC | PASS | child adapter 161/300; ports 235/300; profile registry 174/280; focused test 101/450. |
| S3 focused tests | PASS | Exit 0; 19 passed, 0 failed across runner-profile, child-env, and adapter suites; compatibility wrappers 2/0 with required permissions. |
| S3 scoped check/lint/fmt | PASS | Exit 0 each; 26 runtime files selected, zero findings. Targeted wrapper `deno check --unstable-kv` also exits 0. |
| S3 provider mechanisms | PASS | Claude uses `--model`, OpenRouter Anthropic base `https://openrouter.ai/api`, child auth token plus explicit empty native key; Codex writes a credential-free mode-0600 named profile with Responses base and selects it using `--profile`. |
| S3 custom Claude | PASS | Credential-free HTTPS base URL validation; result metadata reports `remoteControl: unavailable` and `experimentalNonAnthropicModel: true`. |
| S3 patch/effect/secret/lock | PASS | `git diff --check` clean; no parent mutation API; runtime effects remain adapter-only; credential scan and lock proof clean. |
| S3 LOC | PASS | provider 128/280; ports 246/300; planner 350/420; Claude 115/300; Codex 249/350; profile adapter 94/300; focused test 224/450. |
| S4 focused tests | PASS | Exit 0; 48 passed, 0 failed across canary, deferred-boundary, profile, environment, adapter, and planner suites. |
| S4 complete runtime | PASS | Final authoritative run: exit 0; 70 passed, 0 failed with required temp read/write permissions. Initial no-permission attempt reached 67/70 and had three `NotCapable` setup errors only; it is not the verdict. |
| S4 compatibility wrappers | PASS | Exit 0; 2 passed, 0 failed. |
| S4 scoped check/lint/fmt | PASS | Final exit 0 each; 30 runtime files selected, zero findings. Targeted canary/wrapper check also exits 0. |
| S4 canary behavior | PASS | Credential absence blocks without spawn; private output reduces to safe counts; malformed/timeout/process failure/unknown/unsupported capability blocks or fails with finite diagnostics; only complete observed compatibility is eligible. |
| S4 deferred boundaries | PASS | #578 live evidence and every provider lifecycle apply/#580 repair block still fire; #579/#581/#582 remain absent capabilities, not hidden implementations. |
| S4 patch/effect/secret/lock | PASS | `git diff --check` clean; no credential-shaped value; no parent mutation; adapter-only runtime effects; `deno.lock` unchanged. |
| S4 LOC | PASS | canary adapter 228/320; canary contract 132; canary test 160/450; deferred test 119/450; provider 128/280; ports 246/300; planner 350/420. |

## Reconcile Notes

- **S1:** PR #586 remains the sole resolving PR for #577 with `Closes #577`. No new reviewer
  comments changed scope. #578 Antigravity live evidence and #580 lifecycle apply remain explicit
  `capability_deferred` results; #579/#581/#582 code was not touched.
- **S2:** S1 PR comment is present. No coordinator/reviewer comment changed scope. Environment
  injection stays adapter-only and value-free above the spawn edge; no #578–#582 behavior changed.
- **S3:** S2 PR comment is present. Current OpenRouter Claude documentation requires
  `ANTHROPIC_API_KEY` to be explicitly empty (not merely absent), so the child-only policy now
  models safe empty keys. This is a compatibility correction within L6/L7, not expanded scope.
- **S4:** S3 PR comment is present. No reviewer comment changed scope. The read-only canary CLI is
  a thin operational edge over the planned adapter so the acceptance canary is directly runnable;
  it has no filesystem-write or network permission and retains no raw provider output.

## Handoff Notes

- Coordinator should inspect L5–L11 and the S2/S4 gates first: these are the credential and
  false-green boundaries.
- The current Codex custom-provider wire is Responses-only; OpenRouter runner compatibility is a
  canary outcome, not a planning assumption.
- Implementation is complete; coordinator Tier-A substantive review is required before sign-off.

## Coordinator Tier-A Sign-off (2026-07-10, Claude Opus 4.8)

Substantive review of S1-S4 (`338b5ed2`, `51d96cf4`, `11521018`, `8524e252`, diff `e035d727..8524e252`,
27 files) with independent re-verification:
- Parent-environment invariant: NO `Deno.env.set/delete` in runtime; effects confined to `adapters/`.
- Child-only credential injection: `child-process-environment-adapter.ts` starts a fresh child env
  (`clearEnv:true`), explicitly clears rival keys, late-binds only the selected credential, and returns
  no output/credential data; value-free `ChildEnvironmentPolicy` (no value representable in plan/result).
- Custom `ANTHROPIC_BASE_URL` → `remoteControl:'unavailable'` + `experimentalNonAnthropicModel`, derived
  from route kind (claude-adapter.ts:110-111), not probe success.
- Canaries fail closed on credential-absent/malformed/timeout/unsupported (`blocked`/`failed`,
  `fanOutEligible:false`).
- Boundary regression: `deferred-boundaries_test.ts` keeps #578 & #580 blocked and #579/#581/#582 absent.
- Gates re-run by coordinator: full runtime suite `70/0`; scoped check `30/0`; scoped lint `30/0`;
  secret scan on diff clean; `deno.lock` unchanged.

Verdict: PASS. Generator did not self-certify; sign-off is the coordinator's. Push verified authoritative
(`git ls-remote` == local `8524e252`).
