# Context Pack: G2 #841 SDK auto-update

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |
| Branch | `feat/desktop-frontend-841-autoupdate` |
| Current phase | `plan-eval` (awaiting supervisor-triggered separate session) |
| Archetype | `4 — Public DSL / Builder` with integration/runtime subtype gates |
| Scope overlays | none |

## Current State

Research, the locked plan, and the Design checkpoint are complete. The branch is still code-identical
to integration except for these nested run artifacts. Implementation is hard-stopped until the Fable
5 supervisor triggers the group PLAN-EVAL and records `PASS`.

## Completed

- Read all six named skills, activation/run-loop/lane policy, Plan-Gate/protocol, archetype profiles,
  relevant doctrine, debt registry matches, and templates.
- Read live #841, #840, #456, #457, PR #822 RFC, rev 10 plan, parent beta.11 plan/brief, and live
  upstream #35939/#35269.
- Used `deno doc` before focused SDK/telemetry source reads.
- Confirmed branch baseline `ca72db14` equals `feat/desktop-frontend` and `origin/main` at start.
- Ran current SDK JSR/doc baseline and recorded the one unrelated transitive doc-lint diagnostic.
- Locked three implementation slices and the complete Design checkpoint.

## In Progress

- Commit/push the plan artifacts, open the required draft sub-PR, apply metadata, and post
  `Plan & Design — READY FOR REVIEW`.

## Next Steps

1. Supervisor triggers a separate open-model PLAN-EVAL; this session does not dispatch it.
2. If verdict is `FAIL_PLAN`, revise only the plan/design and return for another supervisor gate.
3. If verdict is `PASS`, implement slice 1 exactly as designed, then run gates and hand it to the
   supervisor for substantive review before sign-off.

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
| `.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/plan-eval.md` | new | Pending placeholder for supervisor-owned evaluator. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline only | SDK raw publish dry-run PASS; doc-lint baseline recorded. |
| Fitness | planned | Complete F-/quality/architecture gate set in plan.md. |
| Runtime | planned | Fixture matrix in design; real native E2E belongs #457. |
| Consumer | planned | Public subpath compile fixture in slice 3. |

## Open Questions

- None that force implementation rework. All deferred decisions are explicitly marked safe in
  `plan.md`.

## Drift and Debt

- Drift: rev 10 superseded for native thin-client authority; upstream version property rename;
  local Deno patch version differs from skill prose.
- Debt: no new/deepened SDK debt planned. Preserve the unrelated transitive doc-lint baseline.

## Commits

- See the draft PR's commit list + per-slice PR comments after the plan commit is pushed.

