# IMPL-EVAL — PR #1929 (ci(mcp): enforce export-corpus freshness in quality)

Evaluator: OpenHands · GLM 5.3 Flash, separate session from the generator (Codex Sol) and from the
supervisor's IMPL-EVAL packet (Claude Fable). Read-only; no source, commit, or push changes made.

## Summary

PR #1929 (closes #1920) wires the pre-existing `mcp-export-corpus` gate into the CI `quality` job
and refreshes the stale generated corpus. Archetype 2 — Integration (`packages/mcp` generated
internal asset only), plan `ci-mcp-export-corpus-gate--1920`, `PLAN-EVAL: N/A` recorded and
justified in supervisor.md/worklog.md for this mechanical, fully specified change. All plan
commitments are satisfied at head `8c028d820fb174c55af7567c69774f38e88dbaa2`; every gate this
evaluator ran independently returned a real exit code of 0 (or the expected 1 for the RED teeth).

## Changes

- No source changes by this evaluator session (read-only IMPL-EVAL).

## Validation (independently reproduced at head 8c028d820)

- GREEN gate, exact CI invocation: run-gate.ts --gate mcp-export-corpus --id
  quality-mcp-export-corpus --output .llm/tmp/gate-receipts/quality/mcp-export-corpus.json →
  REAL_EXIT=0, structured receipt outcome PASS, payload sha256 81d49c6c…76214df, 273
  subpaths, 7,809 symbols — matches committed provenance byte-for-byte.
- RED teeth (plan D4): detached throwaway worktree at base 37452f11f → REAL_EXIT=1,
  "MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus".
- CI job at head: run 33635076831 (pull_request, exact head sha), job quality completed
  success; step "MCP export corpus freshness" present and success among 10+ sibling gates.
- Step structure asserted from parsed YAML (not grep): name, `if: env.RUN_DENO == 'true'`,
  --gate/--id/--output all exact; run-gate.ts catalogued at
  .llm/tools/gates/catalog.ts:40; receipt path matches the "Upload quality gate receipts"
  artifact glob (if-no-files-found: error).
- Corpus diff hygiene: regenerated blob + provenance only (old sha 658a3a56… → new
  81d49c6c…, 272→273 subpaths, 7,803→7,809 symbols tracing to #1915's plugin-auth-core
  surface merged between cut base and integrated main); no hand edits.
- Doctrine gates (Archetype 2 touches packages/**): deno task quality:scan → REAL_EXIT=0,
  findings [], all 7 allowances pre-existing (#1276); deno task arch:check → REAL_EXIT=0.
- Public surface: generated corpus not directly exported from packages/mcp/mod.ts; only the
  pre-existing port/embedding modules are exported. No new public surface.
- Plan scope conformance: diff = ci.yml step + regenerated corpus + run artifacts;
  deno.lock unchanged; commit trail 1ad32bc02 → 8da9c60f8 → merge 92ae7df42 →
  8c028d820f; PR #1929 OPEN, not draft, milestone 0.0.7, body carries `Closes #1920`, no open
  review threads, all 6 labels are real .github/labels.yml entries.
- Run artifacts: supervisor.md, research.md, plan.md, worklog.md, evidence.md, context-pack.md,
  drift.md all present under .llm/runs/ci-mcp-export-corpus-gate--1920/; evidence records
  baseline RED (REAL_EXIT=1), determinism (byte-identical re-generations), and post-integration
  corpus stats.
- Debt: no new arch-debt.md entries; pre-existing MCP debt entries are unrelated to this
  change. Debt posture matches the plan's "none implied".

## Findings

None — no blocking, major, or minor findings.

## Responses to review comments

- No open review threads on PR #1929 (thread gate: 0 current, 0 outdated).

## Remaining risks

- The gate shells out to `deno doc`; a future Deno version bump can redden the gate on main with
  no diff. Mitigated by the 2.9.5 pin in ci.yml (a bump edits ci.yml → needs_deno=true → the
  gate runs and fails at the bump, not silently later). Worth a debt note if/when the pin floats.
- If a future change makes RUN_DENO=false while staleness-relevant sources change, the gate is
  skipped. Supervisor derivation found no such generator input class today; this is a latent
  classifier-coupling risk, not a defect in this PR.

OPENHANDS_VERDICT: PASS
