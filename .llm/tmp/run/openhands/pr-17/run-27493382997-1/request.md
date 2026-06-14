You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1000 use harness

Activate SKILL

netscript-harness
netscript-doctrine
jsr-audit
deno-fresh

This Wave need an additional PLAN pass that I want you to take care of:

Each sub wave did it's job separately, and supervisor did merge and verified every checks and test pass (including E2E CLI)

But this PR miss a critical final run which apply Netscript doctrine and lock a final production/entreprise grade package structure.

Currently previous agent solely focused on code quality and checks but none tool care of the final form now that we have healthy code we need to enforce doctrine patterns on them by restructuring the whole package to something like packages/plugin and other we refactored in previous waves.

Concretely you don't need overthinking it's about applying SOLID principles, having proper abstract class, adapters, clean public surface, base class that we extend, ...

Make sure to work incrementally first lockin the overall final folder structure document it early then dive into each DOMAIN and document after each that way of your reach your limit the next agent can easily follow up 

It's a PLAN only phase also previous implementation already did the job of code quality this is about code splitting, folder structure, applying doctrine principles.

Check other packages refactored in previous waves (1-4) (like plugin, queue, ...)

Also really important documentation quality is not production ready yet and really incomplete we also must address that 

In your summary write all topics you successfully addressed, if complete or where next agent should take over.

Issue/PR title: [Wave 5] Package Quality — Apps Layer (sdk · service · fresh · fresh-ui) — 5a ✅ 5b ✅ 5c ✅ MERGED · 5d IN PROGRESS

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
- Write /home/runner/work/_temp/openhands/27493382997-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27493382997-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-17/run-27493382997-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 17
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27493382997
