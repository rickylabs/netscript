Part of #400

## What

The beta.6 Dev Dashboard's design pre-step, executed as a dedicated agentic run fully decoupled from the beta.6 implementation supervisor:

1. **`tools/design-sync/`** — a production-grade, reusable design-sync system converting the `@netscript/fresh-ui` copy-source registry into a Claude Design-consumable design system (synthetic React package via type-only-Preact compilation + compiled Tailwind CSS closure + conventions header + preview cards). Idempotent re-sync so the system survives registry evolution; the six eis-chat parity traps (theme-default, token-closure, compiled-css, weak-dts, render-blank, raw-hex) encoded as automated checks.
2. **A new Claude Design project** seeded at 100% component parity from today's fresh-ui — replacing the stale eis-chat-era design system (near-total divergence since 2026-06-14).
3. **A full E2E Claude Design prototype** of the dashboard: shell + all 7 panels (Stack Map, Service Catalog + API Explorer, Flow/Trace Waterfall, Run Inspector, Plugin Control, Logs, Resource Control) + the 4 per-capability sections (workers/sagas/triggers/streams), light + dark — used to showcase, iterate, and lock design decisions before implementation.
4. **A sync-back spec** (`NS-ONE-ADDITIONS` idiom) making every new/changed component implementation-ready for downstream fresh-ui lanes (DDX-0 promote-set amendment + follow-up issues).

## Relationship to the filed board

- **Supersedes-in-execution #425 (DDX-15).** #425 stays open as the beta.6 tracking point; the run's PR carries `Closes #425` and resolves its expanded scope on merge. DDX-5 (#415) and all panel slices are blocked on this run's delivery.
- **Inverts the DDX-0→DDX-15 edge** (owner-ratified): prototype pass 1 validates/amends the DDX-0 L3 promote-set *before* DDX-0 is implemented — the proven eis-chat two-pass loop.
- **No `packages/`/`plugins/` source changes here.** Component implementation stays on downstream WSL Codex lanes fed by the sync-back spec.

## Future promotion (recorded, not in scope)

The sync mechanism is a candidate for a `netscript ui:design-sync` CLI feature — offering NetScript devs the same fresh-ui ⇄ Claude Design loop for their own projects. To be filed separately as a framework issue when this run's tool stabilizes.

## Run

- Run dir: `.llm/runs/feat-dashboard-design-prototype--design/` (branch `feat/dashboard-design-prototype`)
- Supervisor: Claude Fable 5; canvas lane: Claude Design MCP with owner steering; PLAN-EVAL (minimax-M3) gates implementation; IMPL-EVAL (qwen-3.7-max) gates merge.
