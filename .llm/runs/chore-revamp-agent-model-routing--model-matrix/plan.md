# Plan: agent model routing and subscription expense policy revamp

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-revamp-agent-model-routing--model-matrix` |
| Branch | `chore/revamp-agent-model-routing` |
| Phase | `research` |
| Target | harness and agentic tooling |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Goal

Replace the legacy delegation matrix with the owner-ratified 2026-09-04 matrix, prefer subscription
transports before paid API fallbacks, and teach the expense watcher the OpenCode Go and Ollama
subscription limits without exposing credentials.

## Current planning state

Research is in progress. Architecture decisions, the open-decision sweep, risk register, slices, and
the exact gate set will be locked before the required separate-session PLAN-EVAL. No implementation
slice may begin before that verdict is `PASS`.

