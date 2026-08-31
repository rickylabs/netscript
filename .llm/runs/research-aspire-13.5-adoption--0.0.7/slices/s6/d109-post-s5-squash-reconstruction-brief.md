use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push + PR comment trail, run-dir artifacts; no
  self-certification.
- netscript-doctrine — `packages/cli`/`packages/aspire` are framework code: no `any`/casts/
  lint-ignores introduced; this slice is a git convergence, not new implementation.
- netscript-tools — scoped wrappers (`.llm/tools/run-deno-check.ts` etc.), lock hygiene, raw git
  verification (`git ls-remote` before any `--force-with-lease` push — never guess a SHA).

## Context

# S6 D-109: post-S5-squash reconstruction onto current main (dedicated non-runtime slice)

S5 (#1740) merged to `main` as a **squash merge** (`2a1248d33`) — its real branch history
(`fix/aspire-13-5-s5-literal-ports`, final head `1c2cf2ef5`) is not an ancestor of `main`. PR #1743
(S6, `feat/aspire-13-5-s6-health-checks`) was originally documented as stacked on that S5 branch.
This looked like it might repeat the two-level stacking hazard already hit once this run (D-90).

**It does not.** Direct verification in this worktree (`007-1743-recon`, checked out fresh at
`origin/feat/aspire-13-5-s6-health-checks` == `81a85f12e`, current head after the D-107 CI-glob fix)
shows:

```
git merge-base HEAD origin/main   →  96d44758d8f9405f759771284e0f300a6b176156
git log --oneline 96d44758d..origin/main
  5197e70b7  (exactly one commit — the latest docs commit)
```

So this branch's true git ancestry is **already based on main**, not on the old S5 branch — it was
built via the corrected reconstruction (D-90/D-101) directly against a main-based commit. It is only
**one commit** behind `origin/main`. This is a mechanical convergence, not a semantic collision.

## Task (bounded, non-runtime, git + static checks only)

1. In this worktree, `git fetch origin main` and rebase the current branch
   (`feat/aspire-13-5-s6-health-checks`, currently at `81a85f12e`) onto `origin/main`
   (`5197e70b716eafb82fbb12ddb9a910c248ddb86a`).
2. Verify with `git range-diff <old-merge-base>..81a85f12e origin/main..<new-head>` (or equivalent)
   that every one of the 11 branch-specific commits is content-identical before/after — same diffs,
   just replayed on the new base. List them explicitly in your report:
   `31be7d28a, f2355eec6, 2047fdc34, eea5b423f, fbaa0bb89, 60985a98f, 3a20d00be, 929ff72a2, 9852d63ed,
   c1f425eb9, 81a85f12e` (the last one is the D-107 CI-glob fix — confirm it is present and unchanged
   in the rebased result).
3. Confirm `git merge-base HEAD origin/main == origin/main` after the rebase (full convergence).
4. Run only bounded static checks — no runtime, no Aspire, no Docker:
   - `deno check --unstable-kv` scoped to the packages this branch touches
     (`packages/cli`, `packages/aspire` if applicable) via
     `.llm/tools/run-deno-check.ts --root <path> --ext ts,tsx`.
   - `deno lint` / `deno fmt --check` on exactly the files this branch's 11 commits touch (get the
     list via `git diff --name-only origin/main..HEAD` after rebase, intersected with what the
     branch actually added/changed — do not run a full-repo sweep).
   - Confirm no `deno.lock`/`package-lock.json` drift was introduced by the rebase itself.
5. Do **not** run any runtime/Aspire/Docker step, do not touch `.github/workflows/e2e-cli.yml`
   beyond what's already in the D-107 commit, do not re-run or request any evaluator (native or
   OpenRouter) — the existing Fable 5 IMPL-EVAL cycle-2 and Tier-A verdicts for this slice's product
   commits stand; this is a pure git-convergence + bounded-static-check task.
6. Push the rebased branch with `--force-with-lease` against the exact known prior remote SHA
   (`81a85f12e...` — confirm via `git ls-remote origin refs/heads/feat/aspire-13-5-s6-health-checks`
   immediately before pushing, do not guess the SHA) to
   `feat/aspire-13-5-s6-health-checks`.
7. Report back: old head, new head, range-diff equivalence confirmation (commit-by-commit), the
   bounded static check results (exit codes / pass counts), and confirmation the push succeeded and
   `git merge-base HEAD origin/main == origin/main`.

## Why a dedicated worktree/thread

The coordinator wants dedicated commit/thread/worktree proof for this convergence, independent of
the ongoing S6 implementation thread's context, even though the actual git operation is a
single-commit fast-forward-equivalent rebase. Do not skip the verification steps just because the
diff is small — the goal is a recorded, auditable proof of tree/range equivalence, not just a green
push.
