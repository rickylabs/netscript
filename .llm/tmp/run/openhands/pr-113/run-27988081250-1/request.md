You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=600

use harness — run **PLAN-EVAL cycle 2** (separate-session plan gate) for the **alpha-1 deprecation-shim removal** run on PR #113 (`chore/alpha1-jsr-shim-removal`). This is the second and final cycle: emit `PASS` or `FAIL_PLAN`. This is a hard gate — NO implementation begins until `PASS`.

Planning-only PR. Do NOT implement, delete code, or change framework source. Verify the **revised** plan against the real surface and emit a verdict comment only. No `deno.lock` churn, no source edits.

## What changed since cycle 1 (your `FAIL_PLAN`, run 27986503722-1)
You correctly ruled S3b unsound (workers `.schedule()` has no canonical replacement — two parallel cron subsystems). The plan was revised to **option (b)** per your ruling and user confirmation:
- **PR-B scope is now S1 + S2 + S3a (saga) only.** The workers-side slice **S3b is DEFERRED out of PR-B** entirely and filed as a separate workers-cron/triggers-cron unification follow-up (see `drift.md`). No workers `JobDefinition.schedule` / `JobBuilder.schedule` / scheduler-plumbing / docs are touched by this PR.
- **V8_HEAP_MB correction:** the manifest's T1 "0-consumer" claim (which your cycle-1 table also marked verified) was corrected — `packages/cli/src/kernel/adapters/windows/runtime/v8-profiles.ts:12,46,73` imports the deprecated alias `V8_HEAP_MB`. S1 now folds those 3 lines onto `DEFAULT_V8_HEAP_MB` (value-identical) before deleting the alias; the file stays.
- **Gate additions:** (a) a named, blocking **S1 pre-delete grep gate** over `templates/`/`docs/`/`plugins/*/templates`/scaffold output; (b) **`deno doc --lint` per affected package**; (c) a **jsr-audit surface-scan note** (removal-only ⇒ surface strictly shrinks; residual risk = dangling refs, mechanically gated).

## Inputs to read (on branch `chore/alpha1-jsr-shim-removal`, tip `5d1bee91`)
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan.md` (revised — note the cycle-1 response banner + §Slices + §Gate set + §jsr-audit + §Open-decision sweep)
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/research.md` (V8_HEAP_MB correction at Tier 1)
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` (2026-06-23 option-(b) entry)
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` (your cycle-1 verdict)
- `.llm/harness/gates/plan-gate.md`, `.llm/harness/evaluator/plan-protocol.md`

## What to verify (against the REAL surface — `deno doc` / `git grep` on this branch)
1. **S3b is genuinely gone from scope.** Confirm no slice in the revised plan removes the workers `schedule` field, `.schedule()` builder method, scheduler plumbing, scaffold emission, CLI `--schedule`, or the `.schedule(...)` docs. (Deferral must be clean, not partial.)
2. **S3a (saga) still sound and self-contained** without the workers half — confirm `saga-bus-legacy` + legacy runtime removal has no dependency on the deferred workers work, and the `saga-supervisor.ts:130` `adapter:'legacy'` fold onto native is still correct.
3. **V8_HEAP_MB fold is correct.** Confirm `v8-profiles.ts` is the only live consumer of any of the 8 cli aliases, that `DEFAULT_V8_HEAP_MB` is value-identical, and that S1 lists the fold before the delete. Re-grep the other 7 aliases to confirm they remain 0-consumer.
4. **Gate sufficiency for the (now smaller) breaking removal.** Confirm the named grep gate + `deno doc --lint` + per-package test + `arch:check` + `publish:dry-run` + scaffold.runtime-at-IMPL set is sufficient, and that the jsr-audit note correctly concludes removal-only ⇒ no new slow-types (residual risk = dangling refs, gated).
5. **Version policy + zero-cast** — unchanged from your cycle-1 PASS; reconfirm they still hold for the reduced set.
6. **Lock hygiene** — plan forbids `deno.lock` churn.

## Verdict
Emit `PASS` or `FAIL_PLAN` with file-referenced findings. If `PASS`, the run proceeds to WSL Codex implementation of S1 → S2 → S3a (separate session), then IMPL-EVAL. This is cycle 2 of 2; a second `FAIL_PLAN` escalates to the user. Preserve lock hygiene: do not commit `deno.lock` or source churn.

## SKILL
- `.agents/skills/netscript-harness` — harness phases, PLAN-EVAL protocol, plan-gate, verdict definitions
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface gates (removals touch ARCHETYPE-2/3/5)
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / `deno doc --filter` for export-surface + consumer checks, `deno why`
- `.agents/skills/netscript-tools` — validation evidence + raw-git verification conventions (consumer-grep)
- `.agents/skills/jsr-audit` — publishability rubric for the multi-package public-surface removal
- `.agents/skills/openhands-handoff` — OpenHands run/verdict conventions, pr-comment output mode


Issue/PR title: PR-B: alpha-1 deprecation-shim removal (breaking, zero-compat)

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
- Write /home/runner/work/_temp/openhands/27988081250-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27988081250-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-113/run-27988081250-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 113
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27988081250
