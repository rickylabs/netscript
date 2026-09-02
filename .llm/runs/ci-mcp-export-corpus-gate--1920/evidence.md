# Evidence — #1920 MCP export-corpus CI gate

All command verdicts record the child command's real exit code using
`out=$(command); rc=$?`; no verdict is derived from a pipeline.

## Baseline

- Branch: `ci/mcp-export-corpus-gate`
- Base: `ec848e6b0334ec8fcd2bc66ba009305d35367b01`
- Initial tree: clean
- `deno task check:mcp-export-corpus`: `REAL_EXIT=1`; emitted
  `MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus`.

## Determinism

All three generations ran while Git `HEAD` remained the exact pinned base. The run artifacts were
uncommitted and do not participate in corpus discovery.

| Environment | Generator exit | Generated-file SHA-256 | Payload SHA-256 | Subpaths | Symbols |
| --- | ---: | --- | --- | ---: | ---: |
| Warm cache 1 | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |
| Warm cache 2 | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |
| Pristine `DENO_DIR=/ephemeral/tmp/tmp.pTbHbGV0Gg` | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |

- Warm repeat byte equality: `true`.
- Warm/pristine byte equality: `true`.
- Generator provenance also agrees on framework `0.0.6`, 35 packages, 2,185,819 uncompressed
  bytes, and 316,584 compressed bytes.
- The task-owned pristine cache was not deleted because repository policy forbids cache deletion
  without approval.

## Trigger path

Pending.

## CI YAML parse

Pending.

## Teeth

Pending.

## Required validation

Pending.

## Hygiene and final identity

Pending.
