You are the independent PLAN-EVAL reviewer for issue #1367. Read-only, blockers only. Never edit
files, git state, network state, or launch/delegate agents. Do not read profiles/ files. Read
.llm/runs/orch-divybot-6542543055--1367/{supervisor,research,plan,worklog,context-pack,drift}.md,
relevant Aspire config/contribution/generator code and existing storage tests. Evaluate whether the
plan meets explicit opt-in AppHost directory provisioning, ephemeral default, real generated-project
Aspire restart proof, negative controls and no local full scaffold.runtime. Identify only concrete
blockers with precise remedies; if none, say no blockers. End with VERDICT: PASS or VERDICT: FAIL_PLAN.

ROUND 2: Review the amended plan against your round-1 blocker. Fixture gate clones pristine streams
as an ephemeral control, opts original streams into DataDirectories, then regenerates before the
single AppHost start. Behavior gate checks both health modes and real producer history across exact
streams restart. Named CI runtime gates and focused local/revert controls are now locked. Confirm
PASS if this resolves your blocker. Remain read-only.

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools and netscript-pr.
The supplied leaf profile is authoritative; never read profiles/.
