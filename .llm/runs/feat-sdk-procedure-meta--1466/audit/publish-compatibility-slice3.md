# Slice 3 publish and compatibility evidence

- Date: 2026-08-30
- Content head: `9ab779ce96f0ae282afe96ad3efaa5146a2bf428`
- Workspace publish receipt: `receipts/publish-dry-run-final.json`

## Publish dry-runs

| Scope | Command | Result |
| --- | --- | --- |
| Workspace | canonical `deno task publish:dry-run` (drives the workspace `deno publish --dry-run` simulation with catalog materialization) | PASS, exit 0, attempt 9 at the content head |
| `@netscript/contracts` | `deno publish --dry-run --allow-dirty` from `packages/contracts` | PASS, exit 0; 4 entrypoints checked twice; 21 published files; `Success Dry run complete` |
| `@netscript/sdk` | `deno publish --dry-run --allow-dirty` from `packages/sdk` | PASS, exit 0; 12 entrypoints checked twice; 60 published files; `Success Dry run complete` |

## Isolated declarations

The root `deno.json` has `compilerOptions.isolatedDeclarations: true`. Neither member overrides
that option. With that inherited setting active, the root structured `check` receipt passes and the
two direct member dry-runs above check every public entrypoint, run the public-API slow-type pass,
and complete successfully. The checked entrypoint counts are the members' exact export-map counts:
4 for contracts and 12 for SDK. This is the executable isolated-declaration proof; no package
configuration disables the bar.

## Export maps and exact NetScript pins

`@netscript/contracts` exports:

- `.` -> `./mod.ts`
- `./crud` -> `./crud.ts`
- `./query` -> `./query.ts`
- `./transform` -> `./transform.ts`

It has no `@netscript/*` import pins.

`@netscript/sdk` exports:

- `.` -> `./mod.ts`
- `./auto-update` -> `./src/auto-update/mod.ts`
- `./desktop` -> `./src/desktop/mod.ts`
- `./cache` -> `./src/cache/mod.ts`
- `./client` -> `./src/client/mod.ts`
- `./collections` -> `./src/collections/mod.ts`
- `./discovery` -> `./src/discovery/mod.ts`
- `./ports` -> `./src/ports/mod.ts`
- `./query` -> `./src/query/mod.ts`
- `./query-client` -> `./src/query-client/mod.ts`
- `./streams` -> `./src/streams.ts`
- `./telemetry` -> `./src/telemetry/mod.ts`

Its only `@netscript/*` pin is exact:
`@netscript/service = jsr:@netscript/service@0.0.6`.

## JSR audit findings

The machine reports are `audit/contracts.json` and `audit/sdk.json`; both commands exit 0 and both
report `slowTypes.ok: true`.

- Contracts: one INFO only — the sanctioned oRPC slow-types banner for an allowlisted package.
- SDK: two WARN findings, reported without changing the audit threshold or source:
  1. `F-DOCT-5 cardinality`: `src/` has 13 immediate children; doctrine cap is 12.
  2. `F-JSR-7 slow-types`: `Checking for slow types in the public API...`.
- Neither member has a FAIL finding.

The SDK WARNs are existing package-level findings, not a slice-3 adjustment or waiver. They are
carried to Tier-A exactly as emitted, per the brief's rule that every WARN or FAIL is a finding to
report.

## Documentation publish bar

The full 16-entrypoint `deno doc --lint` receipt remains baseline-red with the exact R-1 set of 12.
The structured member reports contain 9 contracts and 3 SDK `private-type-ref` findings, with zero
`missing-jsdoc` and zero other findings. `audit/public-doc-lint-slice3.txt` records set identity.
