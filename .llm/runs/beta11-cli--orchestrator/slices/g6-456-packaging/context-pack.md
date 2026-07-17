# Context Pack: G6 #456 native packaging and release server

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g6-456-packaging` |
| Branch         | `feat/desktop-frontend-456-packaging`              |
| Current phase  | `implement`                                        |
| Archetype      | `6 — CLI / Tooling`                                |
| Scope overlays | `service` for the release HTTP handler             |

## Current State

Research, the full plan, and the mandatory Design checkpoint are complete against integration SHA
`e6e1be08`. Plan commit `f1a0d6c3` is pushed and draft PR
[#854](https://github.com/rickylabs/netscript/pull/854) targets `feat/desktop-frontend` with the
required metadata. The Tier-A Fable 5 supervisor approved D1–D21 and delivered group Plan-Gate
`PASS`. Slice 1 commit `ffb7e896` passed Tier-A review. Slice 2 implementation and gates are
complete and ready to commit, push, and stop for Tier-A review.

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
- Opened draft PR #854 with `Refs #456` (no closing keyword), the six requested labels including the
  sole `status:plan`, and milestone 13 (`0.0.1-beta.11`).
- Recorded the supervisor's Plan-Gate `PASS`, including mandatory public-subpath URL parity and
  encoded-separator/resolve-under-root traversal tests.
- Implemented `netscript deploy desktop package` through #452's configured task hook with an
  SDK-derived six-target catalog, native format validation, explicit outputs, compression/tool
  preflight, and typed process failures.
- Passed 19 focused tests, the full CLI test directory (397 tests / 416 steps), scoped static gates,
  quality scan, root architecture check, doc lint, JSR audit/dry-run, and import-attribute scan.
- Recorded Tier-A S1 PASS for planner purity, explicit expansion, DMG preflight, exact hook argv,
  baseline attribution, and the intentional SDK lock line.
- Implemented native release preparation: external bsdiff adapter, SHA-256 patch map, exact-string
  WebCrypto Ed25519 envelope, private route high-water, OS file locking, and safe promotion order.
- Passed 28 focused desktop tests, full CLI tests (406 / 416 steps), and the complete S2 gate set.

## In Progress

- Commit/push/comment slice 2, then pause without beginning slice 3.

## Next Steps

1. Commit, push the explicit branch refspec, and post slice-2 evidence on PR #854.
2. Stop for Tier-A review before slice 3.

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

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | 698-file check/lint/fmt; doc lint 0; dry-run exit 0 with baseline warnings. |
| Fitness | PASS_WITH_BASELINE | quality and root arch pass; focused doctrine has baseline-only findings. |
| Runtime | PASS | 28 focused tests; full CLI 406 tests / 416 steps. |
| Consumer | S1–S2 PASS | Exact hook argv and native envelope/sequence composition; URL parity remains S3. |

## Open Questions

- None that force implementation rework. The supervisor may approve or request a plan revision; no
  deferred item is allowed to leak into an implementation slice without recording drift.

## Drift and Debt

- Drift: Option A sequencing, native format support, upstream all-target omission, target-axis
  placement, and guarded dependency edit are recorded in `drift.md`.
- Debt: no new debt planned; existing CLI Restructure/vocabulary/cardinality baselines remain
  unchanged and must not grow.

## Commits

- `f1a0d6c3` — `docs(harness): plan native desktop packaging` (research, locked plan, Design
  checkpoint, context, and drift).
- `ffb7e896` — `feat(cli): add native desktop packaging pipeline` (Tier-A S1 PASS).
- This metadata reconciliation commit records draft PR #854; after push, the PR commit list and
  phase comments are the canonical trail.
