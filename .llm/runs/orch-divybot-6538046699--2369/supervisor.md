# Supervisor

Issue #2369, milestone 0.0.9 group B2. Branch `orch/divybot-6538046699`; baseline main `204a71b1ef0133faa07ce5c191e4170b5cb76171`. Implementation: assigned Codex session, OpenAI family, xhigh. Separate read-only evaluator: Claude Opus 5.5 high, owner-requested override. No private machine/session identifiers are published.

Authorized write surface: this run directory; `plugins/sagas/database/sagas.prisma`; saga plugin schema installation tests and generated publish assets; `packages/database/src/commands/`, `packages/database/ports/command-outbox-relay.ts`, `packages/database/commands/`, database tests/fixtures; `packages/plugin-sagas-core/src/stores/`, its runtime export barrel and retention contracts, package tests/fixtures; saga plugin retention adapters/tests only if integration requires them; `docs/site/reference/plugin-sagas-core/index.md`, outbox relay documentation and corresponding generated docs assets. `.divybot-goal.md` is excluded. `saga-engine.ts` is excluded by assignment. Scope additions require recorded drift.

Routing: inspected `deno task agentic:matrix --tier feature --json`. Primary implementation sol xhigh; plan/implementation evaluation defaults differ from the explicit owner override below. Feature maximums: two plan rounds, five implementation rounds; reuse each evaluator session. Exact owner override is recorded in worklog.

Scope extension authorized by the assigned end-to-end implementation mandate after PLAN-EVAL: scoped CLI schema-copy/integrity files/tests, database scripts migration runner/helper/tests, `.llm/tools/command-postgres-conformance.sh`, package READMEs/changelogs, dated lesson and generated docs/assets/corpus carriers. No engine path or unrelated scaffold changes.

The scoped command-postgres workflow path filters and CLI installation probe are included in the authorized migration proof surface.

CI repair extension: the owner's subsequent request to fix every red check authorizes the Linux native E2E driver and its focused launcher-discovery tests. The remote manual E2E run selected this existing lane and reproduced an inherited packaging-name mismatch. Keep production packaging and saga/database behavior unchanged; discover the installed launch entry rather than deriving it from a runtime library filename.
