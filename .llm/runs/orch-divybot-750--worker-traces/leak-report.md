# Run resource leak report

Generated: 2026-10-18T09:09:32.209Z
Worktree: `/home/agent/projects/orchid/worktrees/issue-750`
Aspire probe: ok
Docker probe: ok
Volumes probe: ok
Networks probe: ok
Process probe: ok

## apphost: /home/agent/projects/orchid/worktrees/issue-750/.llm/tmp/cli-e2e/plugin-smoke-20261018-110008/aspire/apphost.mts (pid 1847914)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/orchid/worktrees/issue-750/.llm/tmp/cli-e2e/plugin-smoke-20261018-110008/aspire/apphost.mts' --non-interactive --nologo`

## apphost: /home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts (pid 690643)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts' --non-interactive --nologo`

## container: garnet-hyzeapat (5bea377d7904d72f2cd0b93afe76e0aba63c630e34cd07010e904d367f363f6d)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 236926 ms
- Stale: false
- User command: `docker rm -f '5bea377d7904d72f2cd0b93afe76e0aba63c630e34cd07010e904d367f363f6d'`

## container: redis-uwjtadvb (97bda5082bd63ecb80b4922c9c606b607bf9cc9a831256461b28a39f2861a432)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: 236978 ms
- Stale: false
- User command: `docker rm -f '97bda5082bd63ecb80b4922c9c606b607bf9cc9a831256461b28a39f2861a432'`

## container: postgres-30bed50f (27e87254d264abcff5b381cde2794e4e5fb0032d5bbdffc24960435a7a65d4fe)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: 237006 ms
- Stale: false
- User command: `docker rm -f '27e87254d264abcff5b381cde2794e4e5fb0032d5bbdffc24960435a7a65d4fe'`

## container: postgres-bc86847f (83d0f20be63c980c2fea22115e7b0fff808a2fa574d0f16127efc0ec03dbb14b)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3535386584 ms
- Stale: true
- User command: `docker rm -f '83d0f20be63c980c2fea22115e7b0fff808a2fa574d0f16127efc0ec03dbb14b'`

## container: postgres-cb583538 (2e6a3e091c7fbbe0799fd5a3fa0e3970f26ce60a7b6d9535d9bebe4c762f7a17)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3844019733 ms
- Stale: true
- User command: `docker rm -f '2e6a3e091c7fbbe0799fd5a3fa0e3970f26ce60a7b6d9535d9bebe4c762f7a17'`

## volume: 936b68fbb1364695c12d97371037f05ae6892ed1735d9a8fbc37168522a6d790 (936b68fbb1364695c12d97371037f05ae6892ed1735d9a8fbc37168522a6d790)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 236209 ms
- Stale: false
- User command: `docker volume rm '936b68fbb1364695c12d97371037f05ae6892ed1735d9a8fbc37168522a6d790'`

## network: aspire-persistent-network-30bed50f-aspire-managed (c4af4ad7eb35b3f5bb1b21f2a99162e8daa35b26f6a75bce370a246faaac2626)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 238223 ms
- Stale: false
- User command: `docker network rm 'c4af4ad7eb35b3f5bb1b21f2a99162e8daa35b26f6a75bce370a246faaac2626'`
- At risk from upstream: yes
  Stopping the AppHost hands DCP-managed networks to DCP's abandoned-resource
  cleanup, which may remove a network this run did not create. Repo cleanup never
  removes networks; decide manually before any removal.

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261018T064213817_detach-child_85b80f3556294450985d7cc7c1df6521.log --log-level None (pid 690573)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8838000 ms
- Stale: true
- User command: `kill -TERM '690573'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-ab83cb1/repo/aspire/.aspire/integrations/apphosts/33b926ba8ba9 (pid 690643)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8837000 ms
- Stale: true
- User command: `kill -TERM '690643'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 690643 --kubeconfig /ephemeral/tmp/aspire-dcpX6pt9F/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 692725)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8830000 ms
- Stale: true
- User command: `kill -TERM '692725'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpX6pt9F/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-vrfkhzic --monitor 692725 --monitor-identity-time 0001-01-11T17:35:40.670Z (pid 692813)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8830000 ms
- Stale: true
- User command: `kill -TERM '692813'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 692990 --child-identity-time 0001-01-11T17:35:41.100Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 692991)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '692991'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 693065)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '693065'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693065 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693070)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '693070'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693069 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693071)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '693071'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693066 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693072)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '693072'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693067 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693073)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8829000 ms
- Stale: true
- User command: `kill -TERM '693073'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID decadeff0bc690f59a945d30ab9197ecff0be8f7e7c378046739833c98d5a4e2 --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693662)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8828000 ms
- Stale: true
- User command: `kill -TERM '693662'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 81e1b8283ea4f855f54bdc615b8d0bb60c4bd152d34839ca007c839e26ac543b --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693665)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8828000 ms
- Stale: true
- User command: `kill -TERM '693665'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699074 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699075)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699075'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699076 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699077)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699077'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699078 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699084)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699084'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699085 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699089)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699089'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699088 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699091)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699091'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699086 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699099)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699099'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699205 --child-identity-time 0001-01-11T17:36:37.200Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699206)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699206'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699207 --child-identity-time 0001-01-11T17:36:37.200Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699209)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699209'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699214 --child-identity-time 0001-01-11T17:36:37.210Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699216)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 8773000 ms
- Stale: true
- User command: `kill -TERM '699216'`

## process: /home/agent/.local/aspire/aspire run --non-interactive --apphost /home/agent/projects/orchid/worktrees/issue-750/.llm/tmp/cli-e2e/plugin-smoke-20261018-110008/aspire/apphost.mts --log-file /home/agent/.local/logs/cli_20261018T090525641_detach-child_ad14169cb2d24b77831442279919cf39.log --isolated (pid 1847895)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: 246000 ms
- Stale: false
- User command: `kill -TERM '1847895'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/orchid/worktrees/issue-750/.llm/tmp/cli-e2e/plugin-smoke-20261018-110008/aspire/.aspire/integrations/apphosts/3fb49f951933 (pid 1847914)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: 246000 ms
- Stale: false
- User command: `kill -TERM '1847914'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 1847914 --kubeconfig /ephemeral/tmp/aspire-dcp2v5cp0/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1849153)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 238000 ms
- Stale: false
- User command: `kill -TERM '1849153'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcp2v5cp0/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-zrurgfuj --monitor 1849153 --monitor-identity-time 0001-01-11T19:58:52.460Z (pid 1849186)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 238000 ms
- Stale: false
- User command: `kill -TERM '1849186'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849296 --child-identity-time 0001-01-11T19:58:52.980Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849306)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849306'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849335 --child-identity-time 0001-01-11T19:58:53.120Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849342)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849342'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849343 --child-identity-time 0001-01-11T19:58:53.130Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849344)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849344'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849346 --child-identity-time 0001-01-11T19:58:53.140Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849347)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849347'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849345 --child-identity-time 0001-01-11T19:58:53.140Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849348)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849348'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1849350)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849350'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849349 --child-identity-time 0001-01-11T19:58:53.140Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849351)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849351'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849350 --child-identity-time 0001-01-11T19:58:53.140Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849352)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849352'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1849438 --child-identity-time 0001-01-11T19:58:53.170Z --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849439)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 237000 ms
- Stale: false
- User command: `kill -TERM '1849439'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 97bda5082bd63ecb80b4922c9c606b607bf9cc9a831256461b28a39f2861a432 --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849881)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 235000 ms
- Stale: false
- User command: `kill -TERM '1849881'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 5bea377d7904d72f2cd0b93afe76e0aba63c630e34cd07010e904d367f363f6d --monitor 1849186 --monitor-identity-time 0001-01-11T19:58:52.530Z (pid 1849977)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 235000 ms
- Stale: false
- User command: `kill -TERM '1849977'`

## process: /home/agent/.local/aspire/aspire describe --follow --format Json --apphost /home/agent/projects/orchid/worktrees/issue-750/.llm/tmp/cli-e2e/plugin-smoke-20261018-110008/aspire/apphost.mts --non-interactive --nologo (pid 1850045)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/orchid/worktrees/issue-750`
- Age: 235000 ms
- Stale: false
- User command: `kill -TERM '1850045'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 1879169)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 741521000 ms
- Stale: true
- User command: `kill -TERM '1879169'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 1880934)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 741518000 ms
- Stale: true
- User command: `kill -TERM '1880934'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 1884720)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '1884720'`
