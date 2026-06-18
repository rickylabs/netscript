You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=100 use harness

ROLE: **Adversarial PLAN-EVAL — cycle 2 (re-eval after gap closure)** for the NetScript docs content-architecture rebuild (PR #59, branch `docs/content-architecture`, tip `0e049f7a`). You are the separate evaluator session. Your cycle-1 verdict was **`PLAN-EVAL: FAIL_PLAN`** with three blocking gaps (B1 watchers coverage, B2 accuracy-guardrail teeth, B3 Phase-0 overload) + engine caveats + a Nitro/Aspire accuracy nit. The supervisor has committed a revision (`0e049f7a`) claiming to close all three. **Your job: verify the closures are real and sufficient, then PASS or FAIL_PLAN.** This is the FINAL allowed cycle — a second FAIL escalates to the user.

⚠️ ITERATION BUDGET — be economical, verdict-first. Do NOT re-run the full cycle-1 adversarial pass. Focus on the deltas. Do NOT re-read all 15 research files. Cap `deno doc` to ≤3 spot-checks (only to confirm the B1 watchers public surface, e.g. `@netscript/watchers`). Front-load the VERDICT line; if low on iterations, write the verdict comment immediately.

READ (deltas only):
- `docs/site/_plan/09-research-integration.md` **§8 + §8a** (the supervisor's resolution trail) and **§2b** (adapter correction) and **§3** (engine adjudication caveats).
- `docs/site/_plan/briefs/00-INDEX.md` — Global Acceptance Bar (#1 gate, #2 code-proof, #8 Aspire), the Phase-0a/0b split, Phase-3 hub list (watchers), the brief-template WORKLOG line.
- `docs/site/_plan/05-build-migration-plan.md` — Phase 0a/0b split + acceptance lines.
- Your own cycle-1 verdict: `.llm/tmp/run/docs-content-architecture--planeval/plan-eval.md`.

VERIFY EACH CLOSURE (PASS only if all three are genuinely closed):
1. **B1 (watchers)** — Is there now a real, reachable, intent-named home for `@netscript/watchers` (a 10th hub or a labelled cluster card), with the "internal/dev-tooling" framing removed and §2a marked binding? Spot-check `deno doc @netscript/watchers` confirms the public surface justifies a hub. CLOSED or NOT.
2. **B2 (accuracy gate)** — Is the guardrail now enforceable, not policy? Confirm the two-tier gate is concretely specified (target `api-cite.ts` behavior + wiring; mandatory per-page worklog floor with exact `deno doc` command + sha) AND the ≥1-runnable-proof-per-hub-page bar is in the Global Acceptance Bar AND the brief template carries the WORKLOG line. Is this enough to enforce accuracy per page? CLOSED or NOT. (Note: the gate SCRIPT itself is a Phase-0b implementation slice — the plan need only specify it concretely + mandate the worklog floor from page 1.)
3. **B3 (Phase 0 split)** — Is Phase 0 split into 0a (chrome-only, shippable, with a merge-gate acceptance) and 0b (engine config, does not block prose) in BOTH `00-INDEX.md` and `05`, with Phase-1 prose able to ship against 0a? CLOSED or NOT.

ALSO CONFIRM (were cycle-1 caveats/nits applied?):
- D-E1 `nav.ts` Reference-sub-tree-only (never global); D-E2 Shiki Phase-0b compat acceptance line; D-E4 sitemap base_path acceptance — all present in `09 §3` + `05`/`00-INDEX` 0b.
- §2b adapter lists corrected (Nitro NOT an adapter; queue = Deno KV + Redis + RabbitMQ; KV = deno-kv + redis + memory).
- R5 Aspire framing precision present (TypeScript AppHost inspection, not .NET orchestrator).
- Re-walk the Plan-Gate checklist items you marked PARTIAL in cycle-1 (open-decision sweep → now resolved by watchers hub? gate-set mapping → now docs-content-gate?).

OUTPUT — structured verdict comment:
- **VERDICT line FIRST**: `PLAN-EVAL: PASS` (all three gaps closed, plan implementation-ready, gate satisfied — authoring dispatch may begin) or `PLAN-EVAL: FAIL_PLAN` (exact remaining blocker(s); NOTE this triggers user escalation as the 2nd failure).
- Per-gap closure table (B1/B2/B3 + caveats/nits): CLOSED / NOT-CLOSED + one-line evidence (cite the file + section).
- Plan-Gate checklist: the previously-PARTIAL items re-marked.
- Update `.llm/tmp/run/docs-content-architecture--planeval/plan-eval.md` with the cycle-2 result and commit it.

HARD CONSTRAINTS:
- **Docs/planning lane ONLY.** Do NOT edit `packages/`, `plugins/`, version pins, `scaffold-versions.ts`, `aspire/src/public/mod.ts`, the catalog, or lock files. Do NOT run `deno cache --reload`. Any further refinements limited to `docs/site/_plan/**`.
- **Do NOT merge** this PR. **Do NOT publish** anything.
- Respect LOCKED `08` decisions.

Report the workflow run's exit status and a one-line summary: PASS/FAIL + the single most important remaining concern (if any).


Issue/PR title: docs: content-architecture rebuild (Track B)

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
- Write /home/runner/work/_temp/openhands/27796309598-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27796309598-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27796309598-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27796309598
