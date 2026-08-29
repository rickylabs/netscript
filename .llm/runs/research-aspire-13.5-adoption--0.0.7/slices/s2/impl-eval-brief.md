use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`,
  `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you
  never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git
  verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no
  runtime lease).

## Context

Formal IMPL-EVAL for **S2 of the Aspire 13.5 epic** — issue #1714, draft PR #1735, epic #1712.
Route: Claude · Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6
Sol work), per `.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `fffbb0c473dec14aedd858127b9a3ce4afee74a2` on branch
  `test/aspire-13-5-s2-runtime-verification` (base `origin/main` `3b32d1628`). Your worktree:
  `/home/codex/repos/netscript-aspire-13-5-s2-eval` (detached at that head; read-only for product
  files).
- Generator run dir (in the tree): `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/`
  (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`,
  `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1714 (V1–V12, acceptance, boundaries; runtime lease was granted for
  this slice and is now released) (files, boundaries, acceptance, gates, regeneration); locked
  decisions D-9 (RUNTIME-VERIFY list), D-1, D-13 in
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7`
  (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes:
  `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s2/review-tier-a.md`.
- Supervisor Tier-A sign-off + independent zero-leak proof: git show
  origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s2/review-tier-a.md.
  Verify at `fffbb0c473dec14aedd858127b9a3ce4afee74a2`.
- Known baseline (not S2's): `packages/fresh/src/application/query/hydration.ts:43` TS2345 fails
  generated-project `deno task check` on `origin/main`; CI run 33276629736 shows
  `runtime.aspire-restore` PASSED on both tiers with Aspire CLI 13.5.3 before that gate. Classify it
  explicitly (out of scope vs FAIL) rather than ignoring it.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims). S2 is receipts-only: do NOT start an AppHost or touch the host CLI (lease released); verify the receipts are internally consistent, exact-head, complete for V1–V12, that cleanup is proven, and that every claim cites a raw receipt.

1. Design checkpoint exists and commit slices match it (scaffold/restore → runtime probes → MCP/CLI
   contracts → finalize/cleanup).
2. `receipts/aspire-13.5-verification.md` has V1–V12 with observed behaviour, exact
   command/exit/timestamp, and a raw receipt path for each; spot-check ≥6 rows against the raw files
   (V1 module grep, V4 exit codes, V7 docker before/after, V8 transcript serverInfo 13.5.3 + 14
   tools, V9 grep, V12 help text).
3. Cleanup: leak-check before/after teardown receipts, `run-resources.json` empty, and re-run
   `deno task agentic:leak-check -- --slice-dir <run-dir> --worktree <s2 worktree>` yourself
   (read-only) → survivors must be `[]`.
4. Product code untouched (diff only under `.llm/runs/**`, `.llm/tmp` excluded); arch-debt
   `aspire-otel-cli-discovery` appended not rewritten; no manifest/generator edits; no `packages/**`
   change.
5. Draft PR #1735 body `Closes #1714` / `Part of #1712`, labels/milestone, per-commit comments,
   explicit-refspec pushes.
6. Findings the supervisor flagged (V2 startup/readiness, V3 Postgres host-port reuse, V4 exit-12,
   V8 14 tools) are represented honestly in the receipts and drift.

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on
the supervisor's research worktree** by absolute path:
`/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s2/evaluate.md`
(declare the exact evaluated head in the file), and post the same verdict as a PR #1735 comment
starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` /
`FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S2 branch, do not mark the PR ready, do not
merge.
