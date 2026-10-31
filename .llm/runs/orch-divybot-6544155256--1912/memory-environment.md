# 2026-10-31 — Environment and workflow dispatch

Deno 2.9.7, gh, and Claude are installed. RTK and a connected memory tool are absent; use focused commands and read prior run memory. NetScript MCP find_guidance then search_docs were consulted.

Existing production smoke is Ubuntu-only but already registered for workflow_dispatch. Extend that existing workflow with an opt-in Windows parity job instead of adding a new workflow unavailable for dispatch before merge. Keep its ordinary production release path unchanged.

Owner directives explicitly require Refs (no closing keyword) and no taxonomy edits, overriding generic dispatcher defaults. Final canonical issue report is queued by atomic rename of excluded `.divybot-final-report.tmp` to `.divybot-final-report.md`, not posted through gh.
