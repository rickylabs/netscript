# Supervisor — NetScript 0.0.6 fixes lane (release + CLI/E2E truth)

| Field            | Value                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Run id           | `release-0.0.6-fixes--orchestration`                                        |
| Profile          | `.llm/harness/workflow/milestone-run.md` (topical sub-lane, not the cut)    |
| Role skill       | `agent-milestone-orchestrator`                                              |
| Supervisor model | Claude · Anthropic · Opus 5 · high (`planning_decisions`, canonical route)  |
| Permission mode  | bypass / danger-full-access (owner-authorized)                              |
| Host             | WSL2 `YogaBook9i`, `/home/codex/repos/netscript-006-fixes`                  |
| Branch           | `chore/release-0.0.6-fixes-orchestration` (control branch — evidence only)  |
| Baseline         | `origin/main@01aa12b67e36b643e1ca4f94421ecba07e030db5`                      |
| Milestone        | GitHub milestone 26, `0.0.6` (16 open / 24 closed at bootstrap)             |
| Opened           | 2026-08-12                                                                  |

## Scope — exclusive ownership

This is a **topical lane inside** milestone 0.0.6, not the milestone orchestrator. Sibling lanes
(docs / features / internals) run in their own worktrees. This lane owns exactly six issues and
absorbs nothing else:

| Group             | Issues                | Priority                     |
| ----------------- | --------------------- | ---------------------------- |
| Release blockers  | #1438, #1417, #1430   | p1, p1, p2                   |
| CLI/E2E truth     | #1397, #1399, #1428   | p2, p2, p2                   |

Ordering constraint from the owner brief: **#1397 precedes #1399**; #1428 is independent.
PR #1522 is explicitly out of scope and has been removed from the milestone.

**Not owned by this lane:** canary cadence and the stable cut. Root holds both. This lane proves
release fixes with canonical release tests/dry-runs and **never publishes locally or by hand**.

## Lane bindings

Routed from `.llm/harness/workflow/lane-policy.md`; no routing table is invented here.

| Purpose                                    | Lane                          | Route                                    |
| ------------------------------------------ | ----------------------------- | ---------------------------------------- |
| Orchestration (this session)               | `planning_decisions`          | Claude · Opus 5 · high                   |
| Implementation — default                   | `light_implementation`        | Codex · GPT-5.6 Sol · low                |
| Implementation — decision/research mid-slice| `normal_implementation`       | Codex · GPT-5.6 Sol · medium             |
| Implementation — genuinely complex          | `complex_implementation`      | Codex · GPT-5.6 Sol · high               |
| Review of Sol·low work                     | `review_codex_light`          | Claude · Opus 5 · high                   |
| Review of Sol·medium work                  | `review_codex`                | Claude · Fable 5 · low                   |
| IMPL-EVAL (Codex-authored)                 | `formal_impl_evaluation`      | Claude · Fable 5 · medium (native opposite-family) |
| Deep analysis when delegated               | `deep_analysis`               | Claude · Fable 5 · medium                |

**Escalation only when justified, recorded per use:** MiniMax M3 high (PLAN-EVAL third opinion),
DeepSeek V4 Flash 0731 max (small IMPL-EVAL third opinion), Qwen 3.8 Max (broad/complex IMPL-EVAL).
The OpenHands transport for those is **not available**: #1524 (`fix(agentic): fail closed on open
evaluators`) is an open **draft** PR at bootstrap. Until it passes and lands, escalation runs as a
fresh local Claude/OpenCode OpenRouter session with the NetScript toolchain. Generator and evaluator
are always separate sessions.

## PLAN-EVAL decision

**Wave plan: PLAN-EVAL N/A.** Recorded under the owner decision of 2026-08-08 (`lane-policy.md`)
and the owner brief for this lane ("Skip PLAN-EVAL for specified mechanical fixes; record why").

Reasoning, stated so it can be attacked rather than assumed:

- All six issues arrive **already specified** — each names the defective symbol/line, the observed
  wrong behaviour, and the intended correction. Three carry explicit acceptance boxes (#1417,
  #1397, #1399); the other three carry a named fix in prose (#1438, #1430, #1428).
- The wave plan below has no architectural degree of freedom: the clustering follows shared file
  surface, and the only sequencing constraint (#1397 → #1399) is given by the owner.
- The one genuine design choice in the set — how #1438 derives its allowed path set — is delegated
  as a **decision-bearing slice** (Sol · medium) and is covered by a focused IMPL-EVAL, which is
  where the adversarial value actually lands for a fix of this shape.

Per-slice PLAN-EVAL is `N/A` for the same reason and is restated in each slice's brief.

## IMPL-EVAL decisions

IMPL-EVAL is mandatory unless the owner waives it.

| PR | IMPL-EVAL | Rationale |
| --- | --- | --- |
| A (#1438 + #1430) | **Required, focused, separate session** | #1438 guards **release identity** — it decides whether a stable publish may inherit canary evidence. Owner brief names it explicitly. |
| B (#1417)         | **Required, focused, separate session** | #1417 guards **working-tree integrity** — a silent `catalog:` expansion is invisible in review. Owner brief names it explicitly. |
| C (#1397 + #1399) | Owner waiver candidate                  | Small deterministic E2E guard fixes. Waiver applies **only** on strong negative tests (a demonstrated red before the fix, green after). Decision recorded in `drift.md` at landing time, never silently. |
| D (#1428)         | Owner waiver candidate                  | As above. |

The waiver for C/D is the owner's, granted in the lane brief; this run applies it conditionally and
records the negative-test evidence that earns it. If the negative test is weak or absent, the
waiver does not apply and a Fable 5 · medium IMPL-EVAL runs.

## Branch and PR discipline

- Product fixes land on **fresh leaf branches off `origin/main`**, in fresh worktrees, as **draft
  PRs directly against `main`**. One PR per connected group.
- The control branch `chore/release-0.0.6-fixes-orchestration` carries **run artifacts only**.
  No product fix is ever aggregated onto it.
- Every PR body carries a closing keyword for each issue it fully resolves (`AGENTS.md`
  obligation 1) and the namespaced label taxonomy plus milestone `0.0.6` (obligation 2).

## Gate posture

- Expensive scaffold/runtime gates are **serialised across slices** — never two concurrent
  `scaffold.runtime` runs (0.0.4 produced two contention failures that were not defects).
- Release fixes are proven with the canonical release tests and dry-runs. **No local publish, no
  hand-run publication**, in any slice.
- Lock hygiene: `deno.lock` is not committed unless the change genuinely requires it, and never as
  incidental churn. #1417's own acceptance asserts `deno.lock` stays unmodified.
