You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=500

use harness

# WI-12 IMPL-EVAL — v2 plan is implementable green-per-commit?

## SKILL

- netscript-harness: this IS a harness evaluator pass; you are the IMPL-EVAL reviewer, not the implementer
- netscript-doctrine: package and plugin architecture context for `packages/fresh`
- netscript-tools: validation wrappers (`deno task check:packages` / `lint` / `fmt:check`), `rtk git …`
- netscript-pr: branch/PR/labels/comment conventions for WI-12 PR #183
- netscript-cli: scaffold / template migration context (the 6 CLI template files are the migration target — `apps/playground` is NOT in this repo; it's CLI-scaffolded)
- netscript-deno-toolchain: `deno doc` / `deno why` before any source reading; lock-hygiene rules
- openhands-harness: evaluator separation rules; cloud runs must not self-certify work
- rtk: token-saving read-heavy wrappers (use `rtk git log`, `rtk gh pr view`)
- netscript-impl-eval-criteria: the canonical IMPL-EVAL scorecard (verdict, blockers, follow-ups)

## Goal

You are the **IMPL-EVAL** reviewer for PR #183. The first plan-eval returned REQUEST CHANGES on v1; the user (and a v2 plan-revision Codex session) produced v2 (planning-only commit `a2e3ee05`, force-pushed, PR body v2). Your job is to evaluate whether **v2 is a sound basis for the upcoming implementation work**, and to surface any blockers the implementation agent will hit on the first 8-commit stack.

You are NOT to implement. You are NOT to amend the v2 commit. You produce a **verdict and a blocker list** written to `OPENHANDS_SUMMARY_PATH`, then post a single summary comment to PR #183 (per the `pr-comment` output mode).

**PASS** = v2 is implementable as-written, and the 8-commit order is green-per-commit (each commit has a clear, runnable green state on `deno task check:packages` / `deno test`).
**REQUEST CHANGES** = there are concrete blockers that will surface during the first 3 implementation commits.

The user wants the verdict crisp and actionable. If REQUEST CHANGES, list each blocker with: (a) what the implementation agent will hit, (b) the fix, (c) which commit it lands in.

## Target

- **PR**: https://github.com/rickylabs/netscript/pull/183
- **Repo**: rickylabs/netscript
- **Head SHA**: `a2e3ee05081a6f06a2ca7d4d8ad1aba54d26ab55`
- **Base SHA**: `fc911ba16b3a7eb4ca8e08bca57882af5347c918` (origin/main)
- **Branch**: `feature/wi12-page-module-route-binding-codegen`
- **Worktree (use exactly this)**: `/home/codex/repos/netscript-wi12` (native WSL ext4 — DO NOT use `/mnt/c` paths)
- **State**: DRAFT, single planning commit, no implementation

## Pre-flight (required)

1. `cd /home/codex/repos/netscript-wi12`
2. `git status --short --branch` — confirm branch is at `a2e3ee05`.
3. `deno --version` — confirm toolchain.
4. `rtk gh pr view 183 --repo rickylabs/netscript --json headRefOid,baseRefOid,isDraft,state` — sanity-check the PR is still DRAFT and head is `a2e3ee05`.
5. Read the v2 planning doc end-to-end: `.llm/frontend/wi/WI-12-definePage-route-binding-codegen.md` (494 lines).
6. Read the source spec: `/mnt/c/Users/chaut/.copilot/session-state/2004fad4-33a3-4744-9a50-25e4267cc7b4/files/WI-12-prompt.md` (400 lines).
7. Read the v2 PR body: PR #183 description (the body is the dispatch-time equivalent of `/mnt/c/Users/chaut/.copilot/session-state/2004fad4-33a3-4744-9a50-25e4267cc7b4/files/wi12-pr-body-v2.md` if you want offline).
8. Read the previous plan-eval verdict for context: `gh pr view 183 --repo rickylabs/netscript --json comments` and look at comment 4844457840.

## Source-of-truth code references (must read)

Read each of these to validate the plan's claims. Use `deno doc` or `rtk` to navigate.

1. **Current builder API**: `packages/fresh/src/application/builders/define-page/builder/mod.tsx` and any `define-page/types.ts`. Confirm `.withRoute(...)` exists and the current type-state machine.
2. **Current Vite plugin**: `packages/fresh/src/application/vite/vite.ts` — read the `transform()` and `generateBundle()` hooks, plus the existing `manifestWriter`/`manifestGenerator` calls.
3. **Manifest generator**: `packages/fresh/src/application/route/manifest.ts` — the sidecar discovery algorithm and the `.generated/manifest.ts` writer. Find the data structures and the existing `bindRoutePattern(...)` integration.
4. **Route pattern inference (the #179 fix)**: `packages/fresh/src/application/route/route-pattern.ts` (or wherever the `createRouteReference` / `EmptySegment` lives) — verify the implementation uses `{}` for static-segment inference, NOT `Simplify<>`. This is the load-bearing dependency for Form A's `routes.<key>.$route` typed access.
5. **CLI scaffold templates (the 6 migration files)**: confirm each file exists, and is currently authored to use a now-changed pattern. Read:
   - `packages/cli/src/kernel/assets/app/routes/dashboard.tsx.template`
   - `packages/cli/src/kernel/assets/app/routes/examples/index.tsx.template`
   - `packages/cli/src/kernel/assets/app/routes/examples/crud.tsx.template`
   - `packages/cli/src/kernel/assets/app/routes/index.tsx.template`
   - `packages/cli/src/kernel/assets/app/routes/examples/telemetry/index.tsx.template`
   - `packages/cli/src/kernel/assets/app/routes/(design)/design/components.tsx.template`
6. **Test file locations** (corrected in v2): confirm the test files exist at:
   - `packages/fresh/src/application/builders/define-page/tests/builder.test.tsx`
   - `packages/fresh/src/application/route/manifest.test.ts`
   - `packages/fresh/src/application/vite/vite.test.ts`
   If they do NOT exist, list the actual paths the v2 plan should target. This was blocker #5 in the v1 plan-eval.
7. **`#179` PR**: `gh pr view 179 --repo rickylabs/netscript --json files,title,body` and the merge commit `282fea54` — confirm `EmptySegment` is the canonical pattern and that `Simplify` is not used for path inference.

## Evaluation criteria (use this scorecard)

For each criterion, give a 0-10 score and 1-3 sentences of justification. Sum to a total.

1. **v2 plan completeness (10/10)** — Does the v2 doc cover all 5 v1 blockers? Specifically: (a) two-tree model explicit, (b) 6 playground migrations enumerated with paths, (c) synthesized inline contract design specified (location, name shape, import path), (d) Vite HMR-vs-build behavior, (e) test file paths corrected.
2. **Green-per-commit 8-commit order (10/10)** — Is the 8-commit ordering sound? Each commit must leave `deno task check:packages` and `deno test` green. Walk the ordering and check that no commit produces a mid-state where types/imports are broken.
3. **Type-state machine for `.withRouteContract` (10/10)** — Does the v2 plan correctly describe the type-state promotion so the new method's behavior matches `.withRoute(...)`'s downstream compile guarantees? Read the existing type-state and confirm v2's design is implementable.
4. **`EmptySegment` from #179 (10/10)** — Does the plan call out the `Simplify` vs `EmptySegment` poison? The implementation MUST use `EmptySegment` for any intersection flattening in the new codegen path, or it re-introduces the #178 regression.
5. **Sidecar vs inline conflict resolution (10/10)** — Is "inline wins, sidecar stays, build warning" the correct severity? Will the build warning actually fire at build time (not just at Vite dev time)? Cross-check with the existing sidecar discovery code.
6. **Vite plugin page-module rewriting (10/10)** — Is `pageModuleRouteBinding: true | false` (default `true`) the right option name and default? Does the plan correctly distinguish dev-mode `transform()` from build-mode manifest writer behavior? Will idempotent writes prevent HMR loops?
7. **Test plan (10/10)** — Are the 3 test file paths correct, and do the unit tests cover the right boundaries? Specifically: Form A/B/C AST discovery, type-state promotion, Vite idempotency, sidecar vs inline conflict.
8. **CLI template migration (10/10)** — Are all 6 files in `packages/cli/src/kernel/assets/app/routes/...` the right targets? Are Form A and Form B distributed correctly (3 + 3)?
9. **Non-goals are explicit (10/10)** — Does the plan rule out the things it should: re-introducing page-module-export discovery, changing the sidecar algorithm, auto-deleting sidecar files, etc.?
10. **Dependencies (10/10)** — Is the post-#179 dependency clearly stated and the rationale explained?

**Verdict rules**:
- Total ≥ 90 AND no individual criterion < 7 → **APPROVED**
- Total 80-89 OR any individual criterion 5-6 → **APPROVED WITH FOLLOW-UPS** (list the follow-ups)
- Total < 80 OR any individual criterion < 5 → **REQUEST CHANGES** (list each blocker)

## Implementation-readiness blockers to look for

These are the landmines the implementation agent will hit. Check each.

1. **`withRouteContract` method already exists?** — Open `packages/fresh/src/application/builders/define-page/builder/mod.tsx` and grep for `withRouteContract`. If it already exists (because the JSR doc drift the user reported was just docs, not behavior), the v2 plan is wrong about "restore" and Phase A.1 must be reframed.
2. **`bindRoutePattern` API signature** — Find the current signature. The v2 plan says `bindRoutePattern(contract, routePattern, {...})`. Verify the second arg is the raw pattern string and the third is options. If the signature is different, Form A's generator emission is wrong.
3. **`createRouteReference` vs `bindRoutePattern` for Form C** — v2 says Form C uses `createRouteReference(routePatterns.<key>)`. Confirm `createRouteReference` is the public API and takes a raw pattern. If it's `bindRoutePattern` with a default-contract, the v2 design is wrong.
4. **`.generated/manifest.ts` and `.generated/routes.ts` writer** — Read the existing manifest writer. Is there one file or two? Does the writer run during Vite dev mode (per-file transform) or only on `generateBundle`? The v2 plan must match the real flow.
5. **`definePage().build()` is the consumer of `.withRoute(routes.<key>.$route)`** — Trace the type chain. Does `.withRoute(boundRef)` type-check when `boundRef` is the synthesized const from `.generated/routes.ts`? Walk the types and confirm.
6. **Vite dev HMR loop** — If the Vite `transform()` rewrites the page module AND the page module imports from `.generated/routes.ts`, AND the Vite manifest writer watches the same files, is there a loop? The v2 plan says "skip if already-matching" but the implementation needs to define "matching" precisely.
7. **CLI template migration test path** — The 6 files are at `packages/cli/src/kernel/assets/app/routes/...`. Does the `deno task check:packages` gate actually compile these templates, or are they only consumed at `cli scaffold` time? If only consumed at scaffold time, the migration doesn't need to be in the `check:packages` green path.
8. **Build warning severity** — v2 says "Inline form takes precedence. Delete the sidecar to silence this warning." but does NOT auto-delete. Is the warning emitted at build time (CI-visible) or only at Vite dev time? Implementation agent needs a clear answer.
9. **Type-state `.withRouteContract` collides with `.withRoute(...)`** — If a user writes BOTH, what's the error? v2 says "build error: Pick one." — is this a type error, a runtime check, or both?
10. **Idempotency in dev mode** — When the user has no inline `.withRouteContract` and the sidecar is also absent (Form C default), does the Vite plugin's transform skip cleanly, or does it insert `.withRoute(routes.<key>.$route)` on every save (and re-trigger HMR)?

## Report-back (write to OPENHANDS_SUMMARY_PATH)

The summary MUST follow this exact structure. The workflow reads it as the comment body.

```markdown
**[PHASE: IMPL-EVAL] [VERDICT: APPROVED|APPROVED WITH FOLLOW-UPS|REQUEST CHANGES]**

## Scorecard (out of 100)

| # | Criterion | Score | Note |
|---|-----------|-------|------|
| 1 | v2 plan completeness | X/10 | … |
| 2 | Green-per-commit 8-commit order | X/10 | … |
| 3 | Type-state machine | X/10 | … |
| 4 | EmptySegment from #179 | X/10 | … |
| 5 | Sidecar vs inline conflict | X/10 | … |
| 6 | Vite plugin page-module rewriting | X/10 | … |
| 7 | Test plan | X/10 | … |
| 8 | CLI template migration | X/10 | … |
| 9 | Non-goals explicit | X/10 | … |
| 10 | Dependencies | X/10 | … |
| **Total** | | **XX/100** | |

## Blocker list

For each blocker, name: (a) what the implementation agent will hit, (b) the fix, (c) which commit it lands in.

1. …
2. …

## Implementation readiness

State explicitly whether the v2 plan is implementable green-per-commit. If yes, confirm the 8-commit order is sound. If no, name the smallest revision that unblocks the implementation agent.

## Follow-up actions (if APPROVED WITH FOLLOW-UPS)

Each follow-up is a small, non-blocking clarification or tightening that the implementation agent can decide. List as `<!-- follow-up: … -->` so the user can grep them later.

## Recommendation

One paragraph: should the coordinator dispatch the implementation agent now, wait for plan revisions, or split the work? Be specific about what the next coordinator action should be.
```

## Hard rules

- **DO NOT modify any source file.** You are evaluator, not implementer. If you need to verify a claim, READ the code; do not edit it.
- **DO NOT push any commits.** Your only persistent writes are the `OPENHANDS_SUMMARY_PATH` artifact and the workflow-owned status comment.
- **DO NOT call `gh pr edit` or `gh issue comment` directly.** The workflow posts the comment from your summary; you write the summary file and exit.
- **DO use `rtk`** for read-heavy commands (`rtk git log`, `rtk gh pr view`, `rtk gh api`) to save tokens.
- **DO write `OPENHANDS_SUMMARY_PATH` before exit** — the workflow ignores runs without it.
- **DO be precise** — if you cite a file path, copy it from `deno doc` / `git ls-files` / `find`, not from the v2 plan. If the v2 plan's path is wrong, say so in the blocker list.
- **DO respect the per-PR concurrency rule** — only one OpenHands run per PR at a time. If you discover a concurrent run, abort cleanly with a `Bootstrap failed` summary.

## Done when

- `OPENHANDS_SUMMARY_PATH` written with the full scorecard and blocker list.
- Workflow posts one summary comment to PR #183 with the verdict and scorecard.
- You exit cleanly.


Issue/PR title: feat(fresh): restore inline .withRouteContract shorthand + codegen page-module route binding (WI-12)

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
- Write /home/runner/work/_temp/openhands/28474310084-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28474310084-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-183/run-28474310084-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 183
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28474310084
