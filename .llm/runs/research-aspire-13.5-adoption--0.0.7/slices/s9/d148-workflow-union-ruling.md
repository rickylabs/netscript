use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt; `git ls-remote`
  immediately before any `--force-with-lease`.

## D-148 — coordinator ruling: resume and complete the S9 un-stack

Your D-133 abort was **correct and accepted** — the workflow artifact lists were genuinely outside
the gate-registration authorization, and stopping was right.

### Ruling — SELECTIVE union in `.github/workflows/e2e-cli.yml` (NOT a blanket union)

Resolve both artifact-upload conflicts as follows, in **both** the `scaffold-runtime` and
`scaffold-runtime-sqlite` jobs:

1. **Retain S8/main's narrow scoped paths and `include-hidden-files: true`** exactly as they are.
2. **Add** S9's two gate-receipt paths and its retention setting:
   - `.llm/tmp/gate-receipts/scaffold-runtime/agent.aspire-mcp-smoke*` (postgres job)
   - `.llm/tmp/gate-receipts/scaffold-runtime-sqlite/agent.aspire-mcp-smoke*` (sqlite job)
   - `retention-days: 30` on each
3. **NEVER restore the broad pre-D-112 recursive globs** (`.llm/tmp/**/report*.json`,
   `.llm/tmp/**/report*.ndjson`, `**/e2e-report*.json`, `**/listener-unreachable-receipt.json`).
   Those were deliberately narrowed by D-112 because `include-hidden-files: true` made them traverse
   the scaffolded project's Postgres `.data` directory and fail the upload with `EACCES`. Restoring
   them silently reintroduces a shipped-CI regression that took four correction cycles to eliminate.

**Rationale:** S9's own diff is purely additive (4 added lines, zero deletions). The "broad globs" on
your side are S9's *base* content — the pre-D-112 workflow — not S9's change. So the union adds S9's
receipts to main's corrected list, rather than reverting main's correction.

### Everything else unchanged

Gate-registration lists → additive union (keep both sides' gates) — you already applied this
correctly. Generated files → upstream side, regenerate once at the end. **Any other non-generated
source conflict still aborts and reports.**

### Ancestry — STACKED slice

Assert `git merge-base HEAD bc838a0b3 == bc838a0b3` (S8's head). **Do not** assert against
`origin/main` and do not rebase onto main; S9 stays stacked on S8.

### After a completed rebase

One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean. Verify the stacked ancestry;
range-diff commit mapping; stale S5/S6/S8 lineage absent; scoped check/lint/fmt; **repo-wide
`deno task check`** expecting `failedBatches: 0`; focused tests for the touched gate-registry/suite
areas; `check:aspire-version-parity` `fail=0`. **Explicitly confirm the workflow retains
`include-hidden-files: true` and the narrow paths, and contains no `.llm/tmp/**` recursive glob.**

**No runtime** — runtime is parked host-wide (upstream Aspire constraint); do not start Aspire or
Docker. **No PLAN-EVAL, no evaluator rerun.** Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head, the
exact final artifact path list per job, verification exit codes, and confirm the worktree is clean.
