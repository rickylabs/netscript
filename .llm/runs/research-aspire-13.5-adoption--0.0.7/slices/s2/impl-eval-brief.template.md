use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no runtime lease).

## Context

Formal IMPL-EVAL for **S1 of the Aspire 13.5 epic** — issue #1713, draft PR #1727, epic #1712.
Route: Claude · Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6 Sol work), per `.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `<S2_HEAD>` on branch `test/aspire-13-5-s2-runtime-verification` (base `origin/main` `3b32d1628`). Your worktree: `<EVAL_WORKTREE>` (detached at that head; read-only for product files).
- Generator run dir (in the tree): `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/` (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`, `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1713 (files, boundaries, acceptance, gates, regeneration); locked decisions D-1, D-2, D-3, D-8, D-13, D-16 in `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7` (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes: `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s2/review-tier-a.md`.
- Coordinator Tier-A hold (PR #1727 comment 2026-08-29T21:43Z): (1) a missing required manifest path must make the gate fail (negative test); (2) exact-current-train mismatch coverage for every phase-1 fail-class pin (no 13.5.x false-green). Verify both are closed at `<S2_HEAD>`.
- Known baseline blocker (not S1's): `packages/fresh/src/application/query/hydration.ts:43` TS2345 fails generated-project `deno task check` on `origin/main`; CI run 33276629736 shows `runtime.aspire-restore` PASSED on both tiers with Aspire CLI 13.5.3 before that gate. Classify it explicitly (out of scope vs FAIL) rather than ignoring it.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (RED-first gate → atomic pin → debt/handoff → coordinator repair).
2. Every pin in #1713 "Scope (files)" is on the locked train; no `13.4.6`/preview `13.5.0-preview` literal remains in phase-1 fail classes; `check:scaffold-versions` E-12 green; policy test green; generator tests compare against constants.
3. `deno task check:aspire-version-parity` green with the D-13 phase-1 semantics (fail set = `scaffold-constants`/`ci:*`/`root-config`; `deferred` owner-tagged; archival `info`; lockfile skipped; **missing required path → fail**); unit tests cover phase 1, phase 2, compat-fixture, missing-path, and exact-train mismatch.
4. Scoped wrappers on the touched roots, `deno task quality:scan`, `deno task arch:check`, `check:assets-barrel` green; no new `deno-lint-ignore`/`as unknown as`.
5. Draft PR body: `Closes #1713`, `Part of #1712`, labels/milestone; per-slice commit-trail comments present; pushes used the explicit refspec (worklog receipts).
6. Debt entry appended (not rewritten) for the Browsers preview pin.
7. Boundaries: no `packages/fresh`, no skills/docs/corpora other than `embedded.generated.ts`, no archival manifest rows, no manifest/generator edits, no AppHost/CLI mutation.

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on the supervisor's research worktree** by absolute path: `/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s2/evaluate.md` (declare the exact evaluated head in the file), and post the same verdict as a PR #1727 comment starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S1 branch, do not mark the PR ready, do not merge.
