You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=800

use harness

You are running **PLAN-EVAL cycle 2** (separate evaluator session) for PR #127 — CLI JSR production
hardening. The cycle-1 verdict was `FAIL_PLAN` (6/8). The plan has been revised (commit `bc6753e2`).
This is a hard gate: emit a verdict only; do NOT implement anything. Per `gates/plan-gate.md`, this
is the **second and final** FAIL_PLAN cycle before user escalation.

## SKILL

Activate and follow these repo skills before evaluating (read each SKILL.md):
- `.agents/skills/netscript-harness` — 8-phase model, Plan-Gate, plan-protocol, verdict definitions.
- `.agents/skills/netscript-doctrine` — A6 CLI archetype + public-surface rules.
- `.agents/skills/netscript-deno-toolchain` — JSR `deno.json` `bin` field, `with { type: 'json' }`
  module imports, `deno publish`/`deno doc`, https module-resolution semantics. **Confirm the JSR
  `bin` field shape** the plan now specifies.
- `.agents/skills/jsr-audit` — JSR publish surface / readiness.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt gate evidence.

## What to read

1. `.llm/harness/gates/plan-gate.md` + `.llm/harness/evaluator/plan-protocol.md` (your checklist).
2. Your own cycle-1 verdict: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/plan-eval.md`.
3. The **revised** `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/plan.md` (diffs are
   marked `[EVAL-FIX N]` inline).
4. `packages/cli/src/kernel/assets/manifest.ts` — to verify the cycle-2 claim that the four contract
   templates are **already registered** keys.

## How each cycle-1 required fix was closed (verify each)

1. **D1 hydration timing** → §D1.a: `TemplateRegistry.hydrate()` (memoized async) awaited **lazily**
   at the entry of each `createPublicCli` scaffold command handler — explicitly **not** top-level,
   to satisfy F-CLI-15/16 (no module-load FS side effects). Verify this is a concrete, sufficient
   bootstrap decision.
2. **D1 sync→async strategy** → §D1.b: full migration table. Sync consumers (enumerated, ~18 files)
   stay sync and read from the hydrated `content` cache. **Key correction to your cycle-1
   finding:** `generateV1Mod`'s and `contract-template-registry`'s URLs are **already** manifest
   keys (`workspaceContractsV1Empty`, `workspaceContractsV1Aggregate`, `serviceContract`,
   `workspaceContractsMod`) — confirm against `manifest.ts` (lines ~110, 116–118). So they are
   routed through the existing registry keys + `readTemplateAssetSync` (cache), needing **no** async
   conversion and **no** new registry entries. Verify this resolves the "non-registry URL" gap.
3. **D2 bin mechanism** → §D2: `"bin": { "netscript": "./bin/netscript.ts" }` in
   `packages/cli/deno.json` (NOT an `exports` entry); `mod.ts` already runnable via
   `if (import.meta.main)`; exports unchanged; re-verify field shape at slice time.
4. **D1 JSON import** → §D1.c: committed to `import … with { type: 'json' }` for the editor-config
   schema; "fetch acceptable alternative" hedge removed; top-level read removed.
5. **D3 packageSource plumbing** → §D3: enumerated table — `create-default-runner.ts:57`,
   `suite-builder-options.ts:23`, scaffold-init gate **reads** `packageSource` and selects the
   public (`importMode:'jsr'`) init path, plus `.github/workflows/e2e-cli-prod.yml`.
6. **S1 verification (bonus)** → §Slices S1: concrete unit test — (a) static-scan asserting no
   top-level `Deno.read*` in the template adapters/editor-config, and (b) an https proof via a local
   `Deno.serve` static file server feeding a `TemplateRegistry`, asserting `readTemplateAssetSync`
   returns expected content after `hydrate()`.

## Evaluate

Re-walk the Plan-Gate checklist. Confirm the two previously-FAIL items (Decisions locked,
Open-decision sweep) now PASS, and that no new gap was introduced (especially: does lazy hydration
cover **every** scaffold command path that calls a `*Sync` render? Is the `with { type: 'json' }`
import truly free of the top-level-FS prohibition? Does the contract-template manifest-key routing
actually map to registered keys?). Emit **PASS** or **FAIL_PLAN** with file/decision-level required
changes. Post the verdict as a PR comment.


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
- Write /home/runner/work/_temp/openhands/28180508527-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28180508527-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-127/run-28180508527-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 127
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28180508527
