use harness

## SKILL
Opposite-family `docs_audit` lane (gate set .llm/harness/workflow/doc-audit.md) over a Claude-authored docs changeset. Evidence-only verdicts — run commands, read source; never trust generator claims. No edits; findings file is the deliverable.

## Task — audit PR #1222 (branch docs/tutorials-sweep)
Worktree: /home/codex/repos/ns-tutsweep. Changeset: 0b11ca47a..HEAD (5 commits, 21 files under docs/site/tutorials/ + index).

Gates:
1. **Import-path claim**: the sweep switched phase-1 chapters to import definePage via the scaffolded app's `@app/utils.ts` State-bound re-export — verify against packages/cli route templates that this matches generated apps, and that the shown import lines are exactly what the scaffold emits.
2. **Port-drift fixes**: #1211 randomized scaffold ports (FNV-1a, 49152–65535) — verify the sweep's claims: which ports are genuinely still pinned (:3001/:3002/:8094) vs randomized, against packages/cli source; confirm no literal unreachable port remains in the tutorial corpus (sweep the files yourself).
3. **API accuracy**: getCachedEntry null-vs-undefined change, the new ch.5 definePage page, and the CLI --help listings — all against source.
4. **Regression**: nothing the sweep touched contradicts its own track's earlier chapters; build + links gates re-run by you (cd docs/site && deno task build; deno task docs:links).
Write /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/tutsweep-audit/audit.md: per-gate PASS/FAIL with command evidence, findings, verdict PASS / FAIL_FIX. No commits.
