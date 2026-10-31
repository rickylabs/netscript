# Drift

RTK unavailable; use focused raw commands. No product scope drift.
Owner-specific instructions govern evaluator model, Refs-only PR, coordinator metadata,
and final report file handoff over generic templates.

Root formatter/linter excludes CLI. Explicit scoped config preserves root style/rules while ensuring both owned files are actually processed. No root config was changed.

## CI follow-up: generated Aspire inventory

Required CI quality failed solely at Aspire version parity: manifest freshness.
The new real-install parity test mentions `aspireAgentInitializer`, so it must be registered
in the tracked Aspire surface inventory. This generated inventory was missing from the
initial declared carrier list. Owner follow-up authorizes CI fixes; add this one generated
fixture to the write surface. Canonical aspire-surface-manifest.ts adds exactly one test row;
no rule, source behavior, pin, gate, or workflow changes. Local parity now passes.
