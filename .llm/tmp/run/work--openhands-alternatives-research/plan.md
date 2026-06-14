# Harness Plan — OpenHands Alternatives Research

Run ID: `work--openhands-alternatives-research`
Date: 2026-06-14

## Scope

Research OpenHands alternatives for the NetScript repository's existing cloud-agent GitHub Actions workflow, with emphasis on open-source projects, TypeScript/Deno preference, LiteLLM compatibility, GitHub Actions integration, observability, guardrails, and reliability.

## Profile

- Archetype: overlay-only, no package/plugin implementation.
- Scope overlay: `SCOPE-docs.md` because this run produces research and implementation-plan artifacts.
- Current doctrine verdict: not package/plugin-touching; doctrine gates are not applicable beyond repository workflow awareness.

## Inputs

- Existing files reviewed:
  - `.github/workflows/openhands-agent.yml`
  - `.openhands/agent_runner.py`
  - `ops/openhands/docker-compose.yml`
  - `AGENTS-handoff.md`
  - `.agents/skills/openhands-handoff/SKILL.md`
- External research sources are cited in `worklog.md` and `research-output.md`.

## Required gates

| Gate | Expectation |
| --- | --- |
| Repository workflow inspection | Inspect current OpenHands Action, runner, and VPS setup. |
| Recent run inspection | Attempt to inspect recent failed/timed-out Actions runs. |
| External candidate research | Use current sources for candidate state and LiteLLM integration. |
| Concrete implementation proposal | Provide migration options with phases and risk controls. |

## Commit slices

1. Add harness research plan/worklog/context/drift/commits plus final research output.
2. Validate artifacts are present and commit.
