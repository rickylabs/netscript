# Run resource leak report

Generated: 2026-08-11T04:57:00.593Z
Worktree: `/home/codex/repos/ns-1443-plugin-ai-orchestrator`
Aspire probe: ok
Docker probe: ok

## container: postgres-c044bf21 (92a41c1be2ce5dc838b1a928722f87e86fbe67a5f2f87eba27743a1b1c305aba)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns-1443-plugin-ai-orchestrator`
- Age: 90377 ms
- Stale: false
- User command: `docker rm -f '92a41c1be2ce5dc838b1a928722f87e86fbe67a5f2f87eba27743a1b1c305aba'`

## container: redis-jfgcbtaf (48c4411a5072b277021396e0acf1dc7666bd44626a1b5ee82d4d7ac169dbd3e4)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-review-desk`
- Age: 433429113 ms
- Stale: true
- User command: `docker rm -f '48c4411a5072b277021396e0acf1dc7666bd44626a1b5ee82d4d7ac169dbd3e4'`

