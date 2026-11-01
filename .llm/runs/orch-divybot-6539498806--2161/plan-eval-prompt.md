use harness

## SKILL
netscript-harness, netscript-doctrine, netscript-tools, netscript-pr.

Act as the independent PLAN-EVAL and bootstrap slice reviewer for #2161, feature tier. Read-only; do not edit files, invoke mutating commands, post comments, start resources, or delegate. Do not read any profiles/ file. Read .llm/runs/orch-divybot-6539498806--2161/{supervisor,research,plan,worklog,drift}.md and the focused source needed to check it. The owner's exact evaluator override is in worklog. Evaluate blockers only: acceptance, static selection correctness, doctor exclusion evidence, backwards compatibility, scope #2162, meaningful proof, doctrine/JSR plan. Existing inherited problems outside this diff are not new blockers. Do not run local scaffold.runtime; coordinator owns that CI gate. Need PASS or FAIL_PLAN, concrete blocking findings only. If PASS, explicitly sign off bootstrap slice for commit. No private operational details in the response. End VERDICT: PASS or VERDICT: FAIL_PLAN.
