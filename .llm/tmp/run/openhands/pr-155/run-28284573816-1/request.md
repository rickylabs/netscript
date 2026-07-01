You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

use harness

You are the **PLAN-EVAL** evaluator (harness Plan-Gate, separate session from the generator). This is a hard gate: no implementation slice may begin until you return `PASS`. Evaluate the alpha.11 fix-train plan on **this PR branch** (`harness/alpha11-fixtrain-plan`, off `main`). The PR carries **plan artifacts only — no framework source**.

## SKILL

Activate and follow these repo skills before evaluating:

- `.agents/skills/netscript-harness` — harness orchestration, the 8-phase model, evaluator separation, and the PLAN-EVAL protocol. **This is your governing skill.**
- `.llm/harness/evaluator/plan-protocol.md` — the PLAN-EVAL instructions you must execute.
- `.llm/harness/gates/plan-gate.md` — the Plan-Gate checklist you enforce.
- `.llm/harness/evaluator/verdict-definitions.md` — `PASS` vs `FAIL_PLAN` definitions.
- `.agents/skills/netscript-doctrine` — package/plugin archetype, public-surface, and gate doctrine (Slice C adds a **new public CLI surface**: `--cache` / `--cache-backend`; Slice E touches the service health surface).
- `.agents/skills/netscript-cli` — CLI/scaffold command surface (init flags, interactive prompts, scaffold emission) for sanity-checking Slices A/C/E.
- `.agents/skills/netscript-deno-toolchain` + `.agents/skills/jsr-audit` — for the type-soundness (Slice B) and publish-surface reasoning.
- `aspire` skill — for the `aspire start` vs `aspire run` correctness claims in Slices D/E and the F-6 self-provisioning disposition.

## What to read

1. `.llm/tmp/run/alpha11-fixtrain--plan/research.md` — code-surface map, e2e↔tutorial command drift, the two code-truth scout resolutions, slice topology.
2. `.llm/tmp/run/alpha11-fixtrain--plan/plan.md` — the 6 slices (A CLI-core, B type-soundness, C interactive+cache, D doc-truth, E health+e2e, F install-pin), gate set, debt, and the locked open items.

## What to evaluate

Run the full Plan-Gate checklist. In particular, adjudicate:

1. **Slice decomposition** — are A/B/C/D/E/F correctly scoped, independently committable/gateable, and dependency-ordered? Is the Claude-supervises / Codex-implements / docs-lane split correct (Slice C/E framework source = Codex; D/F = docs lane)?
2. **F-6 disposition** — research claims `db init/generate/seed` self-provision Aspire via `DbOperationRunner.executeDetached()`, so F-6 is a **doc fix, not a code reorder**. Verify against the cited code (`packages/cli/src/kernel/adapters/database/operation-runner.ts`) and confirm or reject.
3. **F-13 diagnosis** — plan treats the `:3001` service-not-served defect as Windows-`aspire run`-specific and adds a `scaffold.runtime` `:3001` health probe (Slice E) as the diagnostic, fixed via Slice D's `aspire run`→`aspire start`. Is that a sound plan given the e2e passes green on Linux?
4. **New public surface (Slice C)** — `--cache` (default on) + `--cache-backend redis|garnet|deno-kv` (default redis), interactive prompts for **all** missing options via the dormant `PromptPort`/`CliffyPrompt`, per-backend scaffold emission. Is the public-surface change doctrine-conformant and adequately specified (defaults preserved for CI non-interactive)?
5. **Type-soundness (Slice B)** — is "rewrite the template to existing `QueryClientPort` methods" preferred correctly over widening the SDK, and is the F-15c "publish-only drift, verify-not-fix" disposition acceptable or a gap?
6. **Gate set + debt** — are the listed gates (`deno task check`/`lint`/scoped fmt, `scaffold.runtime` e2e incl. the new `:3001` probe, `e2e:cli`) sufficient to certify each slice, and is the deferred-item/debt list complete?

## Output

Write your verdict to `.llm/tmp/run/alpha11-fixtrain--plan/plan-eval.md` (commit it to this PR branch) **and** post the summary as a PR comment. Emit exactly one of:

- `PASS` — plan is implementation-ready; list any non-blocking advisories.
- `FAIL_PLAN` — list each blocking deficiency with the specific slice/section and the concrete correction required.

Do not commit framework source, `deno.lock`, or unrelated churn. Preserve lock hygiene. Two `FAIL_PLAN` cycles maximum before escalation.


Issue/PR title: alpha.11 fix-train: plan + research (PLAN-EVAL gate)

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
- Write /home/runner/work/_temp/openhands/28284573816-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28284573816-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-155/run-28284573816-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 155
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28284573816
