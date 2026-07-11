# Issue #449: docs(validate): tutorial-rewrite per-track verdict

Part of #401 · Depends on #433 (S0) and the C-track authoring slices (C1–C6)

**Handle:** V-C · **Milestone:** `0.0.1-beta.7` · **Lane:** OpenHands, qwen 3.7 max, **separate session** (doc-authoring exception: the workflow is generator-only and does not self-certify).

## Scope — tutorial-rewrite per-track validation verdict

## Per-slice verdict checks (per C track)

- [ ] `deno task verify` green (build + `check:links` + `check:caveats`).
- [ ] Every present-tense API/capability claim traces to `deno doc` (accuracy worklog line each).
- [ ] Positioning-law grep: no `honest/honestly/candor`, no `throughput`/`X% faster`, no superlatives, no `_plan`-lifted phrasing.
- [ ] No `_data.ts` hub anchor broken by a slug change.
- [ ] Verdict `PASS` / `CHANGES_REQUESTED` per track; two fail-cycles → escalate.

Design source: `design/CD-docs/epic-and-issues.md` (§5, V-C).

