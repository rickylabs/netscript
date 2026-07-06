# Plan & Design — READY FOR REVIEW

**Run:** `feat-dashboard-design-prototype--design` · **Supervisor:** Claude Fable 5 (session-linked in `supervisor.md`) · **Baseline:** `317e4b50` (beta.5 cut)

> **Do not merge until the Plan-Gate (PLAN-EVAL) and the final evaluator pass (IMPL-EVAL) are complete.**

## What this run delivers

The beta.6 Dev Dashboard's missing design pre-step, fully decoupled from the beta.6 implementation supervisor:

1. **`tools/design-sync/`** — production-grade, reusable converter: fresh-ui copy-source registry → Claude Design-consumable design system (synthetic React package via the type-only-Preact trick + compiled Tailwind CSS closure + conventions header + preview cards). Idempotent re-sync; the six eis-chat parity traps encoded as checks. Future promotion path: `netscript ui:design-sync` for NetScript devs (separate framework issue).
2. **New Claude Design project** seeded at 100% component parity from today's fresh-ui at baseline `317e4b50` — the stale eis-chat-era design system is abandoned (near-total divergence, not drift).
3. **Full E2E prototype** — shell + 7 panels + 4 per-capability sections, light/dark, driven agentically via the Claude Design MCP with owner steering from the canvas.
4. **Sync-back spec** (`NS-ONE-ADDITIONS` idiom) making every new/changed component implementation-ready for downstream fresh-ui lanes.

## Key findings (research.md)

- NS One L0–L2 is byte-identical to fresh-ui output; the ratified gap is the L3 `blocks/` layer (DDX-0). All current fresh-ui architecture landed 2026-06-14→07-05 — the old canvas project predates it entirely.
- fresh-ui CSS (~25KB `--ns-*` tokens + semantic classes) ports to React verbatim; only JSX/hooks need conversion, and eis-chat's `.design-sync/NOTES.md` recipe makes that mechanical.
- The seed-run corpus already holds the design research (competitor teardowns, 7-panel IA, voice rules) — this run distills, it does not re-research.

## Locked decisions

LD-1 full E2E breadth (two staged passes) · LD-2 new design system at 100% parity · LD-3 fully-agentic MCP canvas lane, owner steers, recorded fallback · LD-4 sync home `tools/design-sync/` · LD-5 decoupled run; #425 superseded-in-execution; new backlog issue · LD-6 DDX-0↔DDX-15 inversion (prototype pass 1 validates the promote-set) · LD-7 eis-chat artifact idiom + traps-as-checks. Full rationale in `plan.md`.

## Commit slices

0 canvas MCP pre-flight → 1 design-sync v1 → 2 design brief → 3 project seeding (parity gate) → 4 prototype pass 1 (flagship surfaces) → 5 re-sync checkpoint → 6 prototype pass 2 (control panels + capability sections) → 7 sync-back spec + shots + board comments.

## Risk register (top)

Claude Design MCP 404/401 flakiness (slice-0 hard gate + owner-relay fallback) · plan-token burn (brief front-loads everything; batch canvas turns) · conversion edge cases (islands/signals; exclusion list with reasons) · closure completeness (var-set diff vs DTCG source) · off-system canvas invention (conventions header + no-raw-hex rule + real-content previews).

## Gates

Static: scoped wrappers over `tools/design-sync`. Fitness: sync idempotence, parity checklist, trap checks a–f. Runtime: canvas MCP smoke. Consumer/jsr-audit: N/A — **no `packages/`/`plugins/` source changes in this run.**

## Board linkage

Part of #400 (epic: dev-dashboard, no closing keyword — umbrella). Supersedes-in-execution #425 (DDX-15): #425 stays open as the beta.6 tracking point while this run executes, and this PR resolves its (expanded) scope on merge — Closes #425.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Dgu7TfPnzpXUii84FSybbg
