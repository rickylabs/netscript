# Run resource leak report

Generated: 2026-08-05T08:49:00.085Z
Worktree: `/home/codex/repos/ns005-cachetiers`
Aspire probe: ok
Docker probe: ok

## apphost: /home/codex/repos/w6-planning-board/w6-board/aspire/apphost.mts (pid 973901)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/w6-planning-board/w6-board/aspire/apphost.mts' --non-interactive --nologo`

## apphost: /home/codex/repos/w6-planning-board/w6-board/aspire/db-operation/apphost.mts (pid 931458)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/w6-planning-board/w6-board/aspire/db-operation/apphost.mts' --non-interactive --nologo`

## apphost: /home/codex/repos/ns005-genjobs/.llm/tmp/cli-e2e/plugin-smoke-20260805-104503/aspire/apphost.mts (pid 1342028)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-genjobs`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/ns005-genjobs/.llm/tmp/cli-e2e/plugin-smoke-20260805-104503/aspire/apphost.mts' --non-interactive --nologo`

## container: redis-kksrknpt (9ae1cf5846260ecf9e0b582f4752f41003720940048385147cb90db70a89ae56)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-genjobs`
- Age: 69060 ms
- Stale: false
- User command: `docker rm -f '9ae1cf5846260ecf9e0b582f4752f41003720940048385147cb90db70a89ae56'`

## container: garnet-kugfwccw (a40bd44e6ee24abb93da123bb897b62aa4a23a902c0c5b7b663408142c46dc82)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 69065 ms
- Stale: false
- User command: `docker rm -f 'a40bd44e6ee24abb93da123bb897b62aa4a23a902c0c5b7b663408142c46dc82'`

## container: postgres-dfb7c516 (cba9c2abc76acec8fb38ec326ec68b0551c9b3fd41fceb5fc49f569276d94849)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-genjobs`
- Age: 148343 ms
- Stale: false
- User command: `docker rm -f 'cba9c2abc76acec8fb38ec326ec68b0551c9b3fd41fceb5fc49f569276d94849'`

## container: postgres-fff7ba2a (96c60d5d19c7e0e975b03a91f0c966afc00191e768c30d92f792baf237b3b282)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-genjobs`
- Age: 15941204 ms
- Stale: true
- User command: `docker rm -f '96c60d5d19c7e0e975b03a91f0c966afc00191e768c30d92f792baf237b3b282'`

## container: postgres-2419c932 (55c0ae9dab8db064c1cec240d0a403c161b23de363497aae85237ffae6dbf49b)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-genjobs`
- Age: 16827535 ms
- Stale: true
- User command: `docker rm -f '55c0ae9dab8db064c1cec240d0a403c161b23de363497aae85237ffae6dbf49b'`

## container: redis-mrgwgwbw (bb5da1615b3a2f4f3819ea499ffbee83ba11f0ee250a38bff5a415c85842cc52)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: 21058901 ms
- Stale: true
- User command: `docker rm -f 'bb5da1615b3a2f4f3819ea499ffbee83ba11f0ee250a38bff5a415c85842cc52'`

## container: redis-hpnzrwdm (2694c4590f7185d689cba50924d2806eb7321248228e892d0c7ee86152cc0dfc)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: 21900004 ms
- Stale: true
- User command: `docker rm -f '2694c4590f7185d689cba50924d2806eb7321248228e892d0c7ee86152cc0dfc'`

## container: postgres-750e2409 (2925ecf64bcc298052eacce42c88a4f1068e491dccf05fb1b065db7453f84c02)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: 21924720 ms
- Stale: true
- User command: `docker rm -f '2925ecf64bcc298052eacce42c88a4f1068e491dccf05fb1b065db7453f84c02'`

## container: postgres-45ba5b03 (ad7befdea9bd4d7d29fc16bfb716147830a7a9a52614e5b20a7ef4e83ff27c1f)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/w6-planning-board`
- Age: 22001563 ms
- Stale: true
- User command: `docker rm -f 'ad7befdea9bd4d7d29fc16bfb716147830a7a9a52614e5b20a7ef4e83ff27c1f'`

## container: postgres-fa65160a (5b62715e4e85aa1097a3fd85fbd911568f47dad0f8e9b9dd933f19c4f781ad5b)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 25195587 ms
- Stale: true
- User command: `docker rm -f '5b62715e4e85aa1097a3fd85fbd911568f47dad0f8e9b9dd933f19c4f781ad5b'`

## container: postgres-94cd7cfd (1435604a30f544c4e39c607a316a898d9842ecd097a86e6ce812cb6610cfd3b3)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-streamdb`
- Age: 37663601 ms
- Stale: true
- User command: `docker rm -f '1435604a30f544c4e39c607a316a898d9842ecd097a86e6ce812cb6610cfd3b3'`

## container: postgres-93884070 (7697c820d060f8afd530152a510211b9306492a2c95923c9aeb246f3e7961c1a)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 42588893 ms
- Stale: true
- User command: `docker rm -f '7697c820d060f8afd530152a510211b9306492a2c95923c9aeb246f3e7961c1a'`

## container: postgres-8054dc67 (ee823623d01dc5125183bf281239270c92f0811dbabed9d890b574e3572cdbe0)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-streamdb`
- Age: 44175837 ms
- Stale: true
- User command: `docker rm -f 'ee823623d01dc5125183bf281239270c92f0811dbabed9d890b574e3572cdbe0'`

## container: postgres-9d3ee45d (02f021f00d4c8d5fb075452ff2254f043d0da3255f3d53104b82111665694241)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-streamdb`
- Age: 44320755 ms
- Stale: true
- User command: `docker rm -f '02f021f00d4c8d5fb075452ff2254f043d0da3255f3d53104b82111665694241'`

## container: postgres-36532bdb (cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 56201102 ms
- Stale: true
- User command: `docker rm -f 'cce0d06ff6cabad921c69b154a0bf8d857a19b8e2c085275a2292d1426545edc'`

## container: postgres-c189562b (8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-verify1250`
- Age: 56416723 ms
- Stale: true
- User command: `docker rm -f '8f6d81c711c9ec2b7da67001844d9a9238b5ba8ae867627a8b7a8bddbd100aa5'`

## container: postgres-89449635 (97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave5-deepseek`
- Age: 82158691 ms
- Stale: true
- User command: `docker rm -f '97b90646098858f6cfe163b470fb9d57ff7033d5661f6fe2390c9300ff1ebaec'`

