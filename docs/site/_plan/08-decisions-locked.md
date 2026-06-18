# Locked Decisions (user, 2026-06-19)

Authoritative answers to the blocking questions in `07-questions-for-user.md`. These **override**
the recommended defaults in `01-positioning-brief.md` where they differ. Authoring is **parked**
("just keep planning for now") — these lock the inputs so the eventual generator is unambiguous.

## Q1 — Hero one-liner: **C (outcome-led) as hero, B (contract-led) as sub-headline**

- Hero: "From `netscript init` to a running, type-checked, OpenTelemetry-traced backend — services,
  durable workflows, and a design-system UI in one workspace."
- Sub-headline: "A Deno-native backend framework where the contract *is* the product: type-safe
  services and durable workflows, observable by default, orchestrated with Aspire."

## Q5 — Maturity: **Alpha, API subject to change** (React-Native-style "stable in practice")

- Public claim: **Alpha. The API is subject to change.** Target **beta by end of 2026**. A stable
  release is **driven by enterprise feedback and adoption**, not a calendar date.
- Framing analogy (for tone, not necessarily literal copy): React Native — not a 1.0, yet widely
  implemented and treated as stable in practice. NetScript may use the same "battle-tested before
  versioned" posture: honest about the alpha label while conveying real usability.
- Implication for copy: a visible **status badge/note** ("Alpha — API subject to change") is in
  scope. Landing language stays confident about capability but must NOT claim production-ready or
  API stability. Avoid "1.0", "stable", "GA" as present-tense claims; "on the path to beta" is fine.

## Q7 — Aspire: **HERO-LEVEL differentiator** (with an explicit opt-out chapter)

- User intent (verbatim sense): enterprise devs often live in Windows/.NET environments, so the
  Aspire tie is an asset, not a liability. NetScript's **tailored Aspire integration is a major DX
  win over even the best frameworks** and is one of several core differential factors.
- Treatment:
  - Aspire **may appear in the hero / top USPs** — foreground the orchestration + dashboard DX.
  - A **dedicated Aspire chapter** must make the **opt-out explicit** (`--no-aspire`) so TS-only /
    non-.NET teams know it is not mandatory.
  - Sell the *integration quality* (one workspace, multi-resource wiring, real dashboard, TS
    helpers), not just "we use Aspire."

## Q13 — Phasing/ownership: **Keep planning only — do NOT author yet**

- No authoring generator launched. Refine the plan and resolve remaining questions first.
- When authoring is later authorized, it goes through a proper generator per harness lane rules
  (WSL Codex or OpenHands), **not** the supervisor. Phase 0–1-first vs full-rebuild to be decided at
  that authorization point.

## Still-open questions (recommended defaults assumed unless the user redirects)

Not yet locked; carrying the `07-`/`01-` recommended defaults as provisional:

- **Q2 tone** — confident, precise, engineering-credible; TanStack honesty + Astro warmth; no hype
  adjectives; no internal doctrine vocab in marketing surfaces. (Confirm forbidden items: emoji?
  first-person "we"? humor?)
- **Q3 primary audience** — product/full-stack TS engineer at small-to-mid team/agency building
  durable systems.
- **Q4 competitive framing** — compare to "assembling it yourself"; named tools only in one honest
  "wraps / is-not" table. (Confirm any framework to explicitly position against.)
- **Q6** durable workflows co-headline with contract-first. **Q8** "own your UI" = named USP card,
  not hero. **Q9** Medusa-style blueprint lane = wave-2. **Q10** core 4-tutorial track
  (workspace -> service -> jobs -> workflow), webhook wave-2. **Q11** hybrid Markdown + callout shim /
  `.vto`. **Q12** add "Edit this page" + GitHub/JSR footer (Discord? — need channel). **Q14**
  confirm the 9 intent-named capability-hub labels + house terminology ("background jobs" vs
  "workers", "durable workflows" vs "sagas").

> Note: Q7's hero-level Aspire decision raises the case for a 7th USP slot and may shift the hero
> sub-headline emphasis; `01-positioning-brief.md` USP ordering should be revisited when authoring
> is authorized (Aspire moves up from #4).
