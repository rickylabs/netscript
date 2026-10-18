# Run resource leak report

Generated: 2026-10-18T09:21:34.347Z
Worktree: `/home/agent/projects/orchid/worktrees/issue-750`
Aspire probe: ok
Docker probe: ok
Volumes probe: ok
Networks probe: ok
Process probe: ok

## apphost: /home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts (pid 690643)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts' --non-interactive --nologo`

## container: postgres-bc86847f (83d0f20be63c980c2fea22115e7b0fff808a2fa574d0f16127efc0ec03dbb14b)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3536108722 ms
- Stale: true
- User command: `docker rm -f '83d0f20be63c980c2fea22115e7b0fff808a2fa574d0f16127efc0ec03dbb14b'`

## container: postgres-cb583538 (2e6a3e091c7fbbe0799fd5a3fa0e3970f26ce60a7b6d9535d9bebe4c762f7a17)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3844741871 ms
- Stale: true
- User command: `docker rm -f '2e6a3e091c7fbbe0799fd5a3fa0e3970f26ce60a7b6d9535d9bebe4c762f7a17'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-ab83cb1/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261018T064213817_detach-child_85b80f3556294450985d7cc7c1df6521.log --log-level None (pid 690573)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9560000 ms
- Stale: true
- User command: `kill -TERM '690573'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-ab83cb1/repo/aspire/.aspire/integrations/apphosts/33b926ba8ba9 (pid 690643)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9560000 ms
- Stale: true
- User command: `kill -TERM '690643'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 690643 --kubeconfig /ephemeral/tmp/aspire-dcpX6pt9F/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 692725)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9552000 ms
- Stale: true
- User command: `kill -TERM '692725'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpX6pt9F/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-vrfkhzic --monitor 692725 --monitor-identity-time 0001-01-11T17:35:40.670Z (pid 692813)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9552000 ms
- Stale: true
- User command: `kill -TERM '692813'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 692990 --child-identity-time 0001-01-11T17:35:41.100Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 692991)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '692991'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 693065)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '693065'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693065 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693070)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '693070'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693069 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693071)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '693071'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693066 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693072)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '693072'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 693067 --child-identity-time 0001-01-11T17:35:41.230Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693073)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9551000 ms
- Stale: true
- User command: `kill -TERM '693073'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID decadeff0bc690f59a945d30ab9197ecff0be8f7e7c378046739833c98d5a4e2 --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693662)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9550000 ms
- Stale: true
- User command: `kill -TERM '693662'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 81e1b8283ea4f855f54bdc615b8d0bb60c4bd152d34839ca007c839e26ac543b --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 693665)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9550000 ms
- Stale: true
- User command: `kill -TERM '693665'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699074 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699075)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699075'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699076 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699077)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699077'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699078 --child-identity-time 0001-01-11T17:36:37.160Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699084)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699084'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699085 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699089)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699089'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699088 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699091)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699091'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699086 --child-identity-time 0001-01-11T17:36:37.170Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699099)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699099'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699205 --child-identity-time 0001-01-11T17:36:37.200Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699206)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699206'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699207 --child-identity-time 0001-01-11T17:36:37.200Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699209)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699209'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 699214 --child-identity-time 0001-01-11T17:36:37.210Z --monitor 692813 --monitor-identity-time 0001-01-11T17:35:40.730Z (pid 699216)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9495000 ms
- Stale: true
- User command: `kill -TERM '699216'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 1879169)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 742244000 ms
- Stale: true
- User command: `kill -TERM '1879169'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 1880934)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 742240000 ms
- Stale: true
- User command: `kill -TERM '1880934'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 1987540)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '1987540'`
