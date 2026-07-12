# Dev Dashboard Revamp — Claude Design Prompts (v3)

Run `dashboard-design--orchestrator` · umbrella PR #685 · 2026-07-12.

Six self-contained, paste-ready prompts for claude.ai/design against the existing project
(`NetScript Dev Dashboard.dc.html`, NS One design system attached). Paste ONE prompt per design
conversation, in order — P1 locks the shell/routing frame the others plug into.

| # | File | Concern | Screens produced |
|---|---|---|---|
| P1 | `01-shell-ia-routing.md` | App shell, sidebar IA, locked route tree, breadcrumbs, ⌘K, Home | shell + `/` |
| P2 | `02-investigation-spine.md` | Correlation journey + Run Inspector + entity deep-links | `/flow`, `/flow/:id`, `/runs`, `/runs/:id` |
| P3 | `03-capability-consoles.md` | Workers (jobs+polyglot tasks), Sagas, Triggers, Streams — list→detail→leaf, full writes | `/workers/*`, `/sagas/*`, `/triggers/*`, `/streams/*` |
| P4 | `04-control-plane.md` | Runtime config workspace, Config topology, Catalog detail, Data group (migrations/DLQ/auth) | `/runtime/*`, `/config/*`, `/catalog/*`, `/migrations/*`, `/dlq/*`, `/auth/*` |
| P5 | `05-ai-surface.md` | Distributed AI: embedded assists everywhere + AI console | `/ai`, `/ai/runs/:id`, assist slots on all screens |
| P6 | `06-extension-platform.md` | Plugin registry + extension lifecycle + scaffold-from-UI | `/plugins/*`, `/extensions/*` |

## Shared hard constraints (every prompt embeds them; reviewers reject violations)

1. **Final product only.** No "coming soon", no beta/version-gated copy, no preview banners, no
   milestone references. Every capability renders fully implemented. Honesty about build status
   lives in the tracker, never in the design.
2. **The locked route tree** (see `../analysis/routing-resort.md`) is non-negotiable: path params
   = identity, query params = view state, breadcrumbs derived from the pathname, sidebar =
   Overview / Capabilities / Data / System with derived-stat badges. Every selection addressable.
3. **Satellite doctrine:** no owned trace waterfall / span gantt / log tail / metrics charts /
   resource start-stop / API try-it — those are out-links to the Aspire dashboard and Scalar. The
   journey view stays a causal seam chain, never time-proportional.
4. **Every mutation** follows plan → diff → exact CLI equivalent → confirm → result (+ undo/next
   step where meaningful). The CLI-transparency line is the product signature.
5. **NS One design system:** `ns-*` tokens/components only, warm-cream light default +
   `[data-theme='dark']`, mono ids, hard-offset press shadows, `prefers-reduced-motion` fallbacks,
   `STATUS_VARIANT` map (`completed→success, running→primary, failed→destructive,
   retrying|degraded|compensating→warning, queued→muted`).
6. **One canonical fixture** everywhere: Stripe webhook `POST /webhooks/stripe` → trigger event
   `evt_2210` → `PaymentWebhookSaga` (correlates on the charge id `ch_3QK9dR2eZ`) → job
   `reserve-inventory` (`job_4183`, attempt 2/3) → stream `payment-events` (`msg_88f`, 2/3
   delivered · 1 failed). Same ids on every screen; every cross-link resolves.
7. **Public framing:** never name internal reference applications or internal process artifacts in
   the produced screens' copy. AI fixtures use neutral model labels (e.g. `ops-model-large`),
   never real vendor model ids.
8. **Retire-list:** `ns-waterfall` and `ns-preview-tag` are removed from the system — any screen
   that renders either is a defect (waterfall violates the satellite doctrine; preview tags
   violate final-product framing).
9. **CLI invariant (hard):** an `ns-confirm` without a populated CLI-equivalent line is a defect,
   not a styling choice — the CLI block is a required slot on every mutation dialog.
10. **Numbers reconcile:** every stat/count/id is drawn from the one canonical fixture and the
   derived-stats rules in the POC ground truth; two screens showing different values for the
   same fact is a defect.
11. **CLI verbs are canonical, not decorative.** Every CLI-equivalent line in a confirm dialog
   names a real (or explicitly issue-tracked) verb. The CLI foundation ships in the
   CLI-features-coverage epic #701 (beta.9, children #702–#712) — the dashboard (beta.10)
   consumes it. Each prompt ends with a "CLI dependency map" table; verbs marked
   `pending #70X` do not exist yet — the design keeps the line, the issue delivers the verb.
   Full 40-surface mapping: `../reference/cli-correlation-report.md` +
   `../coverage-matrix.md` §CLI overlay.

## Grounding artifacts (same run dir)

`../screen-catalog.md` (current prototype ground truth + screenshots), `../analysis/routing-resort.md`
(locked hierarchy), `../analysis/plugin-extension-architecture.md`, `../analysis/codex-ux-dx-verdict.md`
+ `codex-routing-steal-list.md`, `../analysis/glm-design-pass.md`, `../design-project/feedback/`
(prior 13-screen review + POC ground truth), `../reference/aspire-deck-research.md`.
