You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment

use harness

IMPL-EVAL (final evaluator pass) for the Deno-native JSR-URL `plugin add` marketplace foundation — issue #167, PR #168, branch `feat/plugin-install-jsr-dx`.

You are the IMPL-EVAL evaluator. This is a SEPARATE evaluator session from the generator (WSL Codex implemented; you evaluate). You do NOT implement or fix — you READ the built artifact + run artifacts, independently verify, and emit a verdict. The 12 implementation slices (S1–S12) plus an adversarial hardening pass are complete and reported green on this PR branch.

## SKILL
- `netscript-harness` — read `.llm/harness/evaluator/protocol.md` (IMPL-EVAL instructions) and `.llm/harness/evaluator/verdict-definitions.md` (verdict meanings). Follow the IMPL-EVAL protocol exactly. The generator wrote `worklog.md`, `context-pack.md`, `drift.md`, `commits.md`; read them plus the plan, the selected archetypes, scope overlays, and gate docs.
- `netscript-doctrine` — CLI is ARCHETYPE-6, plugins ARCHETYPE-5; verify public-surface rules + the "plugin owns its scaffolding" decision (D4); `arch:check` must be clean.
- `netscript-cli` — the `add` command path, scaffold-runner, e2e suites, registry generation, workspace mutators.
- `netscript-deno-toolchain` — `deno doc` the public surface; scoped check/lint/fmt wrappers; jsr-audit; `publish:dry-run`; `arch:check`; the `deno x`/`deno run` scaffold invocation contract.
- `jsr-audit` — every new public export (`@netscript/plugin/protocol`, the 5 plugin `./scaffold` exports) must be JSR-publishable.

## What to evaluate
The #167 mechanism = a 6-step pipeline: resolve spec → validate JSR package → STATICALLY classify the plugin protocol (never execute plugin code pre-confirmation) → confirm external installs → run the plugin's OWN dx `./scaffold` entrypoint under confined permissions → integrity-verify (sha256) + post-scripts. The user's bar: "extremely robust, Enterprise grade, AND Deno native." The user's #1 priority: NO framework/plugin source leaks into the user's project (no-copy userland path).

## Required reading (ground truth)
- `.llm/tmp/run/issue-167-marketplace-plugin-install/`: `plan.md` (8 Locked Decisions D1–D8, the Risk Register, PLAN-EVAL notes 1–4), `research.md`, `worklog.md` (incl. the 2026-06-28 Adversarial Implementation Review Hardening section with the ADV-001..ADV-011 findings table), `context-pack.md`, `drift.md`, `commits.md`.
- The issue #167 mandate + dossier comments (`gh issue view 167`).
- The diff of PR #168 vs `main`; the implementation across `packages/cli`, `packages/plugin`, and the 5 `plugins/*`.

## Independent verification (do NOT just trust the worklog — re-run / re-check)
1. **Re-run the gates from the NATIVE WSL worktree** (`/home/codex/repos/netscript-wave5-apps`, NOT /mnt/c): the scoped check wrapper across the touched roots; `deno task arch:check`; the focused CLI/plugin tests from the REPO ROOT; `publish:dry-run` for `packages/plugin` + the 5 plugins; and BOTH e2e suites: `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty` AND `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Both must be exit 0, failed=0. (Note: the `run-deno-lint.ts`/`run-deno-fmt.ts` wrappers exit 1 with 0 findings — a pre-existing wrapper/config anomaly recorded in S2/S3/S11; the file-scoped fallbacks are the real verdict.)
2. **Verify the security posture independently** (the marketplace bar): static-only validation (no `import()`/`deno run`/eval of plugin code before the confirmation gate); third-party confined permissions (no blanket `-A`; `--allow-write` scoped to project root; `--deny-net`/`--deny-run` for third-party); the confirmation gate cannot be silently bypassed (verify the ADV-001 `--ci`/programmatic fix holds); manifest path-traversal rejection (verify the ADV-002 fix); sha256 integrity ABORTS on mismatch.
3. **Verify the user's #1 priority**: the userland public `plugin add` path copies NO framework/plugin `src/` tree and embeds NO monorepo paths — confirm `scaffold.userland-install` asserts this and that the copier modules are reachable only from the separate maintainer dev tool.
4. **Verify self-containment**: the 5 plugin `./scaffold` entrypoints never import `@netscript/cli`.
5. **Verify honesty**: nothing claims the prod `deno x jsr:` URL leg is proven green pre-publish; that leg is the post-publish `e2e-cli-prod` gate (recorded as debt `ISSUE-167-PROD-JSR-SCAFFOLD-E2E`).

## Verdict
Write `.llm/tmp/run/issue-167-marketplace-plugin-install/evaluate.md` and emit ONE verdict per `verdict-definitions.md`: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Justify with the gate results you re-ran (raw exit codes + counts) and any defect you found with file:line. If you find a real BLOCKER the adversarial pass missed, that is `FAIL_FIX` with a precise repro. The deferred backlog items (uninstall, marketplace portal/signatures, Option-B rename, standalone protocol pkg, prod-JSR e2e) are already recorded as debt by design — do NOT fail the PR for those; they are out of #167 scope.

Post your verdict + the re-run gate evidence as your PR comment.



Issue/PR title: Issue #167 (planning): Deno-native JSR plugin installer — research + plan

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
- Write /home/runner/work/_temp/openhands/28322918650-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28322918650-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-168/run-28322918650-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 168
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28322918650
