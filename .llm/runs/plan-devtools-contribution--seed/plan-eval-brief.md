use harness

You are the **formal PLAN-EVAL evaluator of record** for a planning-only NetScript seed run. You are
a **separate session from every lane that authored this plan**. Your verdict is the gate: no board
filing happens without it.

## SKILL

- `netscript-harness` — read it, then `.llm/harness/evaluator/plan-protocol.md` and
  `.llm/harness/gates/plan-gate.md`. Those two are your operating instructions and your checklist.
- `netscript-doctrine` — verify every archetype, layering, anti-pattern, and fitness-gate claim.
- `netscript-pr` — verify board/taxonomy/process claims.
- `netscript-tools`, `netscript-deno-toolchain` — canonical verification surfaces; `deno doc` before
  broad source reads.

## Your worktree and the immutable commit

- Worktree: `/home/codex/repos/ns-devtools-planeval` (yours alone — do not touch any other worktree)
- Commit under evaluation: **`b7cd6206762bc8f7a681526a993082c20e4cddfc`** (detached HEAD, already
  checked out). Evaluate **this** commit. If you believe it changed under you, stop and say so.
- Baseline the run claims: `main` @ `2256a67bf`.

## What to evaluate

| Artifact | What it is |
| --- | --- |
| `docs/architecture/rfc/rfc-0002-devtools-contribution.md` | The RFC (~3,600 lines, 15 sections) |
| `.llm/runs/plan-devtools-contribution--seed/plan.md` | Locked decisions, open-decision sweep, risk register, validation plan |
| `.llm/runs/plan-devtools-contribution--seed/research.md` | 26 cited findings + stage-C resolutions |
| `.llm/runs/plan-devtools-contribution--seed/drift.md` | **D-1…D-10.** Read this carefully — several entries correct the run's own earlier claims |
| `.llm/runs/plan-devtools-contribution--seed/worklog.md` | Slice plan, the stage-D verification log, gate results |
| `.llm/runs/plan-devtools-contribution--seed/adversarial-sonnet.md` + `adversarial-triage.md` | The stage-F review and its per-finding dispositions |
| `.llm/runs/plan-devtools-contribution--seed/design/**` | Eight design packs + the supersession map |
| `.llm/devtools-rfc-orchestrator-brief.md` | **The charter.** Judge the run against this |

## Hard rules for you

- **Read-only on source and GitHub.** Do not edit `packages/`, `plugins/`, `apps/`, or `docs/`.
  `gh` is READS only. Your only write is your verdict file.
- **Do not run commands that rewrite `deno.lock`.**
- **Verify, do not trust.** This plan makes many `path:line` claims. Spot-check aggressively,
  including the ones that sound convenient for the author. Report what you checked and what you
  found — including checks that passed, so the sample is visible.
- **Run the gates yourself.** Do not accept the run's reported gate results. At minimum:
  `deno task docs:links --root docs/architecture/rfc --pretty` and `deno task docs:accuracy`.

## Things this run wants you to attack specifically

Stated plainly so you spend effort where it is most likely to find something:

1. **The `plan-gate.md` rework bar.** The plan claims all twelve charter questions are closed and
   that no deferred decision forces rework. That claim is load-bearing — **test it**. In particular
   the #890-dependency fork (F-1) is claimed to be *reversible*; is it actually?
2. **Unproven claims.** The run labels several mitigations `UNPROVEN` and asserts no gate exists yet.
   Is that labelling honest and **complete**, or does a security/readiness claim survive somewhere
   unhedged?
3. **The drift entries that correct the run's own corpus** (D-6, D-7, D-8, D-9). Are the corrections
   right? D-7 in particular claims a **whole-filesystem** Deno permission grant — verify it.
4. **A charter-mandated deliverable is missing.** The GLM 5.2 design pass could not be launched
   (**D-10**). Judge whether the recorded escalation and the substitute scrutiny are an adequate
   response, or whether its absence should block PASS. Say which, and why.
5. **Internal consistency after the stage-F fixes.** §6/§7 were reconciled onto one identity model in
   the evaluated commit. Confirm the reconciliation is complete and that no third variant survives.

## Output

Write your verdict to `.llm/runs/plan-devtools-contribution--seed/plan-eval.md` in the **evaluator
worktree**, using `.llm/harness/templates/plan-eval.md`.

- Check **every** box in `gates/plan-gate.md` explicitly, with evidence per box.
- Emit exactly one verdict: **`PASS`** or **`FAIL_PLAN`**.
- On `FAIL_PLAN`, list the specific unchecked items and the required fix for each. Be concrete —
  vague findings cost a whole cycle.
- Put the machine-readable verdict line early in the file, on its own line:
  `PLAN-EVAL-VERDICT: PASS` or `PLAN-EVAL-VERDICT: FAIL_PLAN`.

Then commit your verdict file in your worktree and print the commit SHA.

When you are completely finished, the final non-empty line of your response must be exactly `DONE`,
or `BLOCKED: <reason>` if you cannot proceed.
