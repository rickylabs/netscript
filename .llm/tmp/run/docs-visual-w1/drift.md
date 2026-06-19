# Drift — Docs v2 / W1 code highlighting + tables

- 2026-06-19 — minor: The brief expected `Unknown language` warnings in the initial build, but the
  current worktree emitted highlight.js unescaped-HTML warnings instead. The implementation still
  registered the real docs languages and verified zero `Unknown language` warnings after build.
- 2026-06-19 — minor: Impeccable's referenced helper scripts were unavailable in this worktree; UI
  decisions were made from the existing `docs/site/styles/tokens.css` and screenshots instead.
