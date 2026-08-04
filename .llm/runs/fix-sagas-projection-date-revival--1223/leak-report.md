# Run resource leak report

Generated: 2026-08-04T12:16:46.016Z Worktree: `/home/codex/repos/ns005-sagas` Aspire probe: ok
Docker probe: ok

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 8224622 ms
- Stale: true
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`
