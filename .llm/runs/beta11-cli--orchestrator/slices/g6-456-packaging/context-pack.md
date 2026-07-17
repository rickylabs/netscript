# Context Pack: G6 #456 native packaging and release server

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g6-456-packaging` |
| Branch         | `feat/desktop-frontend-456-packaging`              |
| Current phase  | `plan-eval`                                        |
| Archetype      | `6 — CLI / Tooling`                                |
| Scope overlays | `service` for the release HTTP handler             |

## Current State

Research, the full plan, and the mandatory Design checkpoint are complete against integration SHA
`e6e1be08`. No product implementation exists. The next allowed event is the supervisor's group
Plan-Gate verdict; implementation must not begin before PASS.

## Completed

- Activated and read `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
  `netscript-cli`, `jsr-audit`, `netscript-deno-toolchain`, plus the required RTK guide.
- Read `workflow/run-loop.md`, activation/lane policy, A6 and service overlay gates, plan protocol,
  relevant doctrine/debt, and run templates.
- Read the live #456 body including all three amendments; selected owner-ratified Option A.
- Read PR #822 and parent kickoff, plus G2 #841 and G4 #452 research/plan/context artifacts.
- Ran `deno doc` on the SDK auto-update surface before designing the server layout.
- Verified the exact SDK URL composition/constants/manual event and the exact #452 task hook.
- Verified Deno 2.9.3 native targets/formats/compression/output behavior and current upstream
  `--all-targets`/signed-manifest source behavior.
- Captured the CLI JSR/doc/publish baseline and locked four contract-first commit slices.

## In Progress

- Bootstrap plan-only commit, push, draft PR metadata, and required readiness comment.

## Next Steps

1. Commit and push only this nested plan/design checkpoint.
2. Open the draft PR against `feat/desktop-frontend`, apply the required labels/milestone, and post
   `Plan & Design — READY FOR REVIEW` with artifact and baseline evidence.
3. Stop. The Fable 5 supervisor owns Plan-Gate review/evaluator dispatch.
4. After an explicit group Plan-Gate PASS, implement slice 1 only, then commit/push/comment/pause
   for Tier-A review before any later slice.

## Key Decisions

| Decision                                           | Source                    | Notes                                                                                  |
| -------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| #452 task hook is the only package invocation seam | plan D2–D3 / G4 D6        | Default `desktop:package`; no direct entrypoint reconstruction.                        |
| NetScript expands all six targets                  | plan D4 / upstream source | Every actual Deno invocation uses explicit `--target` and `-o`.                        |
| Native payload/envelope remains canonical          | plan D12–D14              | `manifestVersion`/`sequence` are compatible trusted additions; graph later extends it. |
| Release server owns strict high-water              | plan D16–D17              | Private route state, safe sequence burn, no updater journal.                           |
| SDK constants/client define route parity           | plan D10–D11              | No copied OS/arch/default-channel strings.                                             |
| Windows stays manual                               | plan D20 / #35269 / #841  | Existing manual event and trusted installer URL; no fake apply.                        |
| No new JSR export                                  | plan D21                  | Command/file/HTTP surface only.                                                        |

## Files Changed

| Path                                                                         | Status | Notes                                                          |
| ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/supervisor.md`   | new    | Nested identity, routes, hard stop-lines.                      |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/research.md`     | new    | Live/upstream/repo re-baseline and JSR scan.                   |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/plan.md`         | new    | Locked scope, decisions, risks, gates, dependency/drift watch. |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/worklog.md`      | new    | Mandatory Design checkpoint and baseline evidence.             |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/context-pack.md` | new    | Resumable plan handoff.                                        |
| `.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/drift.md`        | new    | Append-only authority/upstream drift.                          |

## Gates

| Gate family | Current status                  | Evidence                                                                       |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Static      | PLAN BASELINE PASS              | clean base; SDK `deno doc`; CLI doc lint and raw publish dry-run pass.         |
| Fitness     | READY_FOR_REVIEW                | A6/service/doctrine selection; JSR baseline recorded; full gate matrix locked. |
| Runtime     | RESEARCH PASS / PRODUCT NOT_RUN | Deno help/source verified; implementation blocked by Plan-Gate.                |
| Consumer    | DESIGN PROOF                    | #452 hook and #841 client/manual seam verified; implementation tests planned.  |

## Open Questions

- None that force implementation rework. The supervisor may approve or request a plan revision; no
  deferred item is allowed to leak into an implementation slice without recording drift.

## Drift and Debt

- Drift: Option A sequencing, current native format support, and upstream all-target omission are
  recorded in `drift.md`.
- Debt: no new debt planned; existing CLI Restructure/vocabulary/cardinality baselines remain
  unchanged and must not grow.

## Commits

- Plan/design commit and draft PR are pending at the time this context pack was written. After
  creation, the draft PR commit list and phase comments become the canonical trail.
