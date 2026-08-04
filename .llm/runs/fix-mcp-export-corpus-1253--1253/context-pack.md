# Context Pack — #1253

## State

- Branch: `fix/mcp-export-corpus-1253`
- Baseline: `3a267aef17c251350a3e842699119e98365316f4`
- Route: openai / gpt-5.6-sol / medium (owner-fixed)
- Phase: implementation verified; ready for PR evidence and readiness transition

## Root cause

Release preparation bumps and regenerates `MCP_PACKAGE_VERSION` but omits the version-pinned export
corpus. Canary.7 therefore ships an expected version of canary.7 with corpus provenance/payload
0.0.4. The strict adapter rejects it and the flow hides the cause.

## Next

1. Commit and explicitly push the verified implementation.
2. Post acceptance evidence and mark PR ready.
3. Hand the completed three-PR onboarding lane to the milestone orchestrator.

## Delivered behavior

- Release preparation regenerates and stages the version-pinned corpus after every bump.
- `export_corpus_error` includes the bounded adapter failure cause.
- The real scaffold/CLI stdio test invokes `search_docs` and `search_exports`.
- SDK prose coverage is separately tracked in #1260.
