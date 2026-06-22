# Context pack — docs-v4-ia-deepening (resumable)

**Status:** PLAN gate IN FLIGHT — layered. No authoring/build until BOTH layers PASS (hard stop).

## Where we are
- Phase-0 grounding scouts DONE (`wf_090ee054-3d5`): links, seams, diagrams, competitors.
- Plan LOCKED: `plan.md`, `ia-tree.md` (3-level Capability-Hub IA), `seam-coverage.md`,
  `research.md`, `drift.md` (D1 process failure, D2 saga symbol, risk register RR-1/RR-2).
- User decision (2026-06-22): build the better-auth `plugins` passthrough (R0) + record the
  seamless-auth roadmap R1–R5 in `arch-debt.md` (DONE).
- Branch `docs/v4-ia-deepening`, **Draft PR #107** (planning only).

## Layered PLAN gate — current state
- **Layer A — OpenHands minimax-M3 PLAN-EVAL:** cycle 1 = `FAIL_PLAN` (3 required fixes: saga
  symbol, risk register, W4 caveat). All 3 applied + pushed (`949d1d99`). ONE FAIL_PLAN cycle
  remaining (2-cycle budget) — cycle 2 re-dispatch is the immediate next step.
- **Layer B — WSL Codex adversarial panel** (`review/docs-v4-plan-panel`, separate session, ran on
  the FIXED plan): verdict `PANEL: CHANGES_REQUIRED`, 7 findings. Panel AGREED with OpenHands on all
  3 open IA questions. Findings file `codex-panel-findings.md` lives on the panel WSL branch (not
  pushed); the 7 findings + resolution are recorded in `panel/fold-in.md` (in-branch audit trail).
  Panel thread id in `panel/codex-thread-ids.md`.

## Immediate next (in order)
1. Commit the 7-finding fold-in (this commit) + push to `docs/v4-ia-deepening`.
2. Re-dispatch the single remaining OpenHands PLAN-EVAL cycle 2 on the fully-corrected plan.
3. On dual-PASS (Layer A PASS + Layer B addressed): open build branch, implement W0–W6.

## Workstreams (post dual-PASS)
W0 Mermaid pipeline + missing-asset + determinism/rollback gate (Codex) · W1 link fixes (repoint 2
hrefs) · W2 IA restructure (`_data.ts` + moves) · W3 Web Layer 10 export pages + 1 examples leaf
(authoring) · W4 auth pillar + R0 seam slice (Codex) · W5 process gates (caveat-harvest +
seam-coverage check scripts + featureGrid/diagram throw-on-missing) · W6 other pillar hubs.

## Key facts to not re-derive
- Live SVGs return 200; the alt-text screenshot was a deploy blip. Real defect = hand-authored SVGs
  + mmdc not wired to build + soft-degrade. Fix in W0.
- All 4 tutorials exist. Only 2 `wrong_step` links → REPOINT (not author new Track-D).
- Exactly ONE framework build-seam gap (auth plugins passthrough = R0). Everything else honestly
  seamed or documented-as-limitation.
- Saga runtime symbol = `createSagaRuntime` via the `@netscript/plugin-sagas-core/runtime` subpath
  ONLY (NOT root `.`, NOT `src/public/mod.ts`, NOT legacy `createDurableSagaRuntime`). See drift D2.
- `reference/**` untouched. Docs live on `origin/docs/user-site` (NOT on this branch).
- Push mechanism: WSL gh token → base64 Basic header → explicit refspec. Redact token output.
