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

## 2026-09-02 continuous sweep (claude-fable-5-1 · low)

| PR | Lane | Event | Docs verdict |
| --- | --- | --- | --- |
| #1909 | fixes | head `3d87111ad` | code-only delta; clean |
| #1759 | aspire | head `c6ec50214` | code fix; skill prose spot-check clean (no `13.4.6`, no `aspire mcp start`) |
| #1938 | fixes | `impl-eval`, head `6e546515c` | **FINDING**: `quality` failed at MCP export corpus freshness — `JobDefinition` generics widened + new `JobPayloadSchema` on a corpus-covered surface, `export-surface-corpus.generated.ts` not regenerated. Repair `deno task gen:mcp-export-corpus` after merging `main` (13 behind; main moved the carrier). Handed to Fixes via PR comment. |
| #1941 | features | new, `impl-eval` | code-only; clean |
| #1885 | fixes | head `dd039a791` | main merge; zero delta vs main |
| #1916 | fixes | head `1c59ae57b` | code-only; clean |
| #1779 | aspire | unchanged `3bef62a` | still conflicting; awaiting re-sweep |

Pattern worth the coordinator's eye: two active 0.0.7 PRs (#1779, #1938) stale a generated carrier
in `packages/mcp/src/` and both collide with `main` on it. Regenerate-after-merge is the rule.

## Closure

- #1779 rebased onto `850cc7757`, carrier + corpus regenerated (`3352583`); `quality` **success** on
  run 33656583038. Finding closed on the PR.
- #1938 regenerated the corpus **before** merging `main` → `DIRTY` on the carrier as predicted;
  fix sequence posted. Awaiting a new head.
- #1941 (features), #1942 (fixes) opened: code-only, clean. #1883/#1759 heads: code-only, clean.
