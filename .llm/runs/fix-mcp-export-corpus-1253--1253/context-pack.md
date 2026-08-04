# Context Pack — #1253

## State

- Branch: `fix/mcp-export-corpus-1253`
- Baseline: `3a267aef17c251350a3e842699119e98365316f4`
- Route: openai / gpt-5.6-sol / medium (owner-fixed)
- Phase: composed plan evaluation; bootstrap ready to commit

## Root cause

Release preparation bumps and regenerates `MCP_PACKAGE_VERSION` but omits the version-pinned export
corpus. Canary.7 therefore ships an expected version of canary.7 with corpus provenance/payload
0.0.4. The strict adapter rejects it and the flow hides the cause.

## Next

1. Commit bootstrap and open the required draft PR.
2. Add failing release lifecycle, diagnostic, and real-scaffold stdio coverage.
3. Implement and validate the bounded repair.
