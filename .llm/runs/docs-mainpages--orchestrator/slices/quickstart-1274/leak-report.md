# Run resource leak report

Generated: 2026-08-04T20:06:02.776Z
Worktree: `/home/codex/repos/ns-quickstart`
Aspire probe: ok
Docker probe: ok

## container: postgres-36532bdb (cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 10423793 ms
- Stale: true
- User command: `docker rm -f 'cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc'`

## container: postgres-c189562b (8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 10639414 ms
- Stale: true
- User command: `docker rm -f '8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5'`

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 36381382 ms
- Stale: true
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`

