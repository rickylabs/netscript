# Run resource leak report

Generated: 2026-08-04T11:33:37.195Z
Worktree: `/home/codex/repos/ns005-export`
Aspire probe: ok
Docker probe: ok

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 5635801 ms
- Stale: false
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`
