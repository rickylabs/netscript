# Harness Worklog — OpenHands Alternatives Research

## Design

### Public surface

- Research artifact: `.llm/tmp/run/work--openhands-alternatives-research/research-output.md`.
- Harness artifacts: `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md`.

### Domain vocabulary

- **Cloud agent workflow**: GitHub Actions-triggered agent that reads an issue/PR/comment/label and produces commits/comments.
- **Harness runner**: a deterministic wrapper that enforces request files, trace files, summary contract, iteration/token budget, and branch commit-back.
- **LLM gateway**: LiteLLM proxy as the policy choke point for model routing, budget, logging, spend, and guardrails.
- **Candidate engine**: OpenCode, Aider, mini-swe-agent, Codex CLI/action, SWE-agent, VoltAgent, or Open SWE.

### Ports

- GitHub Actions event inputs.
- GitHub API/CLI for comments, PR review comments, and branch pushes.
- LiteLLM proxy endpoint and virtual keys.
- Agent CLI or SDK process invocation.

### Constants

- Existing output modes: `pr-comment`, `respond-comments`, `thread-replies`, `summary-only`.
- Existing model profiles: `sonnet`, `gpt`, `gemini`, `openrouter`.
- Existing OpenHands verdicts: `completed`, `bootstrap-failed`, `agent-failed`, `summary-missing`, `not-run`.

### Commit slices

1. Research-only artifact slice: add harness plan, worklog, context, drift, commits, and final research report.

### Deferred scope

- Do not replace the OpenHands workflow in this run.
- Do not deploy LiteLLM proxy or a candidate agent.
- Do not modify repository CI until the owner chooses a migration track.

### Contributor path

Read `research-output.md`, choose Track A/B/C, then implement by copying the existing OpenHands workflow skeleton and replacing only the install/run step plus request prompt contract.

## Repository workflow findings

The current `.github/workflows/openhands-agent.yml` is mature but tightly coupled to OpenHands SDK. It supports manual dispatch, label triggers, PR/issue comments, and push-trigger handoffs; resolves model/provider/output/iteration inputs; hydrates workflow files from the workflow ref; prepares run-scoped artifacts; writes summary/comment contracts; commits partial PR work back; commits traces; and creates PRs for non-PR triggers. It already has several reliability controls that should be preserved in any replacement:

- The request resolver chooses model/profile/provider/output/iteration from workflow inputs, labels, comments, commit messages, repository variables, and defaults.
- The workflow creates run-scoped `OPENHANDS_RUN_DIR`, `OPENHANDS_TRACE_DIR`, request, summary, replies, comment, and metadata files.
- The workflow requires the agent to write a summary and synthesizes one if absent.
- The workflow commits partial work back when the agent fails after bootstrap.
- The workflow records trace metadata under `.llm/tmp/run/openhands/...` for PR-triggered runs.

The weak point is the actual agent engine: `.openhands/agent_runner.py` installs OpenHands SDK from `main`, creates a stateful `Conversation`, and relies on OpenHands event semantics for iteration-limit detection. The VPS compose file runs a full OpenHands service image with Docker socket access and persistent workspace/state.

## Recent failed/timed-out Actions inspection

Attempted command:

```bash
gh run list --workflow openhands-agent.yml --limit 20 --json databaseId,status,conclusion,createdAt,updatedAt,event,displayTitle,url,headBranch
```

Result: `gh` is not installed in this container, so repository-specific recent failed/timed-out Actions runs could not be inspected locally. The research output therefore distinguishes local workflow analysis from unavailable live GitHub run history.

## External research findings

- The cited OpenHands issue describes a report of roughly 400k input tokens for 1k output tokens, with total Anthropic input token counts increasing from 7,143,439 to 7,555,570 during a simple repo/commit/push prompt; the issue was closed stale/inactive, not resolved with an obvious workflow-level fix. Source: https://github.com/OpenHands/OpenHands/issues/6893
- LiteLLM positions itself as an open-source AI gateway/proxy with unified provider access, central authentication, usage tracking, cost controls, observability, guardrail providers, and alerting/monitoring. Sources: https://docs.litellm.ai/docs/project and https://docs.litellm.ai/docs/tutorials/opencode_integration
- OpenCode has official LiteLLM documentation: configure an OpenAI-compatible provider with `baseURL` pointing to LiteLLM `/v1`, model aliases, context/output limits, and additional dropped params for reasoning models. Source: https://docs.litellm.ai/docs/tutorials/opencode_integration
- mini-swe-agent has official LiteLLM documentation and is described as a small, hackable agent using bash only, built on LiteLLM, with CLI/Python bindings and Docker/Podman/Apptainer deployment options. Source: https://docs.litellm.ai/docs/projects/mini-swe-agent
- Aider documents direct use of LiteLLM for many models and has built-in git integration, but it is primarily an interactive/CLI coding tool rather than an issue-to-PR cloud agent. Source: https://aider.chat/docs/llms/other.html
- VoltAgent is an open-source TypeScript agent framework with workflows, tools, memory, guardrails, and observability/VoltOps positioning; it is a framework rather than a drop-in coding-agent runner. Source: https://github.com/voltagent/voltagent
- OpenAI Codex can be routed through LiteLLM proxy according to LiteLLM's official Codex integration docs, but Codex is not TypeScript/Deno and may be less aligned with the user's open-source/LiteLLM-behind-the-hood preference than OpenCode/mini-swe-agent. Source: https://docs.litellm.ai/docs/tutorials/openai_codex

## Gate results

| Check | Command / evidence | Result |
| --- | --- | --- |
| Workflow inspection | `sed -n '1,1040p' .github/workflows/openhands-agent.yml` | PASS |
| Runner inspection | `sed -n '1,220p' .openhands/agent_runner.py` | PASS |
| VPS setup inspection | `sed -n '1,180p' ops/openhands/docker-compose.yml` | PASS |
| Recent Actions inspection | `gh run list --workflow openhands-agent.yml ...` | WARNING: `gh` unavailable |
| External source freshness | Web search/open on 2026-06-14 | PASS |
