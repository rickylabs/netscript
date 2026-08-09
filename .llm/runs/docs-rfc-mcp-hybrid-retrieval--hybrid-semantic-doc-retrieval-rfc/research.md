# Research — docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc

## Re-baseline

- Carried-in source: owner brief, open PR #1404 / issue #1102, and the read-only
  `/home/codex/repos/ns005-w3b1` worktree.
- Re-derived against `origin/main@399f60185d5d01ae68764a8f48d1f716ca3a51aa` on 2026-08-09.
- Baseline state at activation: local `HEAD`, merge-base, and freshly fetched `origin/main` are the
  same requested commit; working tree is clean.
- What changed vs the carried-in version: pending focused research; no baseline SHA drift.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The run began from the exact owner-specified current `origin/main` commit. | `git fetch origin main`; `git rev-parse HEAD origin/main`; `git rev-list --left-right --count HEAD...origin/main` → `0 0` |
| 2 | The author is the sole observed Codex thread for this worktree and the managed daemon retains remote control. | `supervisor.md` daemon/thread evidence |

## jsr-audit surface scan (proposed package surface)

- Surface scanned: pending current MCP export-map and generated-asset inspection.
- Slow-type / surface risks: pending; the RFC must cover explicit return types, full export-map
  docs, publish filtering, generated-asset packaging, remote-graph portability, permissions, and
  artifact-size ceilings.

## Open questions

- Pending research-backed decision sweep in `plan.md` and the RFC.

