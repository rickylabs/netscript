# Run resource leak report

Generated: 2026-11-27T15:15:29.457Z
Worktree: `.`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-observe-uncompressed-20261113/repo/aspire/apphost.ts (pid 1205066)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-observe-uncompressed-20261113/repo/aspire/apphost.ts' --non-interactive --nologo`

## apphost: /home/agent/projects/ledgerline/worktrees/runtime-integration-009/aspire/apphost.mts (pid 3002477)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/ledgerline/worktrees/runtime-integration-009/aspire/apphost.mts' --non-interactive --nologo`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-observe-uncompressed-20261113/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261117T135431777_detach-child_b3bf92bd5d9b4476860800a10bece02c.log --log-level None (pid 1205030)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868857000 ms
- Stale: true
- User command: `kill -TERM '1205030'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-observe-uncompressed-20261113/repo/aspire/.aspire/integrations/apphosts/eecc879081a3 (pid 1205066)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868857000 ms
- Stale: true
- User command: `kill -TERM '1205066'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 1205066 --kubeconfig /ephemeral/tmp/aspire-dcpieuYDW/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1205545)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205545'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpieuYDW/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-gnwwmgtw --monitor 1205545 --monitor-identity-time 0001-01-05T16:43:34.500Z (pid 1205574)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205574'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1205673 --child-identity-time 0001-01-05T16:43:34.930Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1205675)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205675'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1205723 --child-identity-time 0001-01-05T16:43:35.050Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1205724)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205724'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1205735)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205735'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1205734 --child-identity-time 0001-01-05T16:43:35.050Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1205737)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205737'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1205735 --child-identity-time 0001-01-05T16:43:35.050Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1205738)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205738'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1205736 --child-identity-time 0001-01-05T16:43:35.050Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1205739)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868849000 ms
- Stale: true
- User command: `kill -TERM '1205739'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 847b361d4bb7b1e25686876112ac3f68565abb144b462a568b538ab74229acd2 --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1206018)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868847000 ms
- Stale: true
- User command: `kill -TERM '1206018'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID a2608145ab0f9cdca31b7530a43aa40768a2dd5aa7664af5810c467d4c5ec313 --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1206052)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 868847000 ms
- Stale: true
- User command: `kill -TERM '1206052'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1390190 --child-identity-time 0001-01-05T17:51:49.910Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1390191)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864754000 ms
- Stale: true
- User command: `kill -TERM '1390191'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393876 --child-identity-time 0001-01-05T17:52:56.510Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393877)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393877'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393892 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393895)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393895'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393894 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393896)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393896'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393893 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393897)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393897'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393901 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393904)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393904'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393903 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393947)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393947'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393902 --child-identity-time 0001-01-05T17:52:56.520Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1393962)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1393962'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1393997 --child-identity-time 0001-01-05T17:52:56.560Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1394001)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1394001'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1394000 --child-identity-time 0001-01-05T17:52:56.560Z --monitor 1205574 --monitor-identity-time 0001-01-05T16:43:34.570Z (pid 1394029)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 864687000 ms
- Stale: true
- User command: `kill -TERM '1394029'`

## process: /home/agent/.local/aspire/aspire run --non-interactive --apphost /home/agent/projects/ledgerline/worktrees/runtime-integration-009/aspire/apphost.mts --log-file /home/agent/.local/logs/cli_20261116T055840623_detach-child_3612ff6c86cd4cd893662989be462b8e.log --isolated (pid 3002451)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983808000 ms
- Stale: true
- User command: `kill -TERM '3002451'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/ledgerline/worktrees/runtime-integration-009/aspire/.aspire/integrations/apphosts/7b435bcfee49 (pid 3002477)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983808000 ms
- Stale: true
- User command: `kill -TERM '3002477'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 3002477 --kubeconfig /tmp/aspire-dcpTcp2vr/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 3003176)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003176'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /tmp/aspire-dcpTcp2vr/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-szjzuxfh --monitor 3003176 --monitor-identity-time 0001-01-04T08:47:44.510Z (pid 3003249)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003249'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 3003386)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003386'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 3003386 --child-identity-time 0001-01-04T08:47:45.090Z --monitor 3003249 --monitor-identity-time 0001-01-04T08:47:44.580Z (pid 3003408)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003408'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 3003385 --child-identity-time 0001-01-04T08:47:45.090Z --monitor 3003249 --monitor-identity-time 0001-01-04T08:47:44.580Z (pid 3003409)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003409'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 3003411 --child-identity-time 0001-01-04T08:47:45.100Z --monitor 3003249 --monitor-identity-time 0001-01-04T08:47:44.580Z (pid 3003413)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003413'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 3003410 --child-identity-time 0001-01-04T08:47:45.100Z --monitor 3003249 --monitor-identity-time 0001-01-04T08:47:44.580Z (pid 3003415)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983799000 ms
- Stale: true
- User command: `kill -TERM '3003415'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 3003771 --child-identity-time 0001-01-04T08:47:47.470Z --monitor 3003249 --monitor-identity-time 0001-01-04T08:47:44.580Z (pid 3003772)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 983796000 ms
- Stale: true
- User command: `kill -TERM '3003772'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 3063241)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '3063241'`

