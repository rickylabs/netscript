# S3 Tier-A Adversarial Review — #1331

**Model/transport:** OpenRouter `x-ai/grok-4.5` (owner-authorized ordinary review; not IMPL-EVAL)

**Scope:** read-only audit of S3 uncommitted diff + residue outside `.llm/runs/**`

## Initial verdict

**FAIL** — one medium finding. Canonical harness/skill/agentic surfaces converged correctly, but the
exception ledger was incomplete.

## Finding and disposition

### Medium — unexplained active Qwen 3.7 residue; ledger incomplete

`docs/site/_plan/briefs/00-INDEX.md:20` still prescribed “Stage 5 IMPL-EVAL, Minimax-M3; Stage 7
final, Qwen-3.7-max.” The reviewer correctly classified this as present-tense routing rather than a
captured log, debt attribution, or rejection fixture. It also assigned the wrong phase model. The
initial search omitted the hyphenated prose variant, so the initial ledger claimed seven hits across
five paths while the widened pattern found eight across six.

The line was migrated to the canonical phase defaults: PLAN-EVAL uses Minimax M3 and IMPL-EVAL uses
Qwen 3.8 Max. The residue audit was widened to include space- and hyphen-separated variants before
re-review.

## Checks that passed in the initial review

- Executable routes resolve PLAN to Minimax and IMPL to Qwen 3.8 with their exact lanes/presets.
- Canonical harness/evaluator/skill/agentic prose matches the executable routes.
- Generated Claude skill mirrors are byte-identical to canonical `.agents/skills` sources.
- S3 did not modify production config/model files or package/plugin source.
- The consumer dogfood surface has no evaluator/Qwen binding; unrelated churn was excluded and
  recorded.
- The retired `formal_evaluation` lane and old `qwen-3-7` preset slug are absent outside run
  history.
- The other seven retained 3.7 occurrences across five paths have explicit rejection or historical
  rationales.
- `deno.lock` remains pre-existing, dirty, and unstaged.

## Re-review

**Verdict: PASS**

**Model/transport:** OpenRouter `x-ai/grok-4.5` (owner-authorized ordinary re-review; not
IMPL-EVAL).

The reviewer confirmed the prior finding is closed:
`docs/site/_plan/briefs/00-INDEX.md:20-21` now states PLAN-EVAL → Minimax M3 and IMPL-EVAL → Qwen
3.8 Max. Its independent tracked-file audit, excluding `.llm/runs/**` and `.llm/tmp/**`, found
exactly **7 occurrences across 5 paths**:

| Path | Occurrences | Rationale |
| ---- | ----------- | --------- |
| `routing-policy_test.ts` | 2 | stale-route negative fixture |
| `extract-verdict.ts` | 1 | historical empty-result attribution |
| `validation.md` | 1 | historical lesson attribution |
| `arch-debt.md` | 2 | immutable evaluator-run attributions |
| `codex-launch-s1.head.log` | 1 | captured historical launcher log |

No active Qwen 3.7, `qwen-3-7` preset, or `formal_evaluation` binding remains. Canonical surfaces
and Claude mirrors converge on Minimax M3 / Qwen 3.8 Max; `deno.lock` is dirty and unstaged. The
exception ledger is complete, with no new substantive issue.
