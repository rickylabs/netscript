# Plan & Design — READY FOR REVIEW

LOCKED: complete all three findings in #2464 as one cohesive token safety repair. Use TOKEN_PRESET_FILE in cleanAppTokens. Guard Vite's production-only design-route exclusion and the dev layout's token-catalog helper import in the existing architecture test.

LOCKED: designTheme uses Vite's lazy installed-file glob to honor only presets whose optional stylesheet exists; otherwise ignore the query and retain the configured theme, fonts and no preview link. Keep its synchronous signature and the existing app metadata contract. No compiler/registry schema additions or runtime filesystem/network probes. Research proved glob behavior on the pinned Vite release.

Tests: execute actual template modules through Vite SSR with absent, installed, partial/unknown and configured preset cases; fetch any returned preview CSS from the real static server and require HTTP 200. Existing token lifecycle tests prove the shared constant preserves preset metadata. Add production guard assertions; use a targeted negative control for removal of the Vite ignore.

PLAN-EVAL: N/A — bounded follow-up with established public contracts, exact acceptance, and a successful real-runtime research probe. No architectural or public-schema choice remains unresolved.

Gates: structured focused test/check/lint/fmt wrappers; relevant app template, token and init/preset suites; quality:gate; release:preflight; canonical carrier generation and all five checks; generated-app type check; canonical full CLI smoke attempted at merge-readiness with environment limits reported honestly. Final independent read-only Claude Opus 5.5 high evaluation in a new separate session, re-steered within this leaf if needed.

Risk: Vite static/public paths differ from HTTP paths; real server tests validate both. Generator refresh can modify many carriers; inspect exact deltas and restore docs-site lock churn. Browser/server handles must close in finally. No test weakening or source fixture exemptions. No new architectural debt planned.

Deferred: sibling tracker issues, S3 component changes, Figma values, publication and merge.
