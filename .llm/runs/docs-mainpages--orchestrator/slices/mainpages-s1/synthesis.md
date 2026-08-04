# S1 synthesis — locked outline decisions (orchestrator arbitration)

Inputs: outline-codex.md, outline-opus.md, critique-of-opus-by-codex.md,
critique-of-codex-by-opus.md. Where the critiques independently converged, the point is locked
without further debate.

## Convergent verdicts (locked)

1. The four pages become a funnel: `/` want it → `/why/` choose it → `/quickstart/` run it →
   `/concepts/` understand it. No backtracking, no cross-duplication.
2. CRUD leaves the front entirely: no `createCrudContract` lead, and the
   "Build real systems, not just CRUD" apology heading dies with it.
3. Durability is the first proof; the homepage's single code moment is a **saga** — and the
   snippet must genuinely exercise the behavior its caption claims (Codex critique 1.2: a
   compensation example must actually take the failure path, or the caption must say what the
   reader will see). Verify against `plugin-sagas-core` README + `define-saga.ts` before ship.
4. The current `why.vto` saga samples DO type-check (both sides compiled them); mutation of
   named state properties is supported engine behavior. No "broken sample" claim anywhere.
5. Banned: links to `/capabilities/` (it redirects to `/`), hard-coded `:18888` (dashboard port
   is configurable), volatile counts (implementation/agent counts) on the homepage,
   "enterprise-grade" and other unearned adjectives at 0.0.x, absolute competitor claims not
   supportable from this repo.
6. One-screen budget on the homepage is enforced literally: hero + three proof points + one
   code moment + exit strip. No nine-pillar grid, no ToC-hero (9 h2s/5 grids/30+ links dies).

## Arbitrated decisions

- **Homepage hero:** Opus's two-promise form — "Your checkout survives the crash. Your types
  survive the refactor." — under Codex's budget discipline (no extra promo one-liners, subhead
  states the platform in one sentence: durable, typed, full-stack apps on Deno).
- **Three proof points:** durability-as-state-machine (saga), one contract typed across
  service/client/OpenAPI/page loader, one command brings up the traced fleet (Aspire).
- **Why hero:** Codex's "For teams whose TypeScript app has become a system." Keep a
  competitor/alternative comparison (incl. Temporal row) but every cell repo-supportable;
  honest trade-offs section stays.
- **Quickstart:** a path, not a tour — init → scaffold → `aspire start` → success check →
  one real first change (the "first change" step is designed in the draft, not deferred).
  Success check must match the exact flags the page tells the reader to use (resolve the
  `--service` default question against `init-command.ts` during drafting).
- **Concepts spine:** contracts → services → plugins → web layer → observability (web layer
  becomes explicit — both sides agreed it's missing today). Absorbs the homepage's
  architecture exposition; trims plugin mechanics and port tables to links.
- **Kill/move list:** union of both kill lists where they agree; disagreements resolved in
  favor of deletion only when the content exists on a deep page to link to.

## S2 dispatch

Drafting lane: Codex Sol (medium — real drafting) authors the four pages on a work branch;
Opus adversarial review per page before the orchestrator's slice review; then S5 OpenCode·Grok
evaluation vs industry framework sites; then Sol audit (docs_audit) + ready.
