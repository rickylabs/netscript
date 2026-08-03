use harness

# PLAN-EVAL — 0.0.5 milestone wave plan

You are the **PLAN-EVAL evaluator** for the NetScript 0.0.5 milestone run, on the `review_claude`
lane (Codex · GPT-5.6 Sol · xhigh — opposite-family review of a Claude-authored plan, owner-routed
2026-08-03). You are a separate session from the generator. You evaluate; you do not implement,
you do not fix the plan, you do not touch framework code.

## SKILL

- `.agents/skills/netscript-harness` — evaluator protocol, run artifacts.
- `.agents/skills/agent-milestone-orchestrator` — the role whose judgement the plan applies.
- `.llm/harness/workflow/milestone-run.md` — the run profile the plan must satisfy (stage B).
- `.llm/harness/workflow/canary-cadence.md` — the cadence contract the canary points must satisfy.

## Inputs (all in this worktree)

1. `.llm/runs/release-0.0.5--orchestration/plan.md` — the artifact under evaluation.
2. `.llm/runs/release-0.0.5--orchestration/supervisor.md` — run identity + decisions.
3. `.llm/tmp/BRIEF-0.0.5.md` — the owner brief (constraints §3–§4 are binding on the plan).
4. The three system docs named in ## SKILL above.
5. GitHub ground truth: `gh issue list --repo rickylabs/netscript --milestone 0.0.5 --state open`
   and `gh issue view <n> --repo rickylabs/netscript` for any issue whose clustering you doubt.
   **Read-only** — every `gh` call carries `--repo rickylabs/netscript`; no mutations.

## Evaluate (verdict per dimension: PASS / FAIL / PASS-WITH-FINDINGS)

1. **Coverage** — do the 23 PR clusters + 3 observational + 3 epic/tracking + 1 gated-out account
   for every open milestone issue, with no issue silently dropped or double-assigned?
2. **Cluster integrity** — does each cluster share surface and acceptance? Apply the skill's three
   checks (too big / mislabelled / unimplementable-as-scoped). Attack especially: #1108+#1110,
   #1173+#1085, #1166+#1004+#1148, #1168+#1024, and the OMB pairing #1130+#1131.
3. **Sequencing** — does the wave order respect the RFC #1123 gating graph (S1→S5/S7, S2→S4/S6,
   S8-blocks-S10 "under any sequencing pressure") and epic #1169's own slice structure? Are
   any two intra-wave PRs secretly dependent?
4. **Canary placement** — do the four declared points satisfy canary-cadence.md (content-derived
   membership, boundary = wave boundary, label identity D3), and is the owner's density decision
   (3-4) honored without breaking the netscript-release green-pair precondition for the cut?
5. **Honesty exposure** — where could this plan tick a criterion untruthfully? Check the
   observational-criteria routing (#1149/#1090/#1140, #1117 box 6, #1102 final box) and the
   #1139 exclusion.
6. **Gate compliance** — does the plan violate any [observed] rule in the three system docs or
   the brief's §3 orchestration rules? Cite the rule verbatim when you flag one.

## Output

Write `.llm/runs/release-0.0.5--orchestration/plan-eval.md` in THIS worktree: per-dimension
verdict + findings (each finding: severity blocker/major/minor, the claim, the evidence, the
smallest change that would resolve it). End with a single overall verdict line:
`PLAN-EVAL: PASS` or `PLAN-EVAL: FAIL`. Commit that one file on the current branch
(`eval/0.0.5-wave-plan`) with message `eval(harness): PLAN-EVAL verdict for the 0.0.5 wave plan`.
Do not modify any other file. Then stop.
