You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
use harness

@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

# PLAN-EVAL — PR #120 CLI `dx`-runnable slice (`feat/cli-dx-runnable`)

You are the **PLAN-EVAL** evaluator (separate session from the generator). This is a **source slice**
on `@netscript/cli` that gates the final CLI publish (the CLI is published LAST in the road-to-JSR
program; its first published alpha must ship a `deno dx`-runnable entry). Evaluate the **plan only** —
no implementation exists yet. Do NOT author code. Produce a PASS / FAIL_PLAN verdict.

## SKILL

Activate and follow these repo skills before evaluating (read each `SKILL.md`; mandatory):

- `.agents/skills/netscript-harness` — the PLAN-EVAL protocol and the Plan-Gate. Read
  `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md`. You are the hard
  gate before any Codex slice; the generator does not self-certify.
- `.agents/skills/netscript-deno-toolchain` — ground-truth the `deno dx` / JSR export mechanism and
  the `deno publish` surface. Use `deno doc` and the published-docs reasoning, not guesses.
- `.agents/skills/netscript-doctrine` — app-surface (CLI) archetype expectations + the public surface
  rules so the export change is judged against doctrine.
- `.agents/skills/jsr-audit` — JSR publish/exports rules (the new export must publish cleanly;
  slow-types are accepted per the publish decisions).

## Read

- `.llm/tmp/run/cli-dx-runnable/research.md` — decisive grounding: JSR has **no `bin` field**; `dx`
  runs an `import.meta.main`-guarded module **export** (`deno x jsr:@std/http/file-server`).
  `bin/netscript.ts` is published but NOT exported, so it is not a `dx` target today.
- `.llm/tmp/run/cli-dx-runnable/plan.md` — the plan under evaluation (locked decisions D1-D5, gates,
  two slices S1/S2, pipeline).
- `packages/cli/deno.json` — current `exports` (`.`/`./scaffolding`/`./testing`), `publish.include`
  (ships `bin/netscript.ts`), `publish.exclude` (maintainer entries).
- `packages/cli/mod.ts` and `packages/cli/bin/netscript.ts` — confirm `.`/`mod.ts` is the library
  (`createPublicCli`, no `import.meta.main`) and `bin/netscript.ts` is the executable entry.

## Evaluate against the Plan-Gate. In particular judge:

1. **Mechanism correctness (D1/D2).** Is the export-based `dx` mechanism correct for JSR (no `bin`
   field)? Is it sound to require the implementer to EMPIRICALLY verify the bare-vs-subpath
   resolution rule and arg-forwarding against an already-published reference package BEFORE locking
   the surfaced command form? Are Options A (runnable `.` default export) and B (named `./cli`
   export) both viable, and is the selection criterion (bare-specifier resolution works → A, else B)
   correct?
2. **Library purity (D3).** Does the plan adequately protect the existing library import
   (`import { createPublicCli } from "jsr:@netscript/cli"` and the `./scaffolding`/`./testing`
   consumers) from accidental CLI execution via the `import.meta.main` guard + a focused test?
3. **Sweep completeness (D4).** Is the repo-wide command sweep scoped to ALL user-facing
   `jsr:@netscript/cli/bin/netscript.ts` occurrences (grep-driven, not a whitelist), with a residual
   grep check, while correctly EXCLUDING maintainer local-source forms
   (`bin/netscript-dev.ts`, `deno task dev`)? Is the "verified-form-only" rule (do not surface a
   command that was not actually run) sufficient to prevent a false landing-page claim?
4. **Gate sufficiency (D5).** Given the CLI publishes LAST, is the pre-merge structural gate
   (`publish --dry-run` clean, local `deno run` of the export, empirical `dx` resolution-rule check,
   guard test) sufficient, with the true end-to-end `deno dx jsr:@netscript/cli …` smoke deferred to
   a post-publish close-out? Or must something move earlier?
5. **Scope discipline.** Confirm the slice excludes CLI behavior changes, new subcommands, and the
   publish workflow/order (#111). Is the two-commit slice plan (S1 export+test, S2 sweep) right-sized?
6. **Debt.** Is the fallback (Option B forces a longer `…/cli init` form → arch-debt note) correctly
   dispositioned?

## Output

Post a PR comment with: an explicit verdict (`PASS` or `FAIL_PLAN`), a per-point checklist (1-6
above) with pass/concern, and — if not PASS — the minimal concrete plan fixes required. Do not write
code or a `plan-eval.md` beyond the run-artifact directory. Two FAIL_PLAN cycles then escalate.


Issue/PR title: feat(cli): dx-runnable @netscript/cli + repo-wide command sweep

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
- Write /home/runner/work/_temp/openhands/28135291668-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28135291668-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-120/run-28135291668-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 120
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28135291668
