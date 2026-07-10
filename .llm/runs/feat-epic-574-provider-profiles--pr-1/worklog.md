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

## Provider slug verification

Verified 2026-07-10 against current OpenRouter model pages:

- `minimax/minimax-m3`
- `z-ai/glm-5.2`
- `x-ai/grok-4.5`

All three planned slugs were current; no registry correction or slug drift was required.

## Gate Results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Plan-Gate | NOT_RUN | Coordinator owns approval; hard stop. |
| Implementation/static/runtime gates | NOT_RUN | Implementation is prohibited before Plan-Gate approval. |
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

## Reconcile Notes

- **S1:** PR #586 remains the sole resolving PR for #577 with `Closes #577`. No new reviewer
  comments changed scope. #578 Antigravity live evidence and #580 lifecycle apply remain explicit
  `capability_deferred` results; #579/#581/#582 code was not touched.
- **S2:** S1 PR comment is present. No coordinator/reviewer comment changed scope. Environment
  injection stays adapter-only and value-free above the spawn edge; no #578–#582 behavior changed.

## Handoff Notes

- Coordinator should inspect L5–L11 and the S2/S4 gates first: these are the credential and
  false-green boundaries.
- The current Codex custom-provider wire is Responses-only; OpenRouter runner compatibility is a
  canary outcome, not a planning assumption.
- Do not resume implementation without an explicit Plan-Gate approval in this same thread.
