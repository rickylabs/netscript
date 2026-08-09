# W2-C plan — #1202 partial + #1327

## Profile and current verdict

- Archetype 6 — CLI/tooling, with generated-service runtime evidence.
- Current doctrine verdict for `@netscript/cli`: Restructure (accepted, not expanded here).
- Existing `@netscript/database` script export remains within its published surface.
- The milestone orchestration plan received separate PLAN-EVAL PASS. This slice has a locked brief
  and no unresolved architectural choice, so no additional slice PLAN-EVAL session is launched.

## Locked decisions

1. `db migrate` means create and apply a schema-change migration. It never aliases deploy-only
   behavior based on TTY, CI, or presence of a connection string.
2. `db deploy` remains the sole deploy-only verb. Output labels creation and application separately.
3. Migration success requires a before/after filesystem inventory and database-state verification;
   a child exit code alone is insufficient.
4. Headless migration creation that Prisma cannot perform returns non-zero and names the exact
   interactive next command, including `--name` when absent.
5. Endpoint wiring stays resource/reference based. No live allocated URL is persisted into
   `appsettings.json`, generated env files, or run manifests.
6. Runtime evidence compares two isolated starts of the same scaffold and records live Postgres,
   users-process connection identity, health JSON, structured logs, and correlated OTEL per start.
7. #1327 may close when all six acceptance rows have evidence. #1202 is always `Refs #1202`; its
   owner-machine collision row and three consecutive clean runtime passes remain unchecked.

## Commit slices

1. Harness bootstrap and RED contracts: run artifacts, migration semantics tests, and consecutive
   endpoint-allocation regression fixtures.
2. Migration artifact implementation: explicit result vocabulary, create/apply verification,
   actionable headless failure, and separate deploy reporting.
3. Generated-project E2E implementation: TTY/non-TTY schema mutation, file/database assertions,
   deploy-only and no-change controls.
4. Live endpoint evidence: two-start users/Postgres identity receipt with health/log/trace proof.
5. Gate and evaluator handoff: required static/fitness/publish/resource gates, serialized runtime
   request and granted verdict, PR evidence, and `status:impl-eval` handoff.

## Gate set

- Focused `packages/database` migration tests.
- Focused `packages/cli` DB command, generator, and CLI-E2E tests.
- Scoped check/lint/fmt wrappers for changed roots with `--deno-arg --no-lock` on check.
- `deno task quality:gate` and `deno task arch:check`.
- `deno task doc:lint --root packages/database --pretty` if its export surface changes.
- `deno task publish:dry-run` for publishable source changes.
- Leak check before and after every AppHost/container run.
- Exact serialized `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, only after
  `EXPENSIVE-GATE-REQUEST` is pushed and the orchestrator grants the token.
- Review-thread gate before handoff.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Prisma text output varies | Treat files and `_prisma_migrations` as authority; text is diagnostic only. |
| A no-change migrate is mistaken for success | Negative control requires no created set and an explicit non-zero/no-change classification. |
| PTY tests become platform-specific | Keep PTY harness isolated and assert command contract; real Postgres state is shared with headless fixture. |
| Endpoint proof accidentally persists secrets | Store redacted authority tuple (host/port/database/resource), never credentials. |
| Runtime evidence collides with sibling lanes | Follow leak-check ownership and serialized expensive-gate protocol. |
| Existing CLI doctrine debt expands | Reuse vertical DB feature and adapter seams; no new maintainer/public mixing or permission surface. |

## Deferred scope

- Identifying the colliding Windows service and port on the owner's machine.
- Ticking #1202's owner-observational row or closing #1202.
- Three owner-machine consecutive full runtime passes.
- Broad CLI Archetype-6 restructure or permission documentation remediation.
- Any dependency/version change.

