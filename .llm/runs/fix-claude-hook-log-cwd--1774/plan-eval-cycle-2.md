# PLAN-EVAL cycle 2 — fix-claude-hook-log-cwd--1774

- Plan evaluator session: native Claude / Fable 5, fresh separate session (not the cycle-1
  evaluator), 2026-08-30, evaluator worktree `worktrees/007-eval-1774-c2`, detached.
- Run: `fix-claude-hook-log-cwd--1774` — PR #1775, cycle 2 (amendment-only cycle per cycle 1).
- Evaluated head: `2e5f50f0533d8af2deb8e39b597a19f8b621124e` (local `HEAD` == remote branch tip,
  `git ls-remote` verified). Amendment commit under review: the same SHA,
  `docs(harness): amend issue 1774 plan after cycle 1`.
- Base: leaf merge-base with `main` is `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`; current `main` is
  `52a881c58842f521b7b253b9781a0b56ae897069` (local == remote). Inertness verified myself:
  `git diff --stat 3e5cbabf 52a881c5 -- .claude .llm/tools/agentic` is empty (0 files). No rebase
  required.
- `plan-eval.md` integrity: sha256
  `39e718c9c3f8e873185425f209ac99d6ef59e2710320f205f230d9da7cb37e02` at the evaluated head, equal to
  the blob at `842816a2` — bit-identical, as required.
- Scope discipline: `git diff --stat 3e5cbabf 2e5f50f0 -- . ':!.llm/runs'` is empty. The amendment
  touched only `context-pack.md`, `drift.md`, `plan.md`, `research.md`, `worklog.md` under the run
  directory. No `.github/**` change anywhere on the branch.

## Verdict

`PASS`

The four cycle-1 required fixes are genuinely discharged in the plan text, and the amendment
introduces nothing that breaks the plan. One non-blocking artifact nit is recorded below for the
implementer to fold into S3's run-artifact touch.

## Required-fix verification

| # | Cycle-1 fix                             | Result | Where discharged / how checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| - | --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `CLAUDE_PROJECT_DIR` semantics locked   | PASS   | `plan.md` D1 rationale now reads "does not follow `EnterWorktree`; #1774 fixes nested cwd resolution against this launch root only"; Goal reworded to "the checkout where the Claude session was launched … against the session launch root only"; Hidden Scope names it "not a moving active-worktree pointer"; Non-Scope has the explicit worktree-following line; Open-Decision Sweep row "Worktree-following execution/output — safe to defer"; Deferred Scope lists it; `drift.md` carries a `significant`/`fix` entry citing `842816a2`. Gate-3 acceptance evidence in the PR body's `acceptance-evidence` block now claims only "modeled `CLAUDE_PROJECT_DIR` (the session launch root) wins over a temp-dir cwd decoy. This does not claim CLAUDE_PROJECT_DIR follows EnterWorktree." `research.md` finding 3 and the option table were corrected to match, so no reader-facing text still says "follows each worktree" (grep of the run dir for "follows each"/"active worktree root" finds only the drift entry's _Expected_ line, which is historical by design). The mechanism is now documented for the reason it works. |
| 2 | Decoy contract pinned                   | PASS   | D8 + Fixture Contract case 3: cwd from `Deno.makeTempDir`, decoy placed exactly at `<case-3 cwd>/.llm/tools/agentic/claude/claude-hook-log.ts`. I confirmed the live shell-form command (`.claude/settings.json:9,20`) is the relative `deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts`, so from that cwd it resolves to the decoy — RED is reachable, not vacuous. RED expectation (marker present + distinctive nonzero exit) and GREEN expectation (marker absent, exit 0, payload in the modeled launch-root log) are both stated. Cleanup: "under the system temp root, never under any `worktrees/` directory … `try/finally` with `Deno.remove(..., { recursive: true })`". Risk register has both the poisoned-state row and the "placeholder substitution diverges from Claude behavior → treat substitution as a documented model" row; Fixture Contract also states the fixture "does not run Claude".                                                                                                                                                             |
| 3 | Host-path assertion file set enumerated | PASS   | `plan.md` Validation Plan lists the exact six files (`.claude/settings.json`, `deno.json`, `claude-hook-log.ts`, `claude-hook-log_test.ts`, `validate-claude-surface.ts`, `.llm/tools/agentic/README.md`) and the Fitness Gates row references "the exact six-file owned set". Grep of the five existing files for `/home/agent` and `/home/codex` returns nothing (the sixth, the test file, does not exist yet — correct at a plan head). The exclusion of the ten other `.llm/tools/agentic/**` files that legitimately contain `/home/codex` (`agentic-lib.ts`, `launch-codex-slice.ts`, `wsl-foundation_test.ts`, …) is explicit, so the assertion is neither under-scoped nor false-red. The PR acceptance-evidence block repeats the same set.                                                                                                                                                                                                                                                                                                                                                                                 |
| 4 | `wslHome()` deferral tracked            | PASS   | `plan.md` Non-Scope, D9, Open-Decision Sweep, Arch-Debt table, Deferred Scope, and the Plan-Gate Handoff all name #1776; `research.md`, `worklog.md`, `context-pack.md` and the PR body agree. Verified on GitHub: #1776 is OPEN, title `fix(agentic): wslHome() defaults to the nonexistent /home/codex, breaking launch-codex-slice`, milestone `0.0.8`, labels `type:fix area:tooling area:agentic priority:p2 status:triage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Attack narrative

1. **Did the amendment overclaim elsewhere?** Read the full `2e5f50f0` diff across all five
   artifacts. Every changed sentence narrows a claim (active worktree → launch root, "sibling
   checkout" → temp-dir decoy, "explicitly deferred" → "tracked by #1776"); none widens scope or
   adds a decision. One new item since cycle 1: D5/the exact handler contract now include
   `--no-prompt`, which cycle 1 offered as optional. The plan correctly labels it "non-permission
   hardening"; `deno 2.9.5` accepts the flag; it grants nothing. Accepted. The `context-pack.md`
   line "owner reports current `main` is inert … explicitly prohibited rebasing" is a generator
   report of an owner instruction, and the inertness itself is independently true (see header). Not
   an overclaim.
2. **Gate 2 RED obligation.** Unchanged and still genuine: S3 is its own commit, pushed while
   failing, before S4 touches config/script; S4's file list excludes the test file; D7 freezes it
   byte-for-byte; validation row 1 names the expected nonzero result. The amendment strengthened it
   (S3 now must also record the positive case-3 decoy reach). No retrospective assertion.
3. **Both hook events.** Unchanged: fixture enumerates handlers under exactly `PreToolUse` and
   `Stop` and runs every case per event; the Open-Decision Sweep row and the PR validation section
   still carry separate RED for each event. Live `.claude/settings.json` confirms exactly those two
   events carry the command.
4. **Credential boundary.** Non-Scope now states "Do not edit `.github/workflows/**`; no CI wiring
   is required, so the repo-scope PAT is sufficient." No workflow file is touched on the branch, and
   no slice lists one, so the #1533 stranding pattern cannot recur here. If CI wiring ever became
   necessary it would be a Drift Watch trigger ("touch any file outside the locked S3/S4 lists,
   especially … `.github/workflows/**`") returning to the owner — adequate.
5. **Scope discipline.** Empty product diff versus the merge-base (above). The brief's "diff versus
   `main`" reads non-empty only because `main` has advanced by 14 unrelated files (lockfile /
   generated-asset churn under `packages/`), none under the owned surface — that is `main` moving,
   not the leaf.
6. **Receipt honesty.** Every SHA cited in the amended artifacts and the PR body resolves:
   `23c3bdb0…`, `1eee4538…`, `a002fbf2…`, `26102943…`, `842816a2…`, `2e5f50f0…`, `3e5cbabf…`. The
   PR-body sha256 for `plan-eval.md` matches my own hash. `deno --no-prompt` exists.
7. **Decoy — can GREEN still pass while the defect persists?** No. With the exec-form absolute
   `${CLAUDE_PROJECT_DIR}/…` path substituted by the fixture, a still-broken (relative) command
   would reach the decoy in case 3 and produce the marker/distinctive exit that GREEN forbids; a
   correct executable but cwd-relative _output_ path is caught by the "unique payload appears in the
   launch-root JSONL" assertion (risk-register row 3). `claude-hook-log.ts` has no imports, so
   running it from a config-less temp cwd cannot fail for an unrelated resolution reason.
8. **Permissions.** Unchanged from cycle 1 (`--allow-env=<3 keys>`,
   `--allow-write=<root>/.llm/tmp/claude/hooks`, no `--allow-read`); the existing direct task
   `deno.json:107` already matches the read-free contract, and the validator lock check is listed in
   S4 for alignment. Nothing to re-litigate.

## Non-blocking findings

- **`research.md` table alignment.** The amended finding-3 row lengthened the "Key findings" table
  and the header/separator were not re-aligned; `run-deno-fmt.ts --file … --ext md` over the five
  amended artifacts reports exactly one finding, in `research.md:59-63`. The PR body's "structured
  format check — pass, 4 files / 0 findings" therefore covered four of the five changed files. Root
  `fmt:check` does not scan `.llm/runs/**` Markdown and this is not a package-quality gate, so it
  does not block; the implementer should run the fmt wrapper on `research.md` in the next
  run-artifact commit (S3) and count all changed files in future format receipts.
- Cosmetic: `worklog.md` glossary still titles the entry "Sibling decoy" while describing a temp-dir
  decoy. The body text is correct; no action required.

## NOT_RUN (correctly excluded)

Aspire, Docker, browser, `e2e:cli`, `scaffold.runtime` — lease belongs to the Aspire lane; none
exercises this surface. Local Aspire/Docker remained at zero. No process was started or killed.

## Boundary

This session wrote exactly this file. `plan-eval.md`, `plan.md`, `research.md`, other run artifacts,
source, tests, PR body, labels, milestone, draft state, and issues #1774/#1776 were not modified.
Diff versus `2e5f50f0` outside `.llm/runs/` is empty.

## Handoff

Implementation may proceed: S3 (RED fixture, own failing commit, pushed) → S4 (GREEN repair) → S5,
then a separate-session IMPL-EVAL. Do not mark #1774 acceptance boxes by hand; they mirror the PR's
`acceptance-evidence` block.
