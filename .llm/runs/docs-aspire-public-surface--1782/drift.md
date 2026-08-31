# Drift Log: Aspire `/public` reference accuracy

## 2026-08-30 — Source re-baseline matched the brief

- **What:** No implementation drift was found; source confirms the four symbols and their exclusive
  published entrypoint exactly as described in issue #1782.
- **Source:** `packages/aspire/src/public/mod.ts`, `packages/aspire/deno.json`, and the three defining
  domain/port files.
- **Expected:** Four symbols available only through `/public`.
- **Actual:** Four symbols available only through `/public`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` findings 1–5.

No candidate sub-path redesign was recorded: this slice found no source fact requiring one, and the
owner explicitly reserved such design work for umbrella #1777.
