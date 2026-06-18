# Locked Decisions (user, 2026-06-19)

Authoritative answers to the blocking questions in `07-questions-for-user.md`. These **override**
the recommended defaults in `01-positioning-brief.md` where they differ. Authoring is **parked**
("just keep planning for now") — these lock the inputs so the eventual generator is unambiguous.

## Round 1 — blocking decisions

### Q1 — Hero one-liner: **C (outcome-led) as hero, B (contract-led) as sub-headline**

- Hero: "From `netscript init` to a running, type-checked, OpenTelemetry-traced backend — services,
  durable workflows, and a design-system UI in one workspace."
- Sub-headline: "A Deno-native backend framework where the contract *is* the product: type-safe
  services and durable workflows, observable by default, orchestrated with Aspire."

### Q5 — Maturity: **Alpha, API subject to change** (React-Native-style "stable in practice")

- Public claim: **Alpha. The API is subject to change.** Target **beta by end of 2026**. A stable
  release is **driven by enterprise feedback and adoption**, not a calendar date.
- Framing analogy (for tone, not necessarily literal copy): React Native — not a 1.0, yet widely
  implemented and treated as stable in practice. NetScript may use the same "battle-tested before
  versioned" posture: honest about the alpha label while conveying real usability.
- Implication for copy: a visible **status badge/note** ("Alpha — API subject to change") is in
  scope. Landing language stays confident about capability but must NOT claim production-ready or
  API stability. Avoid "1.0", "stable", "GA" as present-tense claims; "on the path to beta" is fine.

### Q7 — Aspire: **HERO-LEVEL differentiator** (with an explicit opt-out chapter)

- User intent (verbatim sense): enterprise devs often live in Windows/.NET environments, so the
  Aspire tie is an asset, not a liability. NetScript's **tailored Aspire integration is a major DX
  win over even the best frameworks** and is one of several core differential factors.
- Treatment:
  - Aspire **may appear in the hero / top USPs** — foreground the orchestration + dashboard DX.
  - A **dedicated Aspire chapter** must make the **opt-out explicit** (`--no-aspire`) so TS-only /
    non-.NET teams know it is not mandatory.
  - Sell the *integration quality* (one workspace, multi-resource wiring, real dashboard, TS
    helpers), not just "we use Aspire."

### Q13 — Phasing/ownership: **Keep planning only — do NOT author yet**

- No authoring generator launched. Refine the plan and resolve remaining questions first.
- When authoring is later authorized, it goes through a proper generator per harness lane rules
  (WSL Codex or OpenHands), **not** the supervisor. Phase 0–1-first vs full-rebuild to be decided at
  that authorization point.

## Round 2 — tone, scope & positioning (locked 2026-06-19)

### Q4 — Competitive framing: **Self-assembly framing + ONE honest table**

- Lead the "Why" page with "stop hand-assembling a backend from a dozen unrelated libraries."
- Name competitors (NestJS, Encore, tRPC-stacks, Temporal, Hono) **only inside a single honest
  "NetScript wraps / is-not" comparison table** — confident, factual, never combative. No
  per-competitor head-to-head sections.

### Q14 — Capability-hub labels: **Plain-English headers, doctrine taught inline**

- Nav + hub titles use plain English: **"Background jobs", "Durable workflows", "Event triggers",
  "Streams"**. Inside each hub, introduce and use the package/doctrine term ("workers", "sagas",
  "triggers", "streams") so it matches what devs see in imports. Approachable at the door, precise
  inside.

### Q2 — Tone: **Warm "we", sparing humor, no body emoji**

- TanStack honesty + Astro warmth. First-person **"we"** is allowed; **occasional dry humor** ok;
  **no hype adjectives**; **no internal doctrine vocab** in marketing surfaces.
- **Emoji** only in callouts/changelog, **not in prose**.

### Q12 — Community/footer: **GitHub + JSR only for now**

- Footer: GitHub repo + JSR `@netscript` + **"Edit this page"** links. No chat channel yet —
  add one later when there's a channel to staff (revisit at beta).

## Confirmed-by-default (no objection raised; carry the `07-`/`01-` recommendation)

- **Q3 audience** — primary persona = product/full-stack TS engineer at a small-to-mid team/agency
  building durable systems; secondary = platform/infra, Deno-curious-from-Node, plugin authors.
- **Q6** — durable workflows **co-headline** with contract-first (not sole headline).
- **Q8** — "own your UI" (copy-source fresh-ui) = a **named USP card**, not hero-level.
- **Q9** — Medusa-style production-blueprint lane = **wave-2** (after Diátaxis how-tos).
- **Q10** — core **4-tutorial track** (workspace → service → jobs → workflow); webhook = wave-2.
- **Q11** — **hybrid** authoring: Markdown + GitHub-callout shim for prose; `.vto` for
  landing/why/hubs.

> Note: Q7's hero-level Aspire decision raises the case for a 7th USP slot and shifts USP ordering;
> `01-positioning-brief.md` USP ordering should be revisited when authoring is authorized (Aspire
> moves up from #4). All Round-1 + Round-2 inputs are now locked; only the phasing/ownership and
> the eventual generator launch remain open (deferred per Q13).
