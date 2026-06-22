# Context pack — docs-v4-ia-deepening (resumable)

**Status:** PLAN gate **DUAL-PASS (cleared 2026-06-22)** — hard stop lifted. Build phase (W0–W6 +
R0 seam) is unblocked. Branch reconciled to `799e164a` (OpenHands eval trace, clean: plan-eval.md +
run trace only, no lock/source churn).

## Where we are
- Phase-0 grounding scouts DONE (`wf_090ee054-3d5`): links, seams, diagrams, competitors.
- Plan LOCKED: `plan.md`, `ia-tree.md` (3-level Capability-Hub IA), `seam-coverage.md`,
  `research.md`, `drift.md` (D1 process failure, D2 saga symbol, risk register RR-1/RR-2).
- User decision (2026-06-22): build the better-auth `plugins` passthrough (R0) + record the
  seamless-auth roadmap R1–R5 in `arch-debt.md` (DONE).
- Branch `docs/v4-ia-deepening`, **Draft PR #107** (planning only).

## Layered PLAN gate — RESOLVED (dual-PASS)
- **Layer A — OpenHands minimax-M3 PLAN-EVAL:** cycle 1 `FAIL_PLAN` (3 fixes, `949d1d99`) →
  cycle 2 (FINAL) = **`PASS`** (run `27938414502-1`, comment summary on PR #107). 8 source-grounded
  spot-checks; all 3 cycle-1 fixes + all 7 panel fixes verified; saga subpath correction confirmed
  (`src/public/mod.ts` has ZERO `createSagaRuntime` refs; reachable only via `./runtime`); Plan-Gate
  checklist satisfied. Verdict in `plan-eval.md`.
- **Layer B — WSL Codex adversarial panel** (`review/docs-v4-plan-panel`): `CHANGES_REQUIRED`,
  7 findings, ALL folded (`b9f46222`) and independently re-verified PASS by Layer A. Concur on the
  3 IA questions. Audit trail: `panel/fold-in.md`; thread id: `panel/codex-thread-ids.md`.
- **3 open IA questions RULED (both layers concur):** (a) Background Processing vs Durable Workflows
  = SPLIT (distinct pillars); (b) Reference = pillar-local leaves + thin global index; (c) Fresh
  Examples leaf = prose now, StackBlitz backlog.

## Immediate next — BUILD phase (two independent tracks; plan §"Build / eval / merge flow")
1. **Docs build branch** off `origin/docs/user-site` (docs live there, NOT this planning branch):
   W2 IA restructure (`_data.ts` + page moves) · W3 Web Layer 10+1 pages (Claude authoring
   workflow) · W1 link repoints · W5 gate scripts + featureGrid/diagram throw-on-missing · W0 Mermaid
   pipeline (Codex) · W6 pillar hubs. Commit-by-slice, push, PR comment, append `commits.md`.
2. **R0 seam framework PR** off `main` (separate PR, auth-better-auth): add `plugins`/
   `betterAuthOptions` passthrough to `createNetscriptBetterAuth` (Codex slice) → IMPL-EVAL → merge
   BEFORE docs documenting the R0 path go live (RR-1 ordering; else docs use "shipping in <ref>").
3. Pre-IMPL-EVAL Codex adversarial impl review of the built site → fix caveats → OpenHands
   qwen3.7-max IMPL-EVAL → reconcile lock → merge to `docs/user-site` → Pages deploy → verify live.

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
