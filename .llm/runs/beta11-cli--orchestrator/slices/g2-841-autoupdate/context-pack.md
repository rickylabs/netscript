# Context Pack: G2 #841 SDK auto-update

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |
| Branch | `feat/desktop-frontend-841-autoupdate` |
| Draft PR | [#849](https://github.com/rickylabs/netscript/pull/849) → `feat/desktop-frontend` |
| Current phase | `gate` — implementation complete, awaiting supervisor IMPL-EVAL dispatch |
| Archetype | `4 — Public DSL / Builder` with integration/runtime subtype gates |
| Scope overlays | none |

## Current State

Slices 1 and 2 received Tier-A substantive review `PASS`. Slice 3 is implemented and green: the
public consumer fixture, README/doctest, full JSR evidence set, full SDK test directory, and all
static/fitness gates pass with only explicitly preserved unrelated baselines.

## Completed

- Read all six named skills, activation/run-loop/lane policy, Plan-Gate/protocol, archetype profiles,
  relevant doctrine, debt registry matches, and templates.
- Read live #841, #840, #456, #457, PR #822 RFC, rev 10 plan, parent beta.11 plan/brief, and live
  upstream #35939/#35269.
- Used `deno doc` before focused SDK/telemetry source reads.
- Confirmed branch baseline `ca72db14` equals `feat/desktop-frontend` and `origin/main` at start.
- Ran current SDK JSR/doc baseline and recorded the one unrelated transitive doc-lint diagnostic.
- Locked three implementation slices and the complete Design checkpoint.

## Implementation State

- Plan artifact commit `c7e61dcc` is pushed.
- Draft PR #849 targets `feat/desktop-frontend`, is draft, carries `Closes #841`, has all five
  required labels, and is assigned milestone 13 (`0.0.1-beta.11`).
- `Plan & Design — READY FOR REVIEW` was posted on PR #849.
- Plan-Gate: `PASS` delivered by supervisor session
  `86d308d5-c761-4e5d-a41f-8be959bc46d2` on 2026-07-18.
- PR lifecycle label transitioned from `status:plan` to the sole `status:impl` label.
- S1 commit `d2321cae` received Tier-A sign-off.
- S2 full SDK test directory passed 28/28 alongside all scoped quality gates.
- S2 commit `35f3b726` received Tier-A sign-off.
- S3 consumer compile, README doctest, full-export lint, raw publish dry-run, and no-text-import
  preflight are complete.

## Next Steps

1. Commit and push slice 3 with the explicit refspec.
2. Post `IMPLEMENTATION COMPLETE` with the final evidence table on PR #849.
3. Stop; the supervisor dispatches the separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Option A native updater for thin client | live #840/#841 and PR #822 | Supersedes rev 10 only for this tier. |
| One SDK subpath seam | #841 + parent plan | Apps never consume old/new Deno globals. |
| Required app-config key/manual URL | plan D3 | Public key and Windows link are trusted compile-time inputs. |
| Old and proposed namespace support | #35939 | Proposed property is `appVersion`, not `desktopVersion`. |
| Windows manual event | #35269 + plan D8/D9 | One capability constant later flips classification. |
| E2E delegated | #457 | No native packaging/apply/rollback proof in this PR. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/supervisor.md` | new | Nested identity/routes/stop-lines. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/research.md` | new | Re-baseline and JSR surface scan. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/plan.md` | new | Locked decisions, risks, gates, scope. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/worklog.md` | new | Design checkpoint and baseline evidence. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/context-pack.md` | new | Resumable state. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/drift.md` | new | Rev 10/upstream/toolchain drift. |
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/plan-eval.md` | modified | Tier-A Plan-Gate PASS and its two implementation notes. |
| `packages/sdk/src/auto-update/` | new | Release domain, pure client, structural Deno target adapter, and public subpath. |
| `packages/sdk/tests/auto-update/release-client_test.ts` | new | URL/trust/isolation tests. |
| `packages/sdk/mod.ts` | modified | Documents the focused subpath without re-exporting it. |
| `packages/sdk/deno.json` | modified | Adds `./auto-update` export and package check entrypoint. |
| `packages/sdk/src/auto-update/application/start-auto-update.ts` | new | Launch and interval orchestration over internal ports. |
| `packages/sdk/src/auto-update/adapters/netscript-rollback-telemetry.ts` | new | NetScript rollback telemetry adapter. |
| `packages/sdk/src/auto-update/adapters/deno-auto-update-adapter.ts` | modified | Resolves old and proposed native updater namespaces. |
| `packages/sdk/src/auto-update/domain/constants.ts` | modified | Apply/status/reason/capability/telemetry constants. |
| `packages/sdk/src/auto-update/domain/types.ts` | modified | Policies, events, callbacks, and start results. |
| `packages/sdk/tests/auto-update/start-auto-update_test.ts` | new | Runtime, policy, platform, and telemetry matrix. |
| `packages/sdk/tests/type-fixtures/auto-update-consumer_type.ts` | new | Real public-subpath consumer compile proof. |
| `packages/sdk/tests/readme-doctest_test.ts` | modified | Type-checks the documented auto-update bootstrap example. |
| `packages/sdk/README.md` | modified | Checked 80% path, permissions, platform behavior, and #457 boundary. |
| `packages/sdk/src/auto-update/mod.ts` | modified | JSR landing example uses `startAutoUpdate`. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | final PASS | Full SDK 28/28; consumer compile; scoped check/lint/fmt all zero findings. |
| Fitness | final PASS_WITH_BASELINE | Quality clean; focused doctrine WARN=0; root architecture exit 0 with unrelated repository baselines. |
| Runtime | slice 2 PASS at unit boundary | Complete structural/policy/platform matrix; native E2E remains #457. |
| Consumer | PASS | Public subpath fixture and README doctest compile. |
| JSR | PASS_WITH_BASELINE | Auto-update docs 0; raw dry-run clean; no text imports; unrelated transitive doc baseline preserved at 1. |

## Open Questions

- None that force implementation rework. All deferred decisions are explicitly marked safe in
  `plan.md`.

## Drift and Debt

- Drift: rev 10 superseded for native thin-client authority; upstream version property rename;
  local Deno patch version differs from skill prose.
- Debt: no new/deepened SDK debt planned. Preserve the unrelated transitive doc-lint baseline.

## Commits

- `c7e61dcc` — `docs(harness): plan SDK auto-update seam` (research, plan, Design checkpoint,
  baseline evidence, and pending evaluator placeholder).
- `b03c0c07` — `docs(harness): record G2 plan handoff` (PR #849 and supervisor handoff state).
- `d2321cae` — `feat(sdk): prove native release target contract` (S1, Tier-A PASS).
- `35f3b726` — `feat(sdk): prove native update orchestration` (S2, Tier-A PASS).
- Slice 3 commit is the next PR commit; its exact hash is recorded in the final PR comment, which is
  the canonical commit trail.
