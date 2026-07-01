You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=600 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit

**IMPL-EVAL — independent evaluator session for the Wave 5 `@netscript/sdk` consolidation (run `feat-package-quality-wave5-apps--consolidation`, Phase B).** You are the INDEPENDENT evaluator — you did NOT write this code. Rule, with evidence, whether the committed implementation on branch `feat/package-quality-wave5-apps` meets the doctrine and production-grade bar. Evaluate against `.llm/harness/evaluator/protocol.md`, the doctrine under `.claude/skills/netscript-doctrine/`, and `.llm/harness/gates/archetype-gate-matrix.md`. Evaluation ONLY: zero edits to `packages/`, no implementation, no merging.

**WRITE-ARTIFACT-FIRST (mandatory — prior OpenHands runs on this PR hit the iteration cap and produced synthesized-after-limit summaries; do NOT repeat that): your FIRST action is to create `.llm/tmp/run/feat-package-quality-wave5-apps--consolidation/impl-eval-sdk.md` as a skeleton (one heading per Verify item + a `## Verdict` heading), then fill and re-save each ruling AS YOU GO. Budget reading so the artifact AND the `OPENHANDS_SUMMARY_PATH` summary are BOTH written and committed well before the cap. The summary's final line MUST be the verdict line.**

Scope: `packages/sdk` — Archetype 4 (DSL/Builder). Phase B collapsed 8 root barrel folders + `streams.ts` into `src/` as the single source root, keeping the 10 published subpath keys byte-stable (claimed zero consumer edits). The B1/B2 adapter/domain re-slice into canonical role folders was DEFERRED (KISS — see drift). `ports/` holds the RFC-14 `Transport` seam.

Verify (binary PASS/FAIL each, write each ruling into impl-eval-sdk.md as you go):

1. **Archetype 4 gates (run them, paste evidence).** From `packages/sdk`: `deno task check`, `deno task lint`, `deno task doc-lint`, `deno publish --dry-run`. Report each PASS/FAIL with output. Flag any required gate from the matrix omitted without N/A rationale.
2. **Single source root.** Every published subpath key in `deno.json` `exports` resolves to a file under `src/` (the keys: `.`, `./cache`, `./client`, `./collections`, `./discovery`, `./ports`, `./query`, `./query-client`, `./streams`, `./telemetry`). No dangling target. No package source lives outside `src/` except `mod.ts`. Barrel-collapse is complete (no leftover root barrel folders).
3. **Byte-stable public surface.** The subpath keys are unchanged vs pre-consolidation (the drift claims zero consumer edits were required). Confirm no key was renamed/removed and the surface was not weakened; spot-check that consumer imports elsewhere in the repo still resolve.
4. **Doctrine 05 structure.** `src/` top-level = `cache/ client/ collections/ discovery/ openapi/ ports/ presets/ query/ query-client/ telemetry/` + `streams.ts`. `ports/` + `presets/` are canonical; the feature folders (`cache`, `client`, `discovery`, `query`, `query-client`, `collections`, `telemetry`, `openapi`) are NOT canonical role names. Rule whether this is doctrine-acceptable or a finding — BUT note the B1/B2 adapter/domain re-slice is explicitly DEFERRED in `drift.md`; categorize it as accepted deferral, not a new blocker, IF the drift entry documents it. No forbidden names (`utils/ common/ helpers/ interfaces/ core/`); ≤12 children/dir, ≤4 depth.
5. **RFC-14 Transport seam.** `src/ports/transport.ts` + the service-client seam are designed so a future unified mode needs no breaking alpha change (protect-don't-implement). Confirm the seam types are public and coherent (`./ports`).
6. **Docs truth + completeness.** `README.md` names Archetype 4; `docs/architecture.md` is production-grade and accurate to the single-source-root layout and the deferred re-slice.
7. **Artifact reconciliation.** Reconcile the Phase B entry in `commits.md` (`5367093`) and the B1/B2-deferral drift entry against the committed tree — flag any claim not supported by the code.

Output: `impl-eval-sdk.md` committed to the run dir (binary PASS/FAIL per item + gate evidence). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to `packages/`, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [Wave 5] Package Quality — Apps Layer (sdk · service · fresh · fresh-ui) — 5a–5d ✅ MERGED · Structural Consolidation: A–D ✅ · E (close) IN PROGRESS

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
- Write /home/runner/work/_temp/openhands/27511443802-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27511443802-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-17/run-27511443802-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 17
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27511443802
