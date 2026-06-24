You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=200

use harness — **IMPL-EVAL for PR1 (JSR alpha-1 publish mechanics, PR #116).** You are the IMPL-EVAL evaluator, a separate session from the WSL Codex generator and from the adversarial reviewer. Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`, then independently evaluate the implemented PR. Emit one of `PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT` with concrete reasons grounded in commands you ran, and write the verdict to `.llm/tmp/run/chore-jsr-alpha1-publish-prep/evaluate.md` (commit it on this branch). Do NOT fix anything — this is the certification pass.

## MECHANICS (a prior partial run was blocked — read this first)
- You are ALREADY checked out on `chore/jsr-alpha1-publish-prep`. Do NOT run `git checkout`,
  `git switch`, `git stash`, `git reset`, `git clean`, or `git fetch <other-ref>` — a prior run was
  hard-blocked by a credential/permission security check on exactly those operations. Inspect with
  read-only `git log` / `git show` / `git diff` and the filesystem (`cat`/`ls`/`rg`) only. If ANY git
  command is refused, fall back to reading files directly — never retry the blocked git op.
- A prior partial run already independently verified **Q1 (version alignment — all 32 members at
  `0.0.1-alpha.1`), Q2 (single version source, zero `^1.0.0`), Q5 (publish.yml), Q6 (lock clean)** as
  PASS. Re-confirm them cheaply, then spend your budget on the UNFINISHED, higher-risk checks: **Q3
  (JSONC→JSON drift), Q7 (the gate re-runs — REQUIRED, especially `publish:dry-run` MUST exit 0), Q8
  (casts), and independently re-verifying the `1a21808f` adversarial fixes.**
- Your #1 deliverable is the VERDICT: write `.llm/tmp/run/chore-jsr-alpha1-publish-prep/evaluate.md`
  and `git add` + `git commit` it on this branch (commit only that file; the harness handles the run
  trace). Emit `PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT` even if some gate is environmentally
  unrunnable — in that case record which gate could not run and why, and base the verdict on the
  evidence you DID gather. An incomplete run with no verdict file is the worst outcome; do not repeat it.

## SKILL
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate-evidence rules.
- `.agents/skills/netscript-deno-toolchain` — version authority (`deps:latest`, NOT `outdated --latest`), `publish:dry-run`, `bump-version`, lock hygiene.
- `.agents/skills/jsr-audit` — publish-surface / slow-types rubric.
- `.agents/skills/netscript-cli` — CLI scaffold / import-resolver / maintainer surface.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, gate-evidence rules.
- `.agents/skills/rtk` — prefix read-heavy git/grep with `rtk`.

## What to read (branch `chore/jsr-alpha1-publish-prep`, PR #116)
- `.llm/tmp/run/chore-jsr-alpha1-publish-prep/{research.md,plan.md,plan-eval.md,worklog.md,drift.md,commits.md,context-pack.md}`
- The 4 implementation slice commits: `6c66850c` (version align), `159e035d` (single-source JSR pins), `e03aefef` (docs version + framing), `801dfdaa` (OIDC publish workflow + lock).
- The adversarial pre-IMPL-EVAL review already ran and committed: `1a21808f` (close alpha-1 version gaps — root `deno.json` was `0.0.1-alpha.0`, `release-eject-constants.ts` hardcoded `LOCKSTEP_VERSION='0.0.1-alpha.0'`, config readme test fixture used `0.0.1-alpha.0`) and `8ffb48fc` (review evidence appended to `worklog.md` `## Adversarial review`). RE-VERIFY these fixes independently — do NOT trust the worklog; re-derive from the tree.

## Hard questions the verdict must answer
1. **Version alignment.** Are ALL workspace members at exactly `0.0.1-alpha.1` (every `packages/*/deno.json` + `plugins/*/deno.json` + the root `deno.json`)? Any member off-version, or any `jsr:@netscript/*` self/cross-ref not at alpha.1 (no `^`, no `1.0.0`, no stray `0.0.1-alpha.0`)? Independently scan — confirm `1a21808f` actually closed every gap.
2. **Single version source.** Does `packages/cli/src/kernel/constants/jsr-specifiers.ts` derive the version from `packages/cli/deno.json` (drift-free, side-effect-free import, no new runtime read permission), and do all 4 source files (jsr-specifiers, scaffold/import-resolver, public/jsr-import-resolver, maintainer/plugin-import-rewriter) emit EXACT `@0.0.1-alpha.1` pins (NOT `^`, NOT `^1.0.0`)? `rg -n 'jsr:@netscript/.+@\^?1\.0\.0' packages/cli/src` MUST be empty. Confirm `release-eject-constants.ts` now consumes the single source (not a re-hardcode). Is the added `prisma-adapter-mysql` map entry a real publishable member or scope creep?
3. **JSONC→JSON drift.** Slice 2 stripped a comment from `packages/cli/deno.json` to enable a JSON import. Sound, or does it lose load-bearing config? Confirm the import is side-effect-free and the file stays valid for every consumer (deno task resolution, publish).
4. **Docs version + voice.** Are all stale `^1.0.0` / `1.0.0` / "not installable" / forward-looking framing strings gone from `docs/site` + `packages/config` (only the intended open-debt marker `docs/site/why.vto:133` may remain)? Does `docs/site/_data.ts` single-source the release version? Zero banned "honest/honesty/candor" framing?
5. **Publish workflow.** Is `.github/workflows/publish.yml` correct: trigger `on: push: tags: ['v*']`, `permissions: {id-token: write, contents: read}`, no GITHUB_TOKEN-based publish, `publish:dry-run` fail-fast before `deno publish`, `denoland/setup-deno` pinned on the repo's 2.8 line, workspace-root `deno publish` (not per-package), and NO premature release-tag push embedded?
6. **Lock hygiene.** Is `deno.lock` churn (if any) version-driven ONLY — no unrelated dependency drift, no junk files? `git diff origin/main -- deno.lock`.
7. **Gates re-run.** Independently re-run and report raw exit codes: `deno task publish:dry-run` (MUST exit 0 at alpha-1), `deno task check:scaffold-versions`, the 5 named CLI test files, and the `docs/site` build. The 158 pre-existing docs-site fmt findings are recorded drift — do NOT treat them as this PR's regression unless a slice file newly introduced one. The 6 `.llm/tmp/run/openhands/pr-*/request.md` CRLF working-tree files are pre-existing, unrelated, and were intentionally left untouched — not this PR's churn.
8. **Casts.** Zero new casts beyond the 2 accepted repo-wide (centralized contract `as unknown as`, top-level router `any`).

Be adversarial and ground every claim in a command you ran. If a gate fails or a stale pin survives → `FAIL_FIX`. Do NOT fix anything yourself; this is the evaluator pass. Preserve lock hygiene: do not commit `deno.lock` or source churn beyond your `evaluate.md`.


Issue/PR title: chore(publish-prep): JSR alpha-1 publish mechanics (PR1)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28100018347-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28100018347-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-116/run-28100018347-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 116
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28100018347
