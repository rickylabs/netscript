**[PHASE: REVIEW] [VERDICT: PASS]**

Advisory ordinary adversarial S1 REVIEW for issue #1338 / draft PR #1339.

**Not** PLAN-EVAL. **Not** IMPL-EVAL. Not a formal evaluator verdict.

### Route identity
| | |
|---|---|
| **Requested** | OpenRouter Grok 4.5 · medium (owner-authorized temporary REVIEW; Claude plan exhausted) |
| **Observed** | OpenRouter · `x-ai/grok-4.5` · medium (D-7 advisory REVIEW drift) |
| **Role** | Independent ordinary adversarial reviewer (fresh session) |

### Exact heads reviewed
| Surface | SHA |
|---|---|
| **Local HEAD** | `f2bc222667b369b1749248a7b74befa2e08e9da8` (`review/deepseek-v4-formal-impl-evaluator-1338-s1`, clean) |
| **Remote PR branch** `origin/chore/deepseek-v4-formal-impl-evaluator-1338` | `f2bc222667b369b1749248a7b74befa2e08e9da8` |
| **PR #1339 `headRefOid`** | `f2bc222667b369b1749248a7b74befa2e08e9da8` |
| **Base** `canary/0.0.5-canary.14` | `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` |
| **S1 impl commit** | `22d7d980f22ed3b30500c897de1c71947a97a0de` |

Triple identity matches. Review target is clean PR head vs base.

### Scope under review (S1 typed source/test)
Against base `2508eb8c…`, product surface is exactly six agentic files from `22d7d980f`:

1. `.llm/tools/agentic/config/models.ts`
2. `.llm/tools/agentic/runtime/provider-profiles.ts`
3. `.llm/tools/agentic/runtime/provider-profiles_test.ts`
4. `.llm/tools/agentic/runtime/routing-policy.ts`
5. `.llm/tools/agentic/runtime/routing-policy_test.ts`
6. `.llm/tools/agentic/runtime/cli/routing-state_test.ts`

Remainder is run-dir harness prose under `.llm/runs/chore-deepseek-v4-formal-impl-evaluator--1338/**` only.

**No** `packages/`, `plugins/`, release/publication surface, historical `#1331` evidence path, or `deno.lock`.

---

### Criteria verdicts

#### (1) Formal PLAN-EVAL remains Minimax M3 high — **PASS**
- `FORMAL_PLAN_EVALUATOR_PRESET = OPENROUTER_PRESETS['claude-evaluator-minimax-m3']` (`routing-policy.ts`)
- Preset: model `minimax/minimax-m3`, effort `high`, profile `claude-openrouter`, purpose `evaluation`
- Lane `formal_plan_evaluation` binds preset id/model/effort from that constant
- PLAN-EVAL artifact already recorded PASS at planning head via Minimax high (prior run)

#### (2) Formal IMPL-EVAL resolves DeepSeek V4 Flash 0731 max through `claude-openrouter` — **PASS**
- `FORMAL_IMPL_EVALUATOR_PRESET = OPENROUTER_PRESETS['claude-evaluator-deepseek-v4-flash-0731']`
- Preset: model `deepseek/deepseek-v4-flash-0731`, effort `max`, profileId `claude-openrouter`, transport `anthropic-messages`, agenticTurn `supported`, reasoningTrace `present`
- Lane `formal_impl_evaluation` binds that preset
- `resolveCanonicalFormalEvaluatorRoute` selects expected preset by phase (`plan` → Minimax, else DeepSeek) and rejects non-canonical phase routes
- Test: `formal evaluator resolves Minimax high PLAN and DeepSeek max IMPL routes` — green

#### (3) Qwen 3.8 absent from active formal allowlists/presets; retained only as centralized generic literal or explicit negative fixture — **PASS**
Active formal surface:
- `OPEN_EVALUATOR_MODEL_IDS` = `[minimax, deepseekV4Flash0731]` only
- `OPENROUTER_PRESET_MODELS` / `OPENROUTER_PRESET_IDS` — no Qwen
- No `claude-evaluator-qwen*` preset

Residue (allowed):
- `OPENROUTER_MODEL_IDS.qwen = 'qwen/qwen3.8-max'` centralized id only (`models.ts:52`)
- Negative fixtures: preset mismatch with Qwen model (`provider-profiles_test.ts:147`); stale `qwen3.7-max` and retired well-formed `OPENROUTER_MODEL_IDS.qwen` rejection (`routing-policy_test.ts`)

#### (4) Stale / cross-phase / well-formed retired-Qwen inputs fail closed — **PASS**
Green fail-closed coverage:
- `formal IMPL evaluator rejects the stale Qwen 3.7 model`
- `formal IMPL evaluator rejects the retired well-formed Qwen 3.8 route`
- `formal evaluator rejects cross-phase presets`
- `formal evaluator rejects closed models and reused generator sessions`
- open-only allowlist check via `OPEN_EVALUATOR_MODEL_IDS`
- session-independence: generator sessionId ≠ evaluator sessionId

#### (5) Typed config / preset / policy / tests agree; open-only and session-independence guards not weakened — **PASS**
- Single source model ids in `config/models.ts`; presets reference them; policy binds presets; tests lock slug/model/effort triples
- `resolveCanonicalFormalEvaluatorRoute` still enforces: purpose `evaluation`, agent `claude`, provider `openrouter`, profile `claude-openrouter`, `evaluatorModelPolicy: open_only`, phase lane match, expected preset id+model, open allowlist membership, evaluation preset with supported agentic turn + present reasoning trace, distinct sessions
- No guard deletion or soft-fail path introduced

#### (6) No package/plugin, release/publication, historical #1331, or `deno.lock` scope leak — **PASS**
- Diff vs base is run-dir + six agentic files only
- Lock HEAD blob and worktree blob both `ef28b1b056705b456a66601ceeb46eede9def7b0` at review close
- Working tree clean after validation restore

---

### Prioritized findings
**Blocking:** none.

**Non-blocking / residual (informational only):**
1. **N1 — Docs/skills lag is out of S1 by design.** Harness prose and skill text may still name retired Qwen IMPL wording until S3 residue ledger. Typed runtime is authoritative for launch; S3 owns doc/skill cleanup. Not an S1 defect.
2. **N2 — Reviewer-local lock hygiene note (not in PR).** An intermediate scoped-check invocation briefly mutated the worktree lock to `e66d0339…` despite `--no-lock` on the child; lock was restored to `ef28b1b…` before close. PR head never carried lock churn. Operators should keep using `--deno-arg --no-lock` and verify blob identity after any local check.

---

### Validation evidence (this session, lockless)
| Gate | Result |
|---|---|
| `deno test --no-lock` on provider-profiles + routing-policy + routing-state tests | **42 passed / 0 failed** |
| Scoped `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx --deno-arg --no-lock` | **149 files, 0 errors** |
| Formal binding tests of interest | Minimax PLAN high + DeepSeek IMPL max resolve; closed/cross-phase/session/Qwen-stale/Qwen-retired reject — all ok |

### Lock observation
- `HEAD:deno.lock` = `ef28b1b056705b456a66601ceeb46eede9def7b0`
- worktree `deno.lock` = `ef28b1b056705b456a66601ceeb46eede9def7b0`
- `git status` clean at review emission

### Next action
1. **Supervisor:** ordinary-review sign-off on S1 at `f2bc222…` / impl `22d7d980f…` (this advisory PASS is input, not self-certification).
2. **Orchestrator:** proceed to **S2 live canary** under the approved plan — do **not** start formal IMPL-EVAL until S2 (and plan-gated later slices) complete.
3. Do **not** treat this comment/output as formal IMPL-EVAL; do not flip `status:ready-merge` on this advisory alone.
4. No GitHub comment, label change, push, or further agent launch performed by this reviewer (per brief).
