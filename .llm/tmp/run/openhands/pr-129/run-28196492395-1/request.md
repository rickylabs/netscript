You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=300

use harness

You are running **PLAN-EVAL** (separate evaluator session, before any implementation) for the
`chore/release-prep-alpha3` branch / this PR — the last pre-release gate before publishing the JSR
`0.0.1-alpha.3` release train. This is a **supervisor/CI + test-fixture** slice: no `packages/`
runtime source changes, no `plugins/` changes. Emit a `PASS` or `FAIL_PLAN` verdict comment.

## SKILL

- `.agents/skills/netscript-harness` — PLAN-EVAL protocol, plan-gate, verdict definitions.
- `.agents/skills/netscript-deno-toolchain` — `bump-version` semantics, `deno doc`, publish dry-run.
- `.agents/skills/netscript-tools` — scoped check/lint wrappers, lock hygiene, raw git verification.
- `.agents/skills/jsr-audit` — JSR publish surface + version-alignment expectations.
- `.agents/skills/deno-fresh` / `SCOPE-docs` — docs-site (Lume) build + Pages deploy surface.

## What to read

- `.llm/tmp/run/chore-release-prep-alpha3--release-prep/research.md` and `plan.md` on this branch.
- `.llm/harness/gates/plan-gate.md`, `.llm/harness/evaluator/plan-protocol.md`.

## What the plan proposes (verify each is grounded and correct)

1. **Slice 1 (CI):** add `.github/workflows/pages.yml` to `main` triggered on `push` (main,
   `docs/site/**`), `release: { types: [published] }`, and `workflow_dispatch`; build `docs/site`
   (Deno `2.9.0`, matching #128) and deploy to the `github-pages` environment. The build/deploy
   steps are ported verbatim from `docs/user-site:.github/workflows/pages.yml`.
2. **Slice 2 (CLI test fixtures):** replace hardcoded `@0.0.1-alpha.2` literals in the listed CLI
   test files with values derived from `NETSCRIPT_RELEASE_VERSION`
   (`packages/cli/src/kernel/constants/jsr-specifiers.ts`), plus one guard test forbidding stray
   literal `@0.0.1-alpha.N` JSR specifiers under `packages/cli/src/**`. No change to
   `packages/cli/deno.json` version field.

## Hard checks (refute or confirm with evidence)

1. **F1 grounding:** confirm `main:docs/site/_data.ts` already imports `packages/cli/deno.json` and
   exports `releaseVersion`/`releaseSpecifier`. If true, no docs-side version code is needed.
2. **F2 grounding:** confirm via `gh api repos/<owner>/<repo>/pages` that Pages `build_type` is
   `workflow` and `source.branch` is `main`; confirm the `github-pages` environment allow-lists
   `main`; confirm `docs/site` content does not diverge between `main` and `docs/user-site`
   (`gh api .../compare/main...docs/user-site`). If `main` is NOT allow-listed or Pages source is
   not `main`, that is a FAIL_PLAN gap the plan must own.
3. **F3 grounding:** confirm `pages.yml` is absent on `main` and that `release:` events only fire
   workflows from the default branch — i.e. Slice 1 really is the missing redeploy trigger.
4. **F4 grounding:** confirm the listed CLI test files assert literal `@0.0.1-alpha.2` (so a bump
   breaks them) AND that `jsr-specifiers.ts` derives the version from `cli/deno.json` (so runtime
   scaffold output is already drift-free). Confirm Slice 2's derivation approach actually removes the
   break without weakening the assertions (the test must still assert the *correct* specifier, just
   computed not hardcoded).
5. **Scope/lane:** confirm no `packages/` runtime source or `plugins/` source is in scope; Slice 2 is
   test-only + one doc comment; zero-cast rule respected; no `deno.lock` churn planned.
6. **Sequencing soundness:** the plan keeps the actual version bump/tag/release OUT of this PR
   (separate step after merge). Confirm that is correct and that this PR alone leaves `main` green
   (no bump applied here, so existing alpha.2 fixtures still pass on this PR; the derivation makes
   them bump-*safe* for the later release PR). Flag if the derivation would break the CURRENT
   (unbumped) suite.

## Verdict

`PASS` only if all six checks hold and the plan is implementable as written with no missing gate.
Otherwise `FAIL_PLAN` with the specific gap(s). Write your verdict to
`.llm/tmp/run/chore-release-prep-alpha3--release-prep/plan-eval.md` and post it as a PR comment.
Do not implement anything.


Issue/PR title: chore(release-prep): alpha.3 gate — docs redeploy-on-release + scaffold version zero-drift

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
- Write /home/runner/work/_temp/openhands/28196492395-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28196492395-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-129/run-28196492395-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 129
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28196492395
