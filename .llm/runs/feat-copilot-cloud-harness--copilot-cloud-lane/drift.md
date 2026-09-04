# Drift Log: GitHub Copilot cloud lane for the NetScript harness

Drift is append-only. No drift recorded at activation.

## 2026-09-04T19:07Z — Gemini transport correction

- Superseded: the intermediate interpretation that every non-OpenAI/non-Anthropic Copilot catalog
  model should route through Copilot, including Gemini.
- Authoritative rule: Gemini always uses the native Google subscription through `agy`; this also
  preserves the restricted deep-research route (`agy` Gemini 3.8 Flash, native Codex Luna fallback).
- Copilot-first routing is limited to other supported matrix families, currently Kimi K3 and Grok
  4.6, before OpenCode Go, Ollama, and OpenRouter.

## 2026-09-04T19:17Z — Gemini Copilot fallback clarification

- Native Google `agy` remains the mandatory first route for Gemini.
- A catalog-attested GitHub Copilot Gemini is permitted as a same-model fallback after native `agy`
  is unavailable.
- Deep research ordering is `agy` Gemini 3.8 Flash, Copilot Gemini 3.8 Flash, then native Codex
  Luna. Generic OpenCode Go, Ollama, OpenRouter, and Claude remain excluded.
