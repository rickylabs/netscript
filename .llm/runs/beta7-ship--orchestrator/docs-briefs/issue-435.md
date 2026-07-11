# Issue #435: docs(tutorial): rewrite workspace track (team workspace + auth)

Part of #401 · Depends on #433 (S0 IA-reconciliation)

**Handle:** C2 · **Milestone:** `0.0.1-beta.7` · **Lane:** Opus-medium authoring workflow.

## Scope — rewrite workspace track (team workspace + auth)

## Track-specific acceptance

- Auth chapters (`02-auth`, `05-route-authz`) backed by framework `builder-auth_test` 401/403/200 pattern + package docs — **not** eis-chat (zero-auth); keep the `arch-debt:seamless-auth-roadmap` factual callout.

## C-common bar

- [ ] Exercise-first: every step closes on a literal observable checkpoint; never a comprehension checkpoint.
- [ ] Premise carries real stakes grounded in the track's real domain.
- [ ] Chapter slugs preserved (or rename paired with the `_data.ts` hub-anchor edit).
- [ ] `deno task verify` green; no Lume/Vento landmine; every API/symbol traces to `deno doc`.
- [ ] Positioning law honored.

Design source: `design/CD-docs/epic-and-issues.md` (§3, C2).

