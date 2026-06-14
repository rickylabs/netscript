# OpenHands Alternative Research for NetScript

Date: 2026-06-14
Run ID: `work--openhands-alternatives-research`

## Executive recommendation

Do **not** replace the whole NetScript cloud-agent workflow at once. The current GitHub Actions wrapper already has valuable behavior: trigger parsing, model/profile routing, run-scoped artifact paths, summary/comment ownership, commit-back for partial work, trace commits, and non-PR draft PR creation. Replace the **agent engine** behind that wrapper.

Recommended migration:

1. **Mandatory foundation:** put every cloud agent behind a LiteLLM proxy with virtual keys, spend budgets, request logs, alerting, and guardrail policy.
2. **Primary pilot:** run **OpenCode** through LiteLLM in a new parallel workflow. It is open source, TypeScript-aligned, has official LiteLLM integration docs, supports model context/output limits, and is much closer to the user's TypeScript preference than Python-first agents.
3. **Reliability fallback:** keep **mini-swe-agent** as a small, auditable LiteLLM-native runner for narrow issue-fix/evaluator tasks where predictability matters more than rich UX.
4. **Framework track:** evaluate **VoltAgent** if NetScript wants to own a TypeScript cloud-agent orchestrator rather than wrap an existing coding CLI.
5. **Defer / avoid as primary:** Aider is excellent but not a seamless cloud issue-to-PR agent. SWE-agent/Open SWE are strong but Python/platform-heavy. Codex via LiteLLM is viable but less aligned with the open-source/TypeScript/LiteLLM-behind-the-hood preference.

## Why OpenHands is risky in this repo

The user-provided issue reports a severe token-spend symptom: roughly 400k input tokens for 1k output tokens on a simple request, with Anthropic input token counters increasing from 7,143,439 to 7,555,570 around one repo/commit/push prompt. The issue is closed as stale/inactive, which means it should be treated as a known unresolved risk pattern rather than proof of a fixed defect. Source: https://github.com/OpenHands/OpenHands/issues/6893

In this repo, the risk is amplified by these local facts:

- The workflow installs OpenHands SDK from `main`, so behavior can drift without a pinned release.
- The runner delegates the full loop to a stateful OpenHands `Conversation` object.
- The workflow can run up to 500 iterations by default and clamps user input as high as 3000.
- The VPS setup grants Docker socket access and persistent state/workspace volumes.
- The workflow already had to add compensating controls: summary enforcement, iteration-limit detection, partial commit-back, and trace recording.

The replacement should therefore optimize for **bounded loops, auditable transcripts, deterministic summary/trace output, and external spend enforcement**.

## Candidate ranking

| Rank | Candidate | Fit | Why |
| --- | --- | --- | --- |
| 1 | OpenCode + LiteLLM proxy | Best first pilot | Open-source coding agent, TypeScript ecosystem, official LiteLLM docs, configurable model aliases and context/output limits. |
| 2 | mini-swe-agent | Best reliability fallback | LiteLLM-native, tiny/hackable, bash-only actions, simple linear history, easy to sandbox and debug. |
| 3 | VoltAgent custom runner | Best strategic TypeScript platform | TypeScript framework with tools/workflows/guardrails/observability, but requires building NetScript-specific coding tools and GitHub workflow glue. |
| 4 | Aider | Useful local/secondary engine | LiteLLM support and mature git behavior, but less natural for autonomous GitHub issue/comment workflows. |
| 5 | Codex CLI/action via LiteLLM | Viable but not preferred | Official LiteLLM integration exists; less aligned with open-source TypeScript preference and may duplicate hosted-agent economics. |
| 6 | SWE-agent / Open SWE | Strong but heavier | Good issue-to-PR lineage, but Python/platform-heavy; not the best match for a TS/Deno preference. |

## Candidate details

### 1. OpenCode + LiteLLM proxy — recommended pilot

OpenCode has official LiteLLM integration documentation. LiteLLM's OpenCode guide configures an OpenAI-compatible provider, points `baseURL` to the LiteLLM `/v1` endpoint, defines model aliases, supports multiple LiteLLM instances, and documents context/output limits plus dropped parameters for reasoning models. Source: https://docs.litellm.ai/docs/tutorials/opencode_integration

**Why it fits NetScript**

- TypeScript-aligned ecosystem and install path (`npm install -g opencode-ai` is documented).
- The current workflow can be reused almost unchanged: keep trigger parsing, artifact paths, summary/comment behavior, trace commit, and branch push logic.
- LiteLLM becomes the mandatory spend/observability layer rather than relying on the agent to self-limit.
- Project-level `opencode.json` can live in repo and be versioned.

**Risks**

- OpenCode still needs a non-interactive runner contract proven in Actions.
- Some LiteLLM/OpenAI-compatible providers have tool-call edge cases; pilot with the exact models you intend to use.
- It may not natively implement NetScript's summary/replies JSON contract, so a small wrapper script is needed.

**Implementation proposal**

Add a new workflow first, do not delete OpenHands:

- `.github/workflows/cloud-agent-opencode.yml`
- `.agents/cloud-agent/opencode-runner.ts` or `.github/scripts/run-opencode.ts`
- `.opencode/opencode.json` or generated `$RUNNER_TEMP/opencode.json`

Preserve the existing inputs:

- `prompt`
- `model`
- `model_profile`
- `target_pr`
- `output_mode`
- `iterations` renamed internally to `step_budget`

Add hard budgets:

- `timeout-minutes: 30` for the job.
- LiteLLM virtual key max budget per run/task class.
- Agent step timeout using `timeout` shell command.
- Max changed files and max patch size check before commit-back.
- Required early write to summary path before long exploration.

Suggested runner sequence:

```bash
npm install -g opencode-ai
cat > "$RUNNER_TEMP/opencode.json" <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM",
      "options": { "baseURL": "${LITELLM_BASE_URL}/v1" },
      "models": {
        "netscript-sonnet": { "name": "Sonnet via LiteLLM", "limit": { "context": 64000, "output": 4096 } },
        "netscript-gpt": { "name": "GPT via LiteLLM", "limit": { "context": 64000, "output": 4096 } }
      }
    }
  }
}
JSON
OPENCODE_CONFIG="$RUNNER_TEMP/opencode.json" \
LITELLM_API_KEY="$AGENT_LITELLM_VIRTUAL_KEY" \
timeout 25m opencode run --model "litellm/${MODEL_ALIAS}" --prompt-file "$REQUEST_PATH"
```

Exact CLI flags may need verification against the pinned OpenCode version during implementation.

### 2. mini-swe-agent — recommended fallback/evaluator runner

LiteLLM's project page describes mini-swe-agent as small, hackable, bash-only, LiteLLM-backed, and deployable locally or in containers. Source: https://docs.litellm.ai/docs/projects/mini-swe-agent

**Why it fits NetScript**

- Small surface area: easier to audit than OpenHands.
- Linear history and subprocess-style actions are easier to bound, replay, and sandbox.
- Good fit for narrow tasks: run evaluator, fix one issue, respond to comments, create small patch.
- Can use the same LiteLLM proxy/budget layer.

**Risks**

- Python-based, not TypeScript/Deno.
- Less rich developer UX than OpenCode/OpenHands.
- May require custom glue for PR comments and summary/replies.

**Implementation proposal**

Add `.github/workflows/cloud-agent-mini-swe.yml` or a single generic `cloud-agent.yml` with `engine: mini-swe` input. Use the existing OpenHands artifact contract but replace the run step:

```bash
uv tool install mini-swe-agent
mini --model "$LITELLM_MODEL" --config "$RUNNER_TEMP/mini.yaml" --task-file "$REQUEST_PATH"
```

Use mini-swe-agent especially for:

- `output=summary-only` evaluator passes.
- low-budget comment response loops.
- smoke-testing a candidate patch generated by OpenCode.

### 3. VoltAgent — strategic TypeScript framework, not immediate drop-in

VoltAgent presents itself as an open-source TypeScript agent framework/platform with memory, RAG, guardrails, tools, workflows, MCP, and observability/VoltOps. Source: https://github.com/voltagent/voltagent

**Why it fits NetScript**

- Best match for the user's TypeScript preference.
- Lets NetScript own the agent state machine, tool permissions, summaries, GitHub IO, and guardrails directly.
- Could make harness mode first-class instead of prompting a general coding CLI to remember the protocol.

**Risks**

- It is a framework; NetScript would need to build a coding-agent toolset: shell, file editing, git diff, test runner, GitHub comment reader, patch validator, and summary writer.
- LiteLLM may be used through OpenAI-compatible provider plumbing, but it is not the same as a mature coding-agent CLI already integrating LiteLLM.

**Implementation proposal**

Use VoltAgent only after OpenCode/mini-swe pilots expose stable contracts. Build a NetScript-specific `cloud-agent` service with:

- Deno/Node GitHub event adapter.
- LiteLLM OpenAI-compatible client.
- Tool allowlist: `rg`, `sed`, `deno task`, `git diff`, non-destructive `git` commands.
- Explicit state machine: `PLAN -> EDIT -> TEST -> SUMMARIZE -> STOP`.
- Token budget and max tool-call budget enforced before every model call.
- OpenTelemetry traces exported to your observability stack.

### 4. Aider

Aider documents that it uses LiteLLM to connect to hundreds of models. Source: https://aider.chat/docs/llms/other.html

Aider is worth keeping for local or narrow CI edits because it is mature and git-aware. It is not the best primary replacement for OpenHands in this repo because the existing workflow needs GitHub issue/comment ingestion, output modes, trace metadata, summary files, and branch push behavior. Those can be wrapped, but OpenCode and mini-swe-agent map more naturally to an autonomous cloud-agent pilot.

### 5. Codex CLI/action through LiteLLM

LiteLLM documents an OpenAI Codex integration that routes Codex through LiteLLM for provider access, usage tracking, analytics, and virtual keys. Source: https://docs.litellm.ai/docs/tutorials/openai_codex

This is a valid candidate if you are comfortable with Codex's ecosystem and API economics. It is not the primary recommendation because the user asked for open source, preferably TypeScript/Deno, and LiteLLM behind the hood.

### 6. SWE-agent / Open SWE

SWE-agent and Open SWE are strong issue-to-PR-style systems, but they are heavier and less aligned with a TypeScript/Deno preference. Consider them if OpenCode cannot run reliably non-interactively or if you want a benchmark-driven Python agent stack.

## NetScript migration architecture

### Keep from current workflow

Preserve these existing OpenHands workflow capabilities:

- Trigger surface: `workflow_dispatch`, issue/PR labels, issue comments, push commit token.
- Model precedence and provider inference.
- Output modes: `pr-comment`, `respond-comments`, `thread-replies`, `summary-only`.
- Run-scoped artifact paths.
- `OPENHANDS_SUMMARY_PATH` equivalent, renamed generically to `AGENT_SUMMARY_PATH`.
- Summary synthesis if missing.
- Partial commit-back for PR branches.
- Trace directory and metadata commits.
- Status comment created once and edited in place.

### Generalize names

Create a provider-neutral workflow layer:

| Existing | Proposed |
| --- | --- |
| `openhands-agent.yml` | `cloud-agent.yml` or `cloud-agent-opencode.yml` |
| `OPENHANDS_RUN_DIR` | `AGENT_RUN_DIR` |
| `OPENHANDS_TRACE_DIR` | `AGENT_TRACE_DIR` |
| `OPENHANDS_SUMMARY_PATH` | `AGENT_SUMMARY_PATH` |
| `.openhands/agent_runner.py` | `.agents/cloud-agent/<engine>-runner.ts` |
| `chore(openhands): ...` | `chore(agent): ...` |

### LiteLLM policy baseline

Use LiteLLM proxy as the only network path for Actions agents:

- One virtual key per engine/profile/task class, e.g. `netscript-opencode-pr`, `netscript-mini-eval`.
- Per-key budget and reset period.
- Model allowlist by task class.
- Per-model context/output caps.
- Request/response logging with redaction.
- Alert on abnormal input/output ratio, long-running sessions, or spend threshold.
- Guardrail hooks for secrets and prompt-injection-sensitive outputs.

### Guardrails to add before full migration

1. **Workflow timeout:** set job and agent-step `timeout-minutes`/`timeout` explicitly.
2. **Budget kill switch:** LiteLLM virtual key max budget per run/task class.
3. **Patch bounds:** reject commit-back if changed file count or diff size exceeds threshold unless prompt contains an explicit override token.
4. **Secret egress control:** do not pass broad PAT to the agent process; use GitHub CLI/token only in workflow-owned post steps when possible.
5. **Network posture:** prefer no arbitrary outbound network for the agent step unless task requires it; if unavailable in GitHub-hosted runners, enforce via tool prompt and LiteLLM-only LLM path.
6. **Trace completeness:** always upload request, summary, metadata, exit codes, and last N lines of log.
7. **Engine pinning:** pin agent versions rather than installing from `main`.
8. **Two-agent separation:** use a different engine/model for evaluator passes when harness mode asks for evaluation.

## Concrete rollout plan

### Phase 0 — Immediate containment for OpenHands

- Pin OpenHands SDK/tools to a known commit or release instead of `main`.
- Lower default iterations from 500 to a task-class-specific budget.
- Add job timeout.
- Route OpenHands through LiteLLM proxy if not already doing so.
- Keep OpenHands only for small tasks while pilots run.

### Phase 1 — LiteLLM gateway

- Deploy LiteLLM proxy as self-hosted service or managed gateway.
- Add repository secrets/vars:
  - `LITELLM_BASE_URL`
  - `LITELLM_MASTER_KEY` for admin-only workflows
  - `AGENT_LITELLM_KEY_OPENCODE_PR`
  - `AGENT_LITELLM_KEY_MINI_EVAL`
- Add a `litellm-config.yaml` with model aliases matching workflow profiles.

### Phase 2 — OpenCode parallel workflow

- Add `.github/workflows/cloud-agent-opencode.yml`.
- Copy the OpenHands trigger/summary/comment/commit-back shell.
- Install/pin OpenCode.
- Generate OpenCode config pointing to LiteLLM.
- Use `output=summary-only` for first runs.
- Test on small PR review comment tasks and harness research tasks.

### Phase 3 — mini-swe evaluator/fallback

- Add mini-swe-agent as a second engine for bounded evaluator/fixup tasks.
- Use it when OpenCode run fails or times out.
- Compare cost, runtime, changed files, pass/fail, and summary quality.

### Phase 4 — Decide

Decision criteria after 10-20 representative runs:

- Median and p95 input/output tokens.
- Median and p95 runtime.
- Failure modes: timeout, missing summary, invalid patch, excessive diff, test failures.
- Review quality and correctness.
- Trace completeness.
- Ease of local reproduction.

If OpenCode wins, rename it to the default `cloud-agent` and leave OpenHands as manual fallback for one release window. If mini-swe wins on reliability, use OpenCode for interactive/rich tasks and mini-swe for automation. If both are insufficient, build the VoltAgent custom TypeScript orchestrator.

## Bottom line

The best near-term OpenHands alternative for NetScript is **OpenCode behind LiteLLM**, embedded in a new parallel GitHub Actions workflow that preserves the existing OpenHands workflow's trigger/artifact/comment/commit-back contract. The safest reliability companion is **mini-swe-agent behind LiteLLM**. The best long-term TypeScript-native strategic bet is **VoltAgent**, but only if you are ready to own a NetScript-specific coding-agent harness rather than adopting a ready-made coding CLI.
