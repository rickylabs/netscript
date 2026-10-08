# Plan — Anthropic compatibility

One fix slice: replace the static membership gate with instance-scoped additive IDs, preserve exact native transport, and validate the documented request modes for the three reported models.

1. Add `models?: readonly string[]` to the owned provider config and its registered factory. Keep SDK catalog and existing Sonnet default; validate configuration eagerly and deduplicate a snapshot per provider.
2. Build TanStack extended factories per provider using public `createModel`/`extendAdapter`. Arbitrary added IDs get text transport only and no invented descriptor capabilities. Exact current IDs use documented knowledge only; no name-prefix capability inference.
3. Bind neutral option mapping and native option validation to the selected exact ID. Opus/Fable cannot disable adaptive thinking; neutral `off` emits no disabling field. Sonnet `off` maps to `between_tools`. Reject unsupported modes/effort/tool choice/sampling in the effective merged bag before IO; validate both request and per-call option surfaces.
4. Regression first: configured future IDs must be supported/discoverable/constructible offline; baseline fails by assertion. Then add real mocked Anthropic Messages SSE coverage for IDs, options, per-request connection values, tools, reasoning, usage, aborts and errors.
5. Run full AI and AI plugin suites, source quality wrappers, architecture/quality gates, doc/export-carrier generation, public package dry-run and required CLI E2E. Record unavailable gates honestly. Open upstream draft promptly; do not close upstream issue until stable release/consumer evidence exists.
6. Independent implementation review follows the fresh straightforward matrix; retain failures/fallback evidence. Harness PR points to code PR and evidence.

Decisions: use the issue’s explicit additive-ID remedy without upgrading a single TanStack peer independently; retain the existing owned neutral effort union; native `output_config.effort` handles extra documented levels. No owner fork is required; the autonomous assignment authorizes routine implementation judgment.

PLAN-EVAL: N/A under the supplied one-slice fix workflow. No architecture change; regression and mandatory separate-family implementation evaluation are the gates.

Risk: configuration could contaminate other instances (isolation test); SDK could substitute models or drop new options (mock actual Messages wire); unsupported wire mode could bypass one option layer (effective merged validation); a future ID could acquire invented capability metadata (unknown-descriptor assertion). Stable publication remains an explicit downstream acceptance gate, not a claim of this source PR.
