# Research

## Re-baseline

- Baseline is `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
- The package export map and existing four-row Entrypoints table match exactly.
- `parseDocContent()` recognizes this table shape only beneath `## Exports` or `## Sub-path exports`.
- Doctrine verdict: Archetype 3, Keep. This docs-only run does not mutate package architecture.

## Symbol coverage evidence

`deno doc --json` was run independently for all four published modules and compared with backtick identifiers in the tables of each dedicated section.

- root: 51 actual, 51 table identifiers, 0 missing.
- SSE: 33 actual, 12 table identifiers, 21 missing: `BindStreamEventSourceOptionsV1`, `Operation`, `StreamSchemaIssue`, `StreamSchemaValidationOptions`, `StreamSchemaValidationResult`, `StreamSseChangeHeadersV1`, `StreamSseChangeV1`, `StreamSseConsumerEventNameV1`, `StreamSseConsumerEventV1`, `StreamSseContractV1`, `StreamSseControlPayloadV1`, `StreamSseDataPayloadV1`, `StreamSseErrorCodeV1`, `StreamSseErrorPayloadV1`, `StreamSseHeartbeatPayloadV1`, `StreamSseParseInputV1`, `StreamSseParseResultV1`, `StreamSseReductionV1`, `StreamSseSchemaV1`, `StreamSseWireEventNameV1`, `StreamSseWireFrameV1`.
- telemetry: 33 actual, 0 table identifiers; its section is prose-only.
- testing: 4 actual, 0 table identifiers; its section is prose-only.

Conclusion: `entrypoints-only` is the honest policy. Expanding symbol tables is explicitly out of scope.

## Open questions

None.
