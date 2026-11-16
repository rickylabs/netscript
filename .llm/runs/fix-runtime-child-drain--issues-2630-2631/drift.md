# Drift

- Owner-selected existing implementation session uses Sol xhigh. All subsequent eval routes follow the pinned matrix with session/family independence.
- Current main exposes explicit service hostname options, not the environment convention claimed by #2631. Reuse native hostname option and document this evidence.
- Deno KV alone is not a process-retaining handle in this environment; use real Redis sockets to test the reported lifecycle failure.

- S2 file scope expands from 12 to 17 (<30): embedded signal tests must opt out of process termination, and new cleanup contract tests follow type definition. No acceptance weakened.
- T3 requires a new delegate for each review/re-check; cycle two used the same selected model/route with the full prior verdict carried in its brief instead of re-steering the prior session. Session/family independence remained intact.
