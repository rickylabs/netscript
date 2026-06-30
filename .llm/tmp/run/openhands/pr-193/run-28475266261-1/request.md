You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

PLAN-EVAL **cycle 2** (harness, separate session). This is a **planning-only** PR. Do NOT implement anything. The cycle-1 verdict was `FAIL_PLAN`; the supervisor reconciled all findings in commit `f8e6ea60` (`docs(plugin-rearch-v2): #184 FAIL_PLAN cycle-1 revision — 6 evaluator fixes`). Re-evaluate the revised `plan.md` and emit a fresh verdict: `PASS` or `FAIL_PLAN`.

## SKILL

Activate and apply these repo skills before evaluating:
- `.agents/skills/netscript-harness` — run the PLAN-EVAL protocol: read `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md`; emit `PASS` or `FAIL_PLAN`; you are a SEPARATE session and must not self-certify.
- `.agents/skills/netscript-doctrine` — archetype/axiom/layering/anti-pattern checks across `@netscript/plugin`, the 5 `-core` engines (ARCHETYPE-3), and the 5 connectors (ARCHETYPE-5). Verify layering (domain→ports→application→adapters→presentation), A4/A5/A8/A11, the 2-cast limit, no new `any`, folder vocabulary.
- `.agents/skills/jsr-audit` — confirm the planned public surface (new `@netscript/plugin/scaffold`; changed `@netscript/plugin/service`; trimmed `-core` role-named subpaths) is JSR-publishable (no slow types, explicit return types, `@module`/symbol docs planned).
- `.agents/skills/netscript-deno-toolchain` — use `deno doc` to ground-truth the live `@netscript/plugin` export surface.

## What to read

- `.llm/tmp/run/chore-plugin-rearch-v2--184/plan.md` (the REVISED plan — re-read in full; new sections: **Cast mechanism — Resolution B (LOCKED)**, **Open-decision 3 resolution**, **Risk register**, **JSR surface itemization**).
- `.llm/tmp/run/chore-plugin-rearch-v2--184/research.md` (BASE-TRUTH correction table, per-plugin confirmed smells, locked Q4-Q7).
- The cycle-1 `FAIL_PLAN` PR comment (your prior verdict) for the exact findings being closed.

## Cycle-2 reconciliation verification (close each cycle-1 finding)

Confirm each of the 6 cycle-1 findings is now actually resolved by the plan text (not merely gestured at). FAIL_PLAN if any is unresolved or introduces a new inconsistency:

1. **Open-decision sweep / #181 sequencing (was d.1).** Verify `S-conform-triggers` now carries an explicit HARD BLOCK until PR #192 (#181) merges to `main`, with a rebase-onto-main + `deno doc` route re-verify gate, AND that the plan explicitly states all OTHER slices proceed independently of #181. Confirm the 4 hot shared files are treated as fixed inputs read post-merge.
2. **Risk register (was: none explicit).** Verify a dedicated **Risk register** section exists with concrete risks (R1–R8), each with likelihood/impact and an owning slice/mitigation. Judge whether the register actually covers the program's real hazards (not filler).
3. **Cast mechanism (was e — plan self-contradiction).** Verify the plan now picks ONE resolution unambiguously: **Resolution B** (`definePlugin().build(): PluginManifest`; delete local `*PluginManifest`/`*Contribution` + cast; delete per-connector `inspect*` → core `inspectPlugin`; README/test repoint), with a per-connector no-dangling grep gate. Confirm the prior contradiction ("delete the interface" vs "keep it for narrowing") is gone, that Resolution B is isolatedDeclarations-safe, and that the only surviving sanctioned cast is the centralized-contract `as unknown as` in each `-core` contract. No new `any`.
4. **streams delete-set (was d.2).** Verify `S-conform-streams` now enumerates the exact delete-set with line refs (`StreamsPluginManifest` `src/public/mod.ts:67-76`; const collapse `137-142`; keep standalone `defineStream*` `144-147`; connector `mod.ts` type re-export) AND names the live consumers to repoint (`e2e/probes/probe-context.ts:2`, `tests/public/stream-api_test.ts:3-5`) with a `grep StreamsPluginManifest → 0` no-dangling gate. Independently confirm these line refs against the live base.
5. **JSR surface scan (was: no slow-type/@module itemization).** Verify the new **JSR surface itemization** section itemizes the net-new/changed surface (`./scaffold`, changed `./service` annotated router + `bindPluginContract`, `build(): PluginManifest`, `-core` subpath trim) against the jsr-audit rubric (explicit return types, no slow types, `@module`/symbol docs, clean file list). Judge sufficiency.
6. **Open-decision 3 — `runtime/`→`application/` vs `./runtime` subpath.** Verify the new resolution removes the ambiguity: internal orchestration folder renames to `application/` (internal-only, behind `.`); the retained PUBLIC `./runtime` subpath maps to the presentation runtime-launch binding (not the renamed folder), kept only where a real external consumer needs direct-start. Confirm this is layering-correct and consistent across the plan (no remaining line that contradicts it).

## Re-grade the original hard checks a–g

Re-confirm (briefly, only flag regressions): (a) base-truth corrected (alpha.16 `fc911ba1` already exports `./contract-base`/`./service`/`./adapter`/`./protocol`; only `./scaffold` net-new); (b) streams = proxy, NO `contracts/v1`, `serveRpc:false`, `capabilities.hasRoutes:false`; (c) Aspire base extension (`AspireNSPluginContribution`); (d) removal hazards (triggers backed routes VOID-remove; streams no dangling); (e) cast budget (above); (f) greenfield `S9 plugin new` built BEFORE conformance with its 5-gate bar, `./scaffold` AST/factory codegen not string templates, retires `.template` (Q5); (g) `e2e-cli-prod` = HARD release-acceptance gate, never "expected drift".

## Output

Post a PR comment verdict: `PASS` or `FAIL_PLAN` with specific, actionable findings keyed to slice IDs (S-core-1, S9, S-conform-*, S-verify), the 6 reconciliation items above, and checks a–g. Do not commit source. Preserve lock hygiene: do not commit `deno.lock` or any source churn.


Issue/PR title: Plugin RE-ARCHITECTURE v2 — unified thin surface + greenfield-first (#184, issue #191)

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
- Write /home/runner/work/_temp/openhands/28475266261-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28475266261-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-193/run-28475266261-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 193
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28475266261
