# Lane Policy — Canonical Model Routing

This document is the human-facing view of the owner-ratified 2026-09-04 delegation matrix. The
machine authority is `../../tools/agentic/runtime/delegation-matrix.ts`; the active resolver is
`../../tools/agentic/runtime/routing-policy.ts`. Earlier named lanes are persisted-state vocabulary
only and must not be selected for new work.

Model strings live only in `../../tools/agentic/config/models.ts`. Subscription limits live only in
`../../tools/agentic/config/subscriptions.ts`. Change those sources and their tests first; the
parity gate will identify stale prose here.

## Provider order

For each model candidate, select the first healthy, capable, allowance-proven transport in this
order:

1. Claude subscription through Claude CLI.
2. Codex subscription through Codex CLI.
3. Google subscription through `agy`.
4. Catalog-attested GitHub Copilot subscription through OpenCode CLI.
5. OpenCode Go subscription through OpenCode CLI.
6. Ollama subscription through OpenCode CLI.
7. OpenRouter through OpenCode CLI as the final fallback.

Provider precedence chooses a transport capable of serving the selected logical model. It does not
invent a different model fallback. Model fallbacks are the ordered entries in the workload table.
OpenRouter endpoints that permit paid-model training are eligible: participation is an explicit
owner preference, not a privacy blocker.

## Workload matrix

`primary → fallback` is left to right. `provider_default` means the provider's pinned default
variant; it is not permission to silently raise effort. An empty plan/evaluator cell means no plan
phase.

<!-- generated-workload-matrix:start -->

| Tier            | Implementation                                  | Plan                                        | PLAN-EVAL                                            | IMPL-EVAL                                                         | Vision                                                                  | Documentation                                                  | Deep research                      |
| --------------- | ----------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| simple          | luna@max → qwen_3_8_flash_next@provider_default | —                                           | —                                                    | minimax_m3@provider_default → deepseek_v4_flash@provider_default  | minimax_m3@provider_default → deepseek_v4_flash_vision@provider_default | gemini_3_8_flash@medium → opus_5@low                           | gemini_3_8_flash@low → luna@max    |
| straightforward | sol@medium → glm_5_3_flash@provider_default     | sol@medium → glm_5_3_flash@provider_default | opus_5@medium → qwen_3_8_flash_next@provider_default | glm_5_3_flash@provider_default → deepseek_v4_pro@provider_default | deepseek_v4_flash_vision@provider_default → kimi_k3@low                 | gemini_3_8_flash@high → qwen_3_8_flash_next@provider_default   | gemini_3_8_flash@medium → luna@max |
| feature         | astra@low → muse_spark_1_3@xhigh                | fable_5_1@low → muse_spark_1_3@xhigh        | glm_5_3@provider_default → fable_5_1@low             | muse_spark_1_3@xhigh → opus_5@xhigh                               | gemini_3_8_flash@high → muse_spark_1_3@xhigh                            | qwen_3_8_max@provider_default → glm_5_3_flash@provider_default | gemini_3_8_flash@high → luna@max   |
| complex         | astra@medium → fable_5_1@medium                 | fable_5_1@medium → muse_spark_1_3@max       | muse_spark_1_3@max → grok_4_6@high                   | muse_spark_1_3@max → muse_spark_1_3@max                           | kimi_k3@max → gemini_3_8_flash@high                                     | fable_5_1@medium → qwen_3_8_max@provider_default               | gemini_3_8_flash@high → luna@max   |
| architecture    | astra@xhigh → fable_5_1@xhigh                   | fable_5_1@xhigh → muse_spark_1_3@max        | muse_spark_1_3@max → grok_4_6@xhigh                  | grok_4_6@xhigh → muse_spark_1_3@max                               | kimi_k3@max → fable_5_1@high                                            | fable_5_1@high → qwen_3_8_max@provider_default                 | gemini_3_8_flash@high → luna@max   |

<!-- generated-workload-matrix:end -->

The typed catalog maps these logical identities to provider-specific slugs and vendor families.
Never infer a slug by string concatenation.

### Deep-research route

Deep research uses its dedicated matrix column, with Gemini 3.8 Flash at `low`, `medium`, or `high`
according to the lane's scope and surface coverage. Luna at `max` is the only model fallback.
Because deep-research sessions can accumulate unusually large context windows and outputs, this role
uses native Google `agy` first, catalog-attested GitHub Copilot Gemini second, and native Codex
Luna last. Copilot is allowed only for the `google` family in this role. Claude, OpenCode
Go, Ollama, and OpenRouter transports are forbidden for deep research even when they expose a model
with the same logical identity. The resolver and concrete-model guard both fail closed on that
boundary.

Selecting `complex` or `architecture` for deep research remains subject to the privileged-row
authorization below; the research role does not grant itself a higher tier.

### Privileged workload rows

`complex` and `architecture` are privileged, subscription-intensive rows. They may be selected only
when the owner explicitly requests that tier or a milestone coordinator explicitly authorizes it.
The dispatch record must name the authorizer and preserve a non-empty rationale. File count,
cross-package scope, a formal evaluator role, or an agent's own complexity inference is not
authorization. Without that record, selection fails closed at the resolver; ordinary work is capped
at `feature`.

## Coordinator matrix

<!-- generated-coordinator-matrix:start -->

| Scope         | Coordinator route                              |
| ------------- | ---------------------------------------------- |
| small_project | luna@max → opus_5@low                          |
| project       | sol@medium → opus_5@medium                     |
| framework     | astra@low → opus_5@xhigh                       |
| milestone     | astra@medium → fable_5_1@medium → opus_5@xhigh |

<!-- generated-coordinator-matrix:end -->

For the milestone coordinator, Opus is a fallback only when Fable alone is unavailable. A routine
transport failure selects the next capable transport for the current model before changing models.

## Evaluation policy

PLAN-EVAL is risk-selected. Use it for critical or complex architecture, public-contract,
multi-package, destructive, release/runtime, or unresolved design decisions. Routine mechanical work
records `PLAN-EVAL: N/A` with its concrete selection reason.

| Tier            | PLAN-EVAL loop                                             | IMPL-EVAL loop                     |
| --------------- | ---------------------------------------------------------- | ---------------------------------- |
| simple          | none                                                       | owner left the maximum unspecified |
| straightforward | no roundtrip; evaluator immediately repairs a fixable plan | max 5; notify owner after 3        |
| feature         | max 2; evaluator repairs a fixable plan on cycle 2         | max 5; notify owner after 3        |
| complex         | max 3; evaluator repairs a fixable plan on cycle 3         | max 5; notify owner after 3        |
| architecture    | max 1; a second failure is an owner decision               | max 3; notify owner after 2        |

Documentation uses the tier's IMPL-EVAL policy with a hard maximum of two rounds. A total plan
rejection or genuinely human-only choice escalates instead of being edited in place. Every iteration
re-steers the same evaluator session; do not discard its context by launching a new evaluator.

## Independence and session rules

1. The selected generator and evaluator must be different vendor families and separate sessions.
2. Evaluate the selected pair, not the cartesian product. If one evaluator candidate shares the
   selected generator's family, skip it and continue the declared evaluator fallback chain.
3. Matrix validation must prove every generator candidate has at least one legal evaluator.
4. No implementation lane self-certifies. Automated green gates are evidence, not review.
5. Every launch records requested and observed transport, provider, model, effort, session, branch,
   worktree, and exact head.
6. A missing legal evaluator is a recorded blocker, never permission for same-family review.
7. PLAN-EVAL and IMPL-EVAL follow their tier-specific loop policies above; no global two-failure
   rule may override those explicit limits.

## Paid-route expense and credentials

GitHub Copilot requires an exact live connector catalog attestation and a positive per-launch
AI-credit reservation against a local monthly ledger. Missing or malformed state and exhausted
included allowance block; a valid prior-month ledger rolls over at the UTC reset. Caps reserve
credits conservatively but are not a provider-enforced token ceiling or authoritative remaining
balance. Reconcile the ledger against GitHub billing; never assume overage is enabled.

OpenCode owns Copilot device OAuth. Launchers do not read its credential store or inject a Copilot
key and clear rival provider keys. Native Claude, Codex, and `agy` remain their family defaults;
attested non-native models prefer Copilot before Go/Ollama/OpenRouter.

OpenCode Go, Ollama, and OpenRouter launches require a positive estimated cost and proven current
usage before process spawn. Go usage is fetched directly from the authenticated subscription API on
every dispatch; a caller-provided Go snapshot is never trusted. Ollama and OpenRouter currently
consume fresh normalized snapshots. The expense guard returns structured JSON and fails closed when
usage cannot be fetched, is missing, stale, malformed, exhausted, provider-mismatched, or the Ollama
tier/concurrency is unresolved.

- OpenCode Go enforces live rolling five-hour, weekly, and monthly percentages plus the selected
  model's published effective allowance. The documented 12/30/60 USD windows are the $60 reference
  allocation; lower-inclusion models scale all three windows (for example, Grok's 15 USD allocation
  yields 3/7.5/15 USD effective limits). Non-`ok` status, 100% usage, unknown model weighting, or an
  unavailable usage endpoint blocks before spawn. It must never silently consume funded Zen balance.
- Ollama resolves Pro, Max, or Team explicitly, then enforces included monthly credits and
  concurrency. It must never guess a tier or silently consume extra balance.
- OpenRouter requires proven available balance and remains the final fallback.
- Allowance snapshots are operational state and must not be committed.

Provider keys live in mode-600 files under the user's NetScript agentic config directory. The
launcher loads only the selected provider key into the child and clears rival provider keys. Never
put credential values in argv, prompts, logs, receipts, run artifacts, or Git.

## Legacy boundary

Legacy lane names remain readable only to deserialize historical run state. New selection must
supply a workload tier and role. The resolver fails closed rather than heuristically mapping a
legacy lane into this matrix. Historical `.llm/runs/**` evidence is not rewritten.

## Selection and handoff

- Record tier, role, selected logical model, fallback reason, transport, provider, effort, and
  evaluation policy in `supervisor.md` and `drift.md`.
- Every implementation/evaluation brief starts with `use harness` and has a `## SKILL` section.
- When mobile supervision is required, prove native Claude Remote Control or Codex daemon
  attachment; a provider-gateway process is not Remote Control.
- Persisted run artifacts are committed cross-agent context. Their retention remains
  owner-controlled.
- #582 owns rollout/promotion canaries. This policy selects and validates routes but does not
  promote them.
