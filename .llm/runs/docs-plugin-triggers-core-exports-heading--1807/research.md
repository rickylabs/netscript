# Research

## Baseline

- Re-baselined against `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
- `packages/plugin-triggers-core/deno.json` publishes the root plus eleven subpaths, exactly matching the existing twelve-row table.
- `parseDocContent()` recognizes that table shape under `## Exports` or `## Sub-path exports`, but the page used `## Entrypoints`.
- Doctrine classifies `packages/plugin-triggers-core` as Archetype 3, verdict **Keep**. No package source change is needed.

## Symbol coverage evidence

Each published module was inspected independently with `deno doc --json`; names came from the entry module node's `symbols`, excluding `default`. Documentation matching was page-wide to account for shared re-exports.

| Entrypoint | Exports | Undocumented anywhere |
| --- | ---: | ---: |
| root | 106 | 0 |
| `/public` | 106 | 0 |
| `/builders` | 50 | 0 |
| `/domain` | 69 | 25 |
| `/ports` | 80 | 8 |
| `/runtime` | 97 | 3 |
| `/adapters` | 28 | 20 |
| `/stores` | 40 | 21 |
| `/config` | 17 | 16 |
| `/contracts/v1` | 35 | 33 |
| `/telemetry` | 37 | 29 |
| `/testing` | 79 | 20 |

The deduplicated union contains 270 real exports and 157 names absent from the page. Representative substantial omissions are domain defaults/errors, defer/clock ports, adapter and KV store implementations, config and contract schemas, telemetry contracts, and testing doubles. Therefore `symbolCoverage.mode: 'entrypoints-only'` is required; `complete` would be inaccurate.

## Open questions

None. The mode is resolved by measured evidence.
