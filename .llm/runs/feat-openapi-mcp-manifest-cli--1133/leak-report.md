# Run resource leak report

Generated: 2026-08-04T11:21:49.172Z
Worktree: `/home/codex/repos/ns005-s7`
Aspire probe: ok
Docker probe: ok

## container: postgres-d76868c4 (bdd5011afacb1dee73ccc19e6e3c59661845edf1410c8853783c568754f80a29)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 656794 ms
- Stale: false
- User command: `docker rm -f 'bdd5011afacb1dee73ccc19e6e3c59661845edf1410c8853783c568754f80a29'`

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 4927778 ms
- Stale: false
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`

