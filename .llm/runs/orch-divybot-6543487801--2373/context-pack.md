# Context

PR #2528 CI repair in progress. Original head 2d9be85 has independent exact-head PASS and all KV proof, but quality failed at check:mcp-export-corpus. Canonical regeneration changes only the kv ./testing documentation row, solely to reflect the intentional JSDoc change. No KV test bytes changed and 20+4 stress evidence remains valid. Next: gate/MCP tests, commit/push, same-session final evaluation of new head and verify remote CI. Coordinator owns merge; no labels/milestones mutation.
