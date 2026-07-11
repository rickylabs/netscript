# Issue #450: docs(validate): positioning per-pillar verdict

Part of #401 · Depends on #433 (S0) and the D-pillar authoring slices (D1–D9)

**Handle:** V-D · **Milestone:** `0.0.1-beta.7` · **Lane:** OpenHands, qwen 3.7 max, **separate session** (doc-authoring exception: the workflow is generator-only and does not self-certify).

## Scope — positioning per-pillar validation verdict

## Per-slice verdict checks (per D pillar)

- [ ] `deno task verify` green (build + `check:links` + `check:caveats`).
- [ ] Every present-tense API/capability claim traces to `deno doc` (accuracy worklog line each).
- [ ] Positioning-law grep: no `honest/honestly/candor`, no `throughput`/`X% faster`, no superlatives, no `_plan`-lifted phrasing.
- [ ] No page orphaned from nav.
- [ ] Verdict `PASS` / `CHANGES_REQUESTED` per pillar; two fail-cycles → escalate.

Design source: `design/CD-docs/epic-and-issues.md` (§5, V-D).

