# Issue #438: docs(tutorial): rewrite chat track (durable AI chat) — GATED

Part of #401 · Depends on #433 (S0 IA-reconciliation)

**Handle:** C5 · **Milestone:** `0.0.1-beta.7` · **Lane:** Opus-medium authoring workflow. **GATED on `@netscript/ai` publish state.**

## Scope — rewrite chat track (durable AI chat)

## Track-specific acceptance

- Author against **shipped `@netscript/fresh/ai`** only; `@netscript/ai` engine = caveated forward-ref, never a runnable import; pre-flight the publish state (proposal §3.5). If the engine is still `publish:false` at the authoring window, ship the light-touch form; owner-lever = defer the full rewrite.

## C-common bar

- [ ] Exercise-first: every step closes on a literal observable checkpoint; never a comprehension checkpoint.
- [ ] Premise carries real stakes grounded in the track's real domain.
- [ ] Chapter slugs preserved (or rename paired with the `_data.ts` hub-anchor edit).
- [ ] `deno task verify` green; no Lume/Vento landmine; every API/symbol traces to `deno doc`.
- [ ] Positioning law honored.

Design source: `design/CD-docs/epic-and-issues.md` (§3, C5).

