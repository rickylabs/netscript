# Drift

- Before implementation: actual coordinated bump lives in `.llm/tools/deps/`; corrected write surface.
- Environment: rtk unavailable. Use direct commands with structured wrappers for verdicts.
- Owner override: `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only.
- Operator directive takes precedence over generic footer: draft, Refs #2548 only, no labels/session identifiers; stop at READY for Cockpit.
