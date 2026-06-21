You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=400 use harness

Act as the **PLAN-EVAL evaluator** (separate session from the planner) for the NetScript prime-time
Track-2 slice **`service-auth-adapters`**. Read `.agents/skills/netscript-harness`,
`.llm/harness/evaluator/plan-protocol.md`, and `.llm/harness/gates/plan-gate.md`, then evaluate ONLY
this slice's plan.

Inputs (on this PR's branch `feat/framework-prime-time` @ `bd5b145c`):
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/research.md`
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/plan.md`
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/plan-meta.json`

Ground truth to verify the plan against:
- The MERGED auth seam `packages/service/src/auth/types.ts` (AuthenticatorPort, AuthnRequest with
  header()/headers()/cookie(), AuthnResult.setCookies/responseHeaders, Principal scheme/claims) — the
  plan claims Q3/Q4/Q5 are resolved against this; verify.
- Precedents: `packages/prisma-adapter-mysql/` (Archetype-2 package shape), `packages/queue` (port +
  factory + lazy adapter), the catalog law in `deno.json` + `.agents/skills/netscript-deno-toolchain`.

Evaluate: archetype/overlay fit (ARCHETYPE-2 x2 + ARCHETYPE-5 schema overlay for better-auth +
SCOPE-service); ports-stay-upstream (no @netscript/service surface change); the better-auth verify+storage
tier WRAPPING better-auth's native prismaAdapter (not a bespoke store); WorkOS verify-first with deferred
webhook sync; catalog correctness (better-auth ^1.6.20 + @workos-inc/node ^10.4.0 package-local only,
deps:latest authority); the explicit decision to EXCLUDE the e2e-cli-gate (no scaffold change); Deno 2.8
node-compat risk for the provider SDKs; and the proposed verify/storage rescope option.

Write the verdict to `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/plan-eval.md`
and commit it to this branch. Emit **PASS** or **FAIL_PLAN** with specific, actionable findings. Preserve
lock hygiene: do not commit deno.lock churn or source changes — this is a plan evaluation only.

Issue/PR title: Framework Prime-Time Hardening (umbrella)

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
- Write /home/runner/work/_temp/openhands/27860702043-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27860702043-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-73/run-27860702043-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 73
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27860702043
