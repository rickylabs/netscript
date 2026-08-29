# [aspire-13-5 S3] Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps`

> DRAFT TEXT ONLY. Labels: `type:test`, `epic:aspire-13-5`, `area:telemetry`, `area:tooling`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`.

## Summary

Capture 13.5.3 versions of every Aspire-shaped fixture under a version-suffixed name and switch the
tests to the new fixtures while keeping the 13.4.6 files for the adapter's backward-compat cases.

## Scope

- `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-fixture.ts` → add `aspire-13.5.3-fixture.ts`
  (dashboard `/api/telemetry/{resources,logs,traces}` envelopes captured from S2's V5).
- `packages/mcp/tests/service-endpoint-source-fixtures.ts` (13.4.6 banner + `describe` shape),
  `packages/mcp/tests/telemetry-live-fixture_test.ts:15,34`.
- `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.4.6.json` → add `aspire-ps-13.5.3.json`;
  teardown tests run against both.
- `packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts:132` comment + sample.
- `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-normalize.ts` only if the 13.5
  envelope differs (S2 V5 decides).

## Boundaries

No adapter behaviour change unless a fixture diff forces it; if it does, the change is a separate
commit in this PR with its own test.

## Acceptance

- [ ] Every fixture file name carries the Aspire version it was captured from; a `README.md` in each
      fixtures folder states capture command + date + CLI version.
- [ ] `deno task test` for `packages/mcp`, `packages/telemetry`, `.llm/tools/agentic/teardown`
      green.
- [ ] `#413` receives a comment pointing at the 13.5.3 telemetry fixture (DDX-3 pins 13.4.6 today).

## Tests / gates

Scoped wrappers on `packages/mcp`, `packages/telemetry`; `quality:scan`; `arch:check`.

## Docs / static asset regeneration

`deno task gen:mcp-export-corpus` only if exports change (they should not);
`check:mcp-export-corpus`.

## Related

Part of #<epic>. Depends on S2 (V5). Related: #808, #413, #1668.
