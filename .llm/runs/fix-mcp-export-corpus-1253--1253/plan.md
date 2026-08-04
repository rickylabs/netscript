# Plan — #1253 MCP export corpus

## Goal

Make `search_exports` usable after release version bumps, expose the actual corpus build/load cause,
and prove both export and docs behavior through the same stdio boundary a scaffolded client uses.

## Decisions

| ID | Decision                                                                                                             |
| -- | -------------------------------------------------------------------------------------------------------------------- |
| D1 | Preserve strict package/corpus version parity; fix the release generator lifecycle instead of weakening integrity.   |
| D2 | Add `gen:mcp-export-corpus` immediately after version bump and stage its generated output in release preparation.    |
| D3 | Preserve bounded structured errors while including the thrown corpus cause in the message.                           |
| D4 | Add a real-scaffold stdio regression that runs the production CLI composition and calls both tools.                  |
| D5 | State and track the SDK prose corpus gap separately if the current scaffold composition cannot answer those queries. |

## Slices

1. Bootstrap run and draft PR.
2. Add RED release-lifecycle, diagnostic, and real-scaffold stdio tests.
3. Implement release regeneration/staging and diagnostic propagation.
4. Run focused MCP/release gates plus scoped static, doctrine, JSR, and lock checks.
5. Post acceptance evidence and transition the PR to ready.

## Stop rule

If the real-scaffold corpus requires a new documentation ingestion architecture rather than a
bounded export-corpus repair, keep this PR draft, record the finding, and track the docs gap rather
than expanding the fix.
