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

Formal IMPL-EVAL for **S7 of the Aspire 13.5 epic (phase A)** — issue #1719, draft PR #1744 (base =
S3 branch `test/aspire-13-5-s3-fixture-recapture`; closes #1719, #1429), epic #1712. Route: Claude ·
Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6 Sol work), per
`.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `473286671` on branch `fix/aspire-13-5-s7-teardown-leak-check` (base =
  S3 head `fe4f496bd`; evaluate only commits after it). Your worktree:
  `/home/codex/repos/netscript-aspire-13-5-s7-eval` (detached at that head; read-only for product
  files).
- Generator run dir (in the tree): `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/`
  (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`,
  `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1719 (+ #1429 orphaned `aspire-managed` descendants; AGENTS.md
  Resource-hygiene invariants: foreign/unknown-owner entries reported and never mutated, `--apply`
  only on proven path-containment ownership, never `aspire stop --all`). **Phase A only**: the #1429
  live reproduction and foreign-AppHost re-test are lease-backed phase B — do not fail for their
  absence in `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on
  `origin/research/aspire-13.5-0.0.7`
  (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes:
  `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s7/review-tier-a.md`.
- S2 receipts referenced by S7: `origin/test/aspire-13-5-s2-runtime-verification`
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v6-*` (orphan cleanup
  timing), `02-v7-*` (`stop --force`), `run-resources.json`, leak-check receipt — the 13.5.3
  lifecycle facts the tooling encodes.
- Known baseline (not S7's): `packages/fresh/src/application/query/hydration.ts` TS2345 on
  `origin/main` (#1734 / PR #1736) fails generated-project `deno task check`; classify it explicitly
  if any CI gate is red for that reason.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (RED #1429 fixture → descendant tracking →
   `--force-persistent` → post-stop confirmation → playbook/regen/gates).
2. RED-first: `__fixtures__/process-tree-13.5.3-orphaned.json` (synthetic, shaped from S2 V6 —
   README says so) with a leak-check test that FAILS on base (run-gate receipt) and passes at head.
3. Descendant tracking: re-parented (PPID 1) descendants classified by DCP label / `--apphost` argv
   / socket path containment; `MCP_COMMAND` guard test green (never touches `aspire agent mcp`);
   foreign-worktree AppHost still _reported, never owned_ against both `aspire-ps-13.4.6.json` and
   `aspire-ps-13.5.3.json`.
4. `--force-persistent`: `aspire stop --force --apphost <exact>` emitted only under
   `--apply --force-persistent` AND proven ownership; dry-run prints exact argv; refused arms
   tested; **no `--all` anywhere** (grep).
5. Post-stop confirmation bounded by the S2 V6 timing (receipt cited); never-exits → reported, not
   killed.
6. Playbook `.llm/tools/CLEANUP-PLAYBOOK.md` 13.5 section; `gen:assets-barrel`/`check:assets-barrel`
   clean (agent-tools corpus embeds `.llm/tools` docs).
7. Gates you run: configured `deno task lint`, scoped wrappers on `.llm/tools/agentic/teardown`,
   `quality:scan`, `arch:check`, teardown unit suite with both fixtures; no new
   `deno-lint-ignore`/`as unknown as`/`any`; no `packages/`/`plugins/` source change; no S3 commit
   edits; no runtime.
8. Draft PR body `Closes #1719` / `Closes #1429` / `Part of #1712`, base = S3 branch with stacking +
   phase-B lease stated, labels/milestone, per-commit comments, explicit-refspec pushes.
9. Verdict semantics: `PASS` = phase A complete and correct; the PR stays draft awaiting phase B; do
   not require phase B.

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on
the supervisor's research worktree** by absolute path:
`/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s7/evaluate.md`
(declare the exact evaluated head in the file), and post the same verdict as a PR #1744 comment
starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` /
`FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S7 branch, do not mark the PR ready, do not
merge.
