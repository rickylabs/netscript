# [aspire-13-5 S4] Generator re-validation against the 13.5 TypeScript API

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:aspire`, `priority:p1`,
> `status:triage`. Milestone: `0.0.7`. Closes #1371.

## Summary

Diff every Aspire SDK member the AppHost generators emit against the 13.5 TypeScript API reference,
fix stale comments/defaults, and settle #1371 (`BackgroundProcessors.*.ServiceReferences` injection)
with a generator test.

## Scope

- `packages/cli/src/kernel/templates/aspire/helpers/register/*.ts`, `generate-config-schema.ts`,
  `generate-db-cli-mode.ts`, `generate-index.ts`, `assets/aspire/helpers/*.template`: confirm each
  emitted member (`addExecutable`, `withHttpEndpoint`, `withHttpHealthCheck`, `withEnvironment`,
  `withReference`, `waitFor`, `waitForCompletion`, `withOtlpExporter`, `withBrowserLogs`,
  `withExplicitStart`, `addParameter`, `addPostgres`/`addMySql`/ `addSqlServer`, `addDatabase`,
  `addConnectionString`, `addContainer`, `withEndpoint`, `withLifetime`, `withDataBindMount`,
  `withBindMount`, `withImage`/`withImageTag`, `withArgs`, `withContainerRuntimeArgs`,
  `getEndpoint`) against `reference/api/typescript/aspire.hosting` 13.5.x; record the table in the
  PR.
- `generate-aspire-config.ts:44-56` comment: replace "Revisit when Aspire 13.3 lands (aspire#15119 /
  aspire#16220)" with the 13.5 facts (TS projection exists — C25; first-party Deno hosting is 13.6 —
  aspire#18627/#18628) and point at S12.
- `assets/aspire/helpers/_aspire-compat.ts.template:1-3`: re-anchor "Remove when Aspire 13.3 adds
  Deno runtime support (aspire#15812)" to aspire#18627/#16218 (13.6).
- `packages/config/src/domain/schemas/aspire-schema.ts:9`: default `appHost` →
  `./aspire/apphost.mts` (legacy `./dotnet/AppHost` was removed with #659); update the doc comment.
- #1371: add a generator test that a `BackgroundProcessors.<name>.ServiceReferences` entry produces
  `services__<ref>__http__0` (`generate-register-background.ts`); fix if it does not.
- Arch-debt "CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred": update the
  evidence paragraph (TS projection exists) and the gate (S12 restore proof).

## Boundaries

No emission-shape changes beyond #1371's fix; port/health/command changes belong to S5/S6/S8.

## Acceptance

- [ ] PR comment contains the member-by-member table (emitted member → 13.5 API page → status).
- [ ] No stale upstream-issue reference remains in `packages/cli/src/kernel/templates/aspire/**` or
      `assets/aspire/**` (grep for `aspire#15119|aspire#16220|aspire#15812`).
- [ ] #1371 resolved with a named test; `Closes #1371` in the PR body.
- [ ] `AspireConfigSchema` default updated with a test.
- [ ] Snapshot templates under `assets/generated/aspire/helpers/*.template` regenerated and
      `check:assets-barrel` green.

## Tests / gates

Generator unit tests (`packages/cli/src/kernel/templates/aspire/**/*_test.ts`), scoped wrappers,
`quality:scan`, `arch:check`, `check:assets-barrel`, `scaffold.plugins` suite.

## Docs / static asset regeneration

`deno task gen:assets-barrel`.

## Related

Part of #<epic>. Depends on S1, S2 (V1). Related: #1447, #964, #781/#791 (previous generator
regression cluster), #1335 (record the diff in the scaffold-conformance inventory).
