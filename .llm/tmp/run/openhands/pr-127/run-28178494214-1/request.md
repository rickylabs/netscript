You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=800

use harness

You are running a **PLAN-EVAL** (separate evaluator session) for PR #127 — CLI JSR production hardening. Check out this PR branch (`fix/cli-jsr-prod-hardening`). This is a hard gate: emit a verdict only; do NOT implement anything.

## SKILL

Activate and follow these repo skills before evaluating (read each SKILL.md):
- `.agents/skills/netscript-harness` — the 8-phase model, Plan-Gate, evaluator/plan-protocol, verdict definitions.
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface rules; `@netscript/cli` is a CLI application package.
- `.agents/skills/netscript-deno-toolchain` — Deno publish/JSR mechanics, `deno doc`, module-resolution semantics relevant to https-served packages.
- `.agents/skills/jsr-audit` — JSR publish surface / readiness considerations.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers used as gate evidence.

## What to read

1. `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` (the checklist you enforce).
2. `.llm/harness/gates/archetype-gate-matrix.md` for the CLI archetype gates.
3. The run artifacts on this branch: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/research.md` and `plan.md`.
4. The cited source: `packages/cli/src/kernel/adapters/scaffold/editor-config.ts`, `kernel/application/registries/template-registry.ts`, `kernel/adapters/templates/template-asset.ts`, `kernel/adapters/contracts/templates/*`, `packages/cli/deno.json` (exports + publish.include), and the e2e `packageSource` plumbing under `packages/cli/e2e/src/`.

## Context (ground truth)

A prod smoke test of the **published** `@netscript/cli@0.0.1-alpha.2` confirmed the CLI is unusable from JSR:
- `deno run -A jsr:@netscript/cli@0.0.1-alpha.2 --help` → `TypeError: Must be a file URL` at `editor-config.ts:16` (a **top-level** `Deno.readTextFileSync(new URL(..., import.meta.url))`; over https `import.meta.url` is an https URL, which `Deno.readTextFile*` rejects).
- The same read pattern is on the core scaffold template loader and contract templates.
- `./bin/netscript.ts` is not exported, so there's no runnable command from JSR.
- The `scaffold.runtime` e2e runs maintainer/local mode (file:// modules), so it cannot catch either defect.

## Evaluate the plan against these questions

1. **Correctness of root-cause + fix-mechanism (D1).** Is fixing at the single chokepoint (`template-asset.ts` + registry) via a `file:`/`https:`-portable loader (`fetch`/JSON-module import) + de-top-leveling `editor-config.ts` sufficient and complete? Are any asset-read sites missed, or any in-scope read wrongly excluded? Is the sync→async migration sound (callers, `renderTemplateAssetSync`)? Is the `fetch`-vs-bundle-as-modules tradeoff acceptable for alpha (network at scaffold time), and is the permission implication (`--allow-net`/`--allow-read`) for programmatic `createPublicCli` consumers handled?
2. **Bin (D2).** Is the proposed exports/bin change a correct, doctrine-conformant way to make the CLI runnable from JSR without breaking the existing `.`/`./scaffolding`/`./testing` surface?
3. **Prod e2e (D3).** Is wiring the e2e `packageSource` to force JSR + a `release: published` Action a sound way to catch JSR-only defects? Does it correctly leave CI PR validation in maintainer mode? Is the acceptance demo (aspire restore → plugins → db init/generate/seed → start → health → traces + 4 doc tutorials) verifiable in CI?
4. **Verification bar (D4)** — is it provable, and does it actually prove the https path (given dry-run cannot)?
5. **Slicing, risks, doctrine/process** — is the slice plan commit-sized and is the SOURCE-via-Codex / supervisor-authors-CI split correct?

## Output

Walk the Plan-Gate checklist item by item. Emit **PASS** or **FAIL_PLAN** with specific, actionable required changes (file/decision level). Two FAIL_PLAN cycles then escalate. Post the verdict as a PR comment.


Issue/PR title: fix(cli): JSR production hardening — portable asset reads, runnable bin, prod e2e

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
- Write /home/runner/work/_temp/openhands/28178494214-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28178494214-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-127/run-28178494214-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 127
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28178494214
