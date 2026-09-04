# Research — chore-revamp-agent-model-routing--model-matrix

## Re-baseline

- Owner input: `/home/agent/tmp/Harness Agents models matrix.md`, read in full before repository
  inspection as explicitly required.
- Baseline: `origin/main` @ `a2d7f5f6f686115b5c31bab085692df6e1582aa7` on 2026-09-04.
- Scope: internal harness and agentic runtime only; no published package/plugin API changes.
- The owner confirmed `gpt-6-astra` and the two new subscription credentials are target-available.

## Owner-ratified matrix

| Workload tier                            | Implementer                      | Plan                                 | PLAN-EVAL                           | IMPL-EVAL                           | Vision                                       | Documentation                               |
| ---------------------------------------- | -------------------------------- | ------------------------------------ | ----------------------------------- | ----------------------------------- | -------------------------------------------- | ------------------------------------------- |
| simple / cheap                           | Luna max → Qwen 3.8 Flash Next   | N/A                                  | N/A                                 | MiniMax M3 → DeepSeek V4 Flash      | MiniMax M3 → DeepSeek V4 Flash Vision        | Gemini 3.8 Flash medium → Opus 5 low        |
| straightforward                          | SOL medium → GLM 5.3 Flash       | implementer → GLM 5.3 Flash          | Opus 5 medium → Qwen 3.8 Flash Next | GLM 5.3 Flash → DeepSeek V4 Pro     | DeepSeek V4 Flash Vision → Kimi K3 low       | Gemini 3.8 Flash high → Qwen 3.8 Flash Next |
| feature / fix                            | Astra low → Muse Spark 1.3 xhigh | Fable 5.1 low → Muse Spark 1.3 xhigh | GLM 5.3 → Fable 5.1 low             | Muse Spark 1.3 xhigh → Opus 5 xhigh | Gemini 3.8 Flash high → Muse Spark 1.3 xhigh | Qwen 3.8 Max → GLM 5.3 Flash                |
| complex                                  | Astra medium → Fable 5.1 medium  | Fable 5.1 medium → Muse Spark max    | Muse Spark max → Grok 4.6 high      | Muse Spark max → Muse Spark max     | Kimi K3 max → Gemini 3.8 Flash high          | Fable 5.1 medium → Qwen 3.8 Max             |
| architecture / RFC / explicit escalation | Astra xhigh → Fable 5.1 xhigh    | Fable 5.1 xhigh → Muse Spark max     | Muse Spark max → Grok 4.6 xhigh     | Grok 4.6 xhigh → Muse Spark max     | Kimi K3 max → Fable 5.1 high                 | Fable 5.1 high → Qwen 3.8 Max               |

The generator/evaluator family invariant applies to the selected routes after composing fallbacks.
Tier-specific evaluation round limits and escalation thresholds are part of the machine contract,
not operator prose.

### Owner amendment — deep research

| Workload tier   | Deep-research route                |
| --------------- | ---------------------------------- |
| simple          | Gemini 3.8 Flash low → Luna max    |
| straightforward | Gemini 3.8 Flash medium → Luna max |
| feature         | Gemini 3.8 Flash high → Luna max   |
| complex         | Gemini 3.8 Flash high → Luna max   |
| architecture    | Gemini 3.8 Flash high → Luna max   |

Deep research may use only native Google `agy` for Gemini or native Codex for Luna. Claude, OpenCode
Go, Ollama, and OpenRouter transports are forbidden for this role because accumulated research
context and output can make metered or scarce subscription routes disproportionately expensive. The
existing explicit authorization requirement still applies to `complex` and `architecture` research.

### Evaluation policy attached to the matrix

| Tier / role                                   | Round policy         | Required action                                                                                                            |
| --------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| simple PLAN-EVAL                              | N/A                  | no planning evaluator                                                                                                      |
| simple IMPL-EVAL                              | unspecified by owner | do not invent a limit; harness default remains explicit at dispatch                                                        |
| straightforward PLAN-EVAL                     | no roundtrip         | evaluator repairs a fixable plan in place immediately; complete rejection or a human-only decision is escalated            |
| feature PLAN-EVAL                             | max 2                | on the second fixable failure the same evaluator repairs in flight; complete rejection or human-only decision is escalated |
| complex PLAN-EVAL                             | max 3                | on the third fixable failure the same evaluator repairs in flight; complete rejection or human-only decision is escalated  |
| architecture PLAN-EVAL                        | max 1                | second failure escalates to the human owner                                                                                |
| straightforward / feature / complex IMPL-EVAL | max 5                | re-steer the same evaluator; notify the owner after 3 failures                                                             |
| architecture IMPL-EVAL                        | max 3                | re-steer the same evaluator; notify the owner after 2 failures                                                             |
| documentation                                 | max 2                | use the tier's IMPL-EVAL policy with the documentation roundtrip cap                                                       |

### Family-composition rule

Family means model-vendor family, not transport or the old undifferentiated `open` bucket: OpenAI
(Astra/SOL/Luna), Anthropic (Fable/Opus), Google (Gemini), Meta (Muse), Zhipu (GLM), Alibaba (Qwen),
MiniMax, DeepSeek, Moonshot (Kimi), and xAI (Grok). A declared fallback may share family with
another role candidate; the selector skips an illegal selected pair and composes that role's
remaining fallback(s) until it finds a different-family evaluator. Matrix construction proves that
each generator candidate has at least one legal evaluator candidate, not that every cartesian pair
is legal.

## Coordinator matrix

| Coordinator role      | Primary      | Fallback                                             |
| --------------------- | ------------ | ---------------------------------------------------- |
| small project         | Luna max     | Opus 5 low                                           |
| non-framework project | SOL medium   | Opus 5 medium                                        |
| framework project     | Astra low    | Opus 5 xhigh                                         |
| milestone             | Astra medium | Fable 5.1 medium; Opus 5 xhigh if Fable is exhausted |

Provider preference is ordered: Claude subscription → Codex subscription → Google subscription
(`agy`) → OpenCode Go through OpenCode CLI → Ollama subscription through OpenCode CLI → OpenRouter
through OpenCode CLI.

## Repository findings

| # | Finding                                                                                                                                                                | Consequence                                                                                                                                   |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `runtime/routing-policy.ts` is a flat legacy lane list whose route conditions mix workload classification, fallback causes, review pairing, and historical exceptions. | Replace it with explicit workload/coordinator matrix records and derived compatibility views; do not append Astra rows to the old policy.     |
| 2 | Model strings are centralized in `config/models.ts`, but its active catalog is the pre-Astra SOL/Fable-5 matrix.                                                       | Replace the active catalog while retaining a named legacy catalog only for persisted-state input compatibility.                               |
| 3 | `ProviderKind` has no OpenCode Go or Ollama identity and provider profiles cover native Claude/Codex plus OpenRouter only.                                             | Add distinct `opencode_go` and `ollama` provider identities and profiles so provider cost/limit semantics cannot be confused with OpenRouter. |
| 4 | `opencode-run.ts` always loads OpenRouter credentials, regardless of the selected model prefix.                                                                        | Select credential policy from the model/provider prefix and clear rival credential variables before launch.                                   |
| 5 | Existing quota state tracks provider failures and restoration, but there is no subscription expense watcher.                                                           | Add a pure budget evaluator and structured pre-dispatch CLI; integrate paid OpenCode routes so allowance is checked before launch.            |
| 6 | Existing self-certification guard compares broad agent family only and does not compose legal evaluator fallbacks for each generator candidate.                        | Give every model an explicit vendor family, skip illegal selected pairs, and prove at least one evaluator remains for every generator.        |
| 7 | Human policy, runtime policy, evaluator protocols, and manager skills repeat old routing rules.                                                                        | Generate/check a stable documentation marker from the typed matrix and replace active prose; historical `.llm/runs/**` remains untouched.     |

## Current provider facts

### OpenAI / Astra

- Canonical model ID: `gpt-6-astra`.
- Supported reasoning efforts include low, medium, high, xhigh, and max.
- The owner directed the target toolchain to treat Astra as available.
- Sources: `https://developers.openai.com/api/docs/models/gpt-6-astra` and
  `https://developers.openai.com/api/docs/guides/latest-model`.

### OpenCode Go

- Subscription price: $10/month.
- Monetary allowance windows: $12 per rolling five hours, $30 per week, and $60 per month.
- Usage can fall through to separately funded Zen balance when enabled; NetScript must fail closed
  at the Go allowance boundary rather than silently spend Zen balance.
- Provider model prefix: `opencode-go/`.
- Relevant live catalog IDs include `grok-4.6`, `gpt-5.6-luna`, `glm-5.3-flash`, `glm-5.3`,
  `kimi-k3`, `deepseek-v4-pro`, `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `minimax-m3`,
  `muse-spark-1.3-contributor`, `qwen3.8-max`, and `qwen3.8-flash`.
- Source: `https://opencode.ai/docs/fr/go` (2026-09-04 re-check).

### Ollama subscription

- Official subscription tiers currently expose monthly included credits and concurrency: Pro
  ($60 credits, concurrency 3), Max ($300, concurrency 10), Team ($1000 shared, concurrency 10).
  Credits reset on the subscription anniversary and do not roll over.
- Local models remain outside cloud credit accounting. Cloud overflow balance is a separate paid
  surface and must not be consumed implicitly.
- The watcher will resolve the subscribed tier from provider/account evidence or explicit local
  configuration; unknown tier/usage fails closed rather than guessing Pro versus Max versus Team.
- Provider model prefix: `ollama-cloud/`.
- Sources: `https://ollama.com/pricing` and the OpenCode provider documentation (2026-09-04).

### OpenRouter

- Remains the last fallback only. It is never selected while a higher-priority subscription route is
  healthy and within allowance.
- Existing credential handling remains local-only and value-free in receipts.

## Model-ID normalization

- Logical models and provider-specific IDs are distinct. Example: logical `qwen_3_8_flash_next` maps
  to the locally available `n5air/qwen3.8-flash-next` where supported and to the provider's
  `qwen3.8-flash` capability where “Next” is not exposed.
- Route selection is capability-based; it never invents an unsupported provider/model slug.
- “Fable 5.1” replaces the active Fable 5 identifier. Legacy IDs remain deserialization-only.

## Expense-watcher contract

- Input: provider/tier, usage snapshot timestamp, usage in each applicable window, estimated next
  charge, and optional concurrent request count.
- Output: structured JSON with `allowed`, per-window remaining amounts, warning state, reset/renewal
  metadata, and a stable failure reason. No credential values enter the input or output.
- OpenCode Go enforces all three monetary windows. Ollama enforces resolved monthly credits and
  concurrency. OpenRouter remains governed by its reported credit state.
- Unknown, stale, malformed, or unresolved subscription usage blocks the paid route and advances to
  the next declared fallback. It never authorizes an unmetered spend.

## Open questions resolved in plan

- Existing lane names are persisted-input identifiers only. They are never mapped heuristically into
  the replacement matrix: new selection through a legacy name fails closed and requires an explicit
  workload tier and role.
- Provider usage retrieval is an adapter boundary. The pure watcher consumes normalized snapshots,
  allowing official provider telemetry or locally accumulated OpenCode receipt data without coupling
  routing policy to one unstable endpoint.
- No repository code reads the owner-supplied raw key files directly. The host provisioning step
  installs mode-600 env files under the existing NetScript agentic config convention.
