# S9 — coordinator classification amendment (send after the cycle-2 turn)

The bounded S9 correction is **exact-payload fail-closed matching**, not shape A/B choice:

- RED the exact hosted -32603 **full** message including the period and suffix:
  `The Aspire Dashboard is not available in the running AppHost. The dashboard must be enabled to use MCP tools. Ensure your AppHost is configured with the dashboard enabled (this is the default configuration).`
- The dashboard-unavailable detector must match **code `-32603` plus the exact full 13.5.3
  payload** fail-closed. Negatives required: truncated message, changed suffix, wrong code, and
  the same message on a **non-dashboard tool** — each must NOT be treated as the documented
  degraded outcome (they fail the gate). The current `b9f4d30b` fixture's truncated message is
  insufficient.
- The degrade must cover every tools/call site that can legitimately receive this error in a
  headless AppHost (your cycle-2 finding: `list_resources` was uncovered), while `initialize` +
  `tools/list` assertions (surface/visibility/redaction) always run.
- Scoped gates as before; push onto your current branch head; PR #1759 comment; final line = head
  SHA. No PLAN-EVAL; no unchanged retry.
