# Run resource leak report

Generated: 2026-08-04T20:40:59.916Z
Worktree: `/home/codex/repos/ns005-streamdb`
Aspire probe: ok
Docker probe: ok

## container: postgres-8054dc67 (ee823623d01dc5125183bf281239270c92f0811dbabed9d890b574e3572cdbe0)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-streamdb`
- Age: 495668 ms
- Stale: false
- User command: `docker rm -f 'ee823623d01dc5125183bf281239270c92f0811dbabed9d890b574e3572cdbe0'`

## container: postgres-9d3ee45d (02f021f00d4c8d5fb075452ff2254f043d0da3255f3d53104b82111665694241)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-streamdb`
- Age: 640586 ms
- Stale: false
- User command: `docker rm -f '02f021f00d4c8d5fb075452ff2254f043d0da3255f3d53104b82111665694241'`

## container: postgres-36532bdb (cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 12520933 ms
- Stale: true
- User command: `docker rm -f 'cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc'`

## container: postgres-c189562b (8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 12736554 ms
- Stale: true
- User command: `docker rm -f '8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5'`

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 38478522 ms
- Stale: true
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`

