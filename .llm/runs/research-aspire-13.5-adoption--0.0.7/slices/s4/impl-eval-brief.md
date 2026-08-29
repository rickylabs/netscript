use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no runtime lease).

## Context

Formal IMPL-EVAL for **S4 of the Aspire 13.5 epic** — issue #1716, draft PR #1738, epic #1712.
Route: Claude · Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6 Sol work), per `.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `c2cceba00` on branch `chore/aspire-13-5-s4-generator-revalidation` (base `origin/main` `13878a80a` after the child rebased before slice 5). Your worktree: `/home/codex/repos/netscript-aspire-13-5-s4-eval` (detached at that head; read-only for product files).
- Generator run dir (in the tree): `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/` (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`, `member-table.md`).
- Contract of record: issue #1716 (member table, config default, stale anchors, deploy adapters D-15, regeneration; #1371 already closed by #1728 — no closing keyword for it); locked decisions D-4, D-15 in `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7` (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes: `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s4/review-tier-a.md`.
- S2 receipts referenced by S4: `origin/test/aspire-13-5-s2-runtime-verification` `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/` (`01-restored-module-grep`, `03-v9-*`, `03-v12-*`).
- Known baseline (not S4's): `packages/fresh/src/application/query/hydration.ts` TS2345 on `origin/main` (#1734 / PR #1736) fails generated-project `deno task check`; classify it explicitly if any CI gate is red for that reason.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (member table → config default → stale anchors → deploy adapters → regen/gates).
2. Member table: every emitted SDK member has a row with the 13.5.1 API page and a verdict; spot-check ≥8 rows against `sources/aspiredev-reference_api_typescript_aspire.hosting.md` on the research branch; `withHttpHealthCheck` options-object form matches S2's restored-module grep.
3. `AspireConfigSchema` default `./aspire/apphost.mts` with test; no other public-surface change in `packages/config` (`deno publish --dry-run` if the export map is touched).
4. Stale anchors: `git grep -nE 'aspire#15119|aspire#16220|aspire#15812' -- packages/cli/src/kernel/templates/aspire packages/cli/src/kernel/assets/aspire` empty; arch-debt CommunityToolkit entry updated in place (other entries only fmt-rewrapped — say so).
5. Deploy adapters: argv contract matches S2 V12 help receipts; `--yes` only on `destroy` in non-interactive paths; adapter tests updated and green.
6. Gates you run: scoped wrappers on touched roots (note config exclusions; raw `deno fmt --check`/`deno lint --no-config` on excluded files), `deno task quality:scan`, `deno task arch:check`, `check:assets-barrel`, generator unit tests, `deno task e2e:cli run scaffold.plugins --format pretty`; no new `deno-lint-ignore`/`as unknown as`.
7. Draft PR body `Closes #1716` / `Part of #1712` (and **no** `Closes #1371`), labels/milestone, per-commit comments, explicit-refspec pushes; boundaries respected (no pins, no `packages/fresh`, no skills/docs, no archival rows, no runtime).

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on the supervisor's research worktree** by absolute path: `/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s4/evaluate.md` (declare the exact evaluated head in the file), and post the same verdict as a PR #1738 comment starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S4 branch, do not mark the PR ready, do not merge.
