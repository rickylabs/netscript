# Drift

- Owner-selected existing implementation session uses Sol xhigh. All subsequent eval routes follow the pinned matrix with session/family independence.
- Current main exposes explicit service hostname options, not the environment convention claimed by #2631. Reuse native hostname option and document this evidence.
- Deno KV alone is not a process-retaining handle in this environment; use real Redis sockets to test the reported lifecycle failure.
