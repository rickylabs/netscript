# Decision memo — NetScript dev dashboard (beta.7, epic #400) vs Aspire "Deck"

Date: 2026-07-11. Basis: `research.md` (all stability facts verified there).
NetScript context: dev dashboard is Fresh/Preact + `@netscript/fresh-ui`, already consumes Aspire via the resource-service gRPC (`DashboardService` proto) + OTLP.

**Stability picture in one line:** Deck is an unmerged draft on a feature branch 160 commits behind main, publicly unannounced, no milestone/release, parity partial, security review pending, nothing published to npm, no OpenAPI. Every coupling decision below is weighed against that.

## Posture A — Consume `/api/deck/*` REST/NDJSON directly

Point the Fresh dashboard at `GET /api/deck/config|resources|interactions`, NDJSON telemetry/console streams.

- **Pro:** pre-shaped JSON (server-side `DeckResourceMapper` already flattens `ResourceViewModel`); NDJSON streams are trivially consumable from Deno vs gRPC; camelCase source-generated models are internally consistent.
- **Con:** endpoints exist only on the draft branch; auth is the dashboard's **same-origin session cookie** (`FrontendAuthorizationDefaults`), which is hostile to an external Fresh app; contract is hand-maintained (`CONTRACT.md` ↔ `types.ts`), unversioned; `/api/deck/config` mostly tells you to go use the gRPC/OTLP URLs anyway.
- **Verdict:** premature. Revisit only after merge to main + a shipped release exposes them.

## Posture B — Embed Deck panels / adopt the Canvas bridge pattern

Embedding Deck itself is off the table (`@aspire/deck-ui` is private/unpublished). The reusable part is the **protocol shape**: sandboxed iframe + `postMessage` bridge (`getConfig/listResources/getTelemetrySummary/executeCommand` + `resources`/`telemetry` push events), MIT-licensed to copy.

- **Pro:** small, matches data NetScript already has; gives the NetScript dashboard the custom-panel/extensibility story epic #400 lacks; staying wire-shaped like Deck's bridge keeps a future "NetScript panel also runs as an Aspire Deck canvas" door open; agent-generated-panel framing aligns with NetScript's agentic tooling.
- **Con:** protocol may drift before merge; must respect its security model (opaque-origin sandbox, non-sensitive payloads only, `targetOrigin '*'` caveat).
- **Verdict:** good **pattern to emulate as a NetScript-owned design decision** — not a dependency on Deck.

## Posture C — Mirror the resource/telemetry contracts (contract-watching)

Track `DeckApiModels.cs`/`CONTRACT.md` shapes (esp. `DeckResource`: State/StateStyle/Health/HealthReports/Commands/Relationships/IconName…) and keep `@netscript/fresh-ui` resource types convergent, with no runtime coupling.

- **Pro:** cheap, reversible, MIT-permitted; avoids gratuitous vocabulary divergence if Deck's REST becomes the blessed dashboard API; NetScript already derives similar shapes from the same gRPC source.
- **Con:** chasing an unmerged branch has ongoing (if small) cost; shapes may churn post-security-review.
- **Verdict:** do a **thin slice**: one-time documented mapping table + a quarterly (or release-triggered) re-check. Not a beta.7 gate.

## Posture D — Ignore; stay OTLP/resource-service-only

- **Pro:** zero coupling to pre-release churn; the gRPC `DashboardService` proto + OTLP are the **stable, shipped** contracts — and notably, Deck itself wraps those same contracts, which is strong evidence they remain load-bearing long-term.
- **Con:** if Deck ships and its REST facade becomes the recommended integration surface, some rework later; no new extensibility story by itself.

## Recommendation

**D as the runtime default for beta.7, plus the C sliver (contract-watching), plus B protocol-only if/when epic #400 wants custom panels.**

Rationale: every stability signal on Deck is negative for coupling (draft, unannounced, unversioned, cookie-auth, security review pending), while the contracts NetScript already uses (gRPC + OTLP) are exactly the ones Deck wraps — meaning NetScript's current integration is *validated*, not obsoleted, by this development. The valuable imports from Deck are ideas, not endpoints: (1) the flattened resource JSON vocabulary, (2) the canvas iframe+postMessage panel model, (3) NDJSON-over-fetch as a simple streaming shape for Deno/Fresh.

**Risk of recommendation:** if Deck merges and ships fast (Fowler/Ros involvement makes this plausible), posture A becomes attractive sooner than the quarterly check would catch. Mitigation: watch PR #18731 / the `dashboard-deck-redesign` branch for a merge-to-main event; that event, not a date, is the trigger to re-open this memo.

### beta.7 / epic #400 — assume now
- Blazor remains Aspire's default dashboard; no React dashboard ships in a current/near release. Do not plan around Deck.
- OTLP + resource-service gRPC remain the correct, load-bearing integration path.
- Any Deck-facing work is contract-watching/documentation, not integration.

### beta.7 / epic #400 — defer
- Direct `/api/deck/*` consumption (until merged to main + versioned/released).
- Deck-canvas compatibility claims (until canvas backend integration + `/react` hosting land — both explicit follow-ups).
- Any Fluent-UI design convergence — NetScript stays Fresh/Preact + `@netscript/fresh-ui`; there is no shared component surface to converge on.
