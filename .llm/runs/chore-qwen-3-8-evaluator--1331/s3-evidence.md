# S3 Documentation, Generation, and Residue Evidence

## Canonical convergence

- `AGENTS.md`, evaluator protocols, lane policy, canonical harness/OpenHands skills, the site-plan
  dispatch index, and the agentic README now state PLAN-EVAL → `minimax/minimax-m3` and IMPL-EVAL →
  `qwen/qwen3.8-max`.
- The lane-policy rendered rows use the exact machine lane and preset ids:
  `formal_plan_evaluation` / `claude-evaluator-minimax-m3` and
  `formal_impl_evaluation` / `claude-evaluator-qwen-3-8-max`.
- `deno task agentic:sync-claude` regenerated the two changed `.claude/skills/**` mirrors from
  `.agents/skills/**`; check mode and the Claude surface validator both pass.
- `deno task agentic:dogfood-skills` completed. The tracked consumer bundle contains no Qwen or
  formal-evaluator binding. The command also refreshed unrelated worktree/version-specific consumer
  output; that unrelated generated churn was excluded from this slice.

## Gates

- `deno task agentic:sync-claude:check`: PASS, 18 skills / 22 mirrored files.
- `deno task agentic:check-claude`: PASS, including three lock-hook probes.
- `deno task docs:maintenance`: PASS; 102 docs, zero broken links/anchors, docs accuracy PASS, and
  generated-surface checks PASS.
- Full `.llm/tools/agentic/` test suite: 417 passed, 0 failed.
- Scoped agentic check/lint/fmt wrappers: 149 files; zero failed batches or findings.
- Static provider canary: PASS; all six registered presets observed and launch-valid.
- `git diff --check`: PASS.
- Package/plugin quality gate: N/A; no `packages/**` or `plugins/**` source was touched.

The bounded exact-model live canaries remain the S2 evidence: Minimax PLAN and Qwen 3.8 IMPL both
passed with their exact evaluator preset/model/effort identities.

## Exact Qwen 3.7 residue audit and exception ledger

An exact case-insensitive audit outside this run directory for `qwen/qwen3.7-max`, space- and
hyphen-separated Qwen 3.7 prose, the `qwen-3-7` preset slug, and the retired `formal_evaluation`
lane leaves seven occurrences across five tracked paths. None is an active binding. The widened
audit found and migrated one active `Qwen-3.7-max` site-plan reference before re-review:

| Path | Occurrences | Retention rationale |
| ---- | ----------- | ------------------- |
| `.llm/tools/agentic/runtime/routing-policy_test.ts` | 2 | Explicit negative migration fixture: supplies the stale id and asserts formal IMPL-EVAL rejection. |
| `.llm/tools/harness/extract-verdict.ts` | 1 | Historical observation identifying the model/transport combination that returned an empty terminal result; changing the attribution would falsify the incident record. |
| `.llm/harness/lessons/validation.md` | 1 | Historical lesson attribution for that same observed empty-result behavior. |
| `.llm/harness/debt/arch-debt.md` | 2 | Immutable evaluator-run attributions naming the actual 3.7 runs that accepted two debt entries. |
| `.llm/tools/agentic/lib/__fixtures__/codex-launch-s1.head.log` | 1 | Captured historical launcher log whose embedded prompt records the evaluator model used by that past run. |

The current run directory also contains baseline research, the owner migration request, formal
PLAN-EVAL transcript/verdict, and review evidence that intentionally quote the stale id or retired
lane as migration/rejection evidence. Those immutable or explanatory run artifacts do not define an
active route. No unexplained active Qwen 3.7 or phase-agnostic formal-evaluator reference remains.

## Lock hygiene

The pre-existing `deno.lock` modification remains unrelated and unstaged. No package, plugin,
dependency, release, merge, or publish action was taken.
