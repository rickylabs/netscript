# Plan: repoint Gemini documentation lane to Antigravity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-lane-gemini-antigravity--1082` |
| Branch | `fix/lane-gemini-antigravity` |
| Phase | `implement` (owner-waived Plan-Gate) |
| Target | Internal agentic CLI/tooling and harness policy |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Locked Decisions

- Bind `documentation_authoring` exactly like `research_extraction`: Antigravity/Google/`MODEL_IDS.antigravity`/low.
- Remove every config-supported Gemini-over-OpenRouter route.
- Preserve formal evaluator routes and their approved Qwen/Minimax open-model set.
- Keep the existing named Gemini-generator rejection test; after this change it rejects the lane first because its purpose remains documentation, not evaluation.
- Fold owner-authorized issue #1089 into PR #1086. Antigravity print invocations use the centralized native Gemini docs model, stream JSON, skipped permissions, and a new project; omit `--print-timeout`; place `--print` as the final flag with the prompt as its value.

## Open-Decision Sweep

No open decisions would force rework. Provider-profile cleanup, test updates, and dated policy wording are all fixed by #1082.

## Commit Slice

1. Repoint the documentation lane and remove the paid-credit config path.
2. Correct Antigravity prompt argv and stream-JSON evidence parsing for #1089. Proved by focused adapter tests, a unique-marker live invocation, empirical `agentic:antigravity-evidence`, the full agentic suite, and scoped lint/fmt.

## Risk Register

- Stale preset type/test reference: mitigate with full agentic tests and repository search.
- Evaluator weakening: preserve the formal route and named rejection test, then run routing tests.
- Policy/data drift: update machine binding and rendered row in the same slice.

## Deferred Scope

- No evaluator route, credentials, release tooling, or package/plugin code changes.

## Debt

None created or resolved.
