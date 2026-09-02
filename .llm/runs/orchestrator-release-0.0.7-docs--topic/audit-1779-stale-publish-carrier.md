# Audit — #1779 (Aspire, ready-merge) stales the mcp publish carrier

Date: 2026-09-02. Route: claude-fable-5-1 · low. Role: bounded documentation/claim audit of active
0.0.7 PRs; ownership unchanged (Aspire). Docs 0.0.7 queue remains empty.

## Finding

- `packages/mcp/README.md` L349–353 edited (adds `aspire ps --format Json` discovery step).
- `packages/mcp/src/publish-assets.generated.ts` not regenerated (last touched `4720596fc`;
  0 occurrences of the new text vs 1 in README).
- Head `3bef62a` has **no `ci` run**; PR is `DIRTY/CONFLICTING` on
  `export-surface-corpus.generated.ts`, 4 behind `main`.
- Predicted failure: `quality` → Publish asset freshness. Repair: `deno task gen:publish-assets`
  with the conflict resolution.
- README prose claim verified against the diff (injectable `aspire ps` reader exists).

Handed to the Aspire supervisor as a PR comment. No label changes.

## Also swept

- #1760 `packages/cli/e2e/README.md`: no fence lines change; outside the fence gate. `UNSTABLE`.
- #1895, #1930, #1885: run-artifact Markdown only.
- #1759 carries its own `docs-audit-request.md` (Aspire-dispatched Codex prose audit); not duplicated.
