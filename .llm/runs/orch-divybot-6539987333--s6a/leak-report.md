# Run resource leak report

Generated: 2026-10-31T06:39:10.147Z
Worktree: `.`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts (pid 684269)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts' --non-interactive --nologo`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261031T053803994_detach-child_8168e62a76da43e1a949b50efb77c070.log --log-level None (pid 684221)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3665000 ms
- Stale: false
- User command: `kill -TERM '684221'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-6b5dc26/repo/aspire/.aspire/integrations/apphosts/84a421cd1fc9 (pid 684269)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3665000 ms
- Stale: false
- User command: `kill -TERM '684269'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 684269 --kubeconfig /ephemeral/tmp/aspire-dcpa9jUHU/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 687020)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687020'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpa9jUHU/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-qdgbcqud --monitor 687020 --monitor-identity-time 0001-01-01T16:01:54.940Z (pid 687106)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687106'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 687339 --child-identity-time 0001-01-01T16:01:55.410Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 687340)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687340'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 687382 --child-identity-time 0001-01-01T16:01:55.550Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 687395)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687395'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 687415)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687415'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 687394 --child-identity-time 0001-01-01T16:01:55.550Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 687416)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687416'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 687415 --child-identity-time 0001-01-01T16:01:55.560Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 687418)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687418'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 687414 --child-identity-time 0001-01-01T16:01:55.560Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 687419)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3656000 ms
- Stale: false
- User command: `kill -TERM '687419'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID f3a4b3f307bc1e6e3e8cf5f40f1ac7f13d7009a2701cf729a38dd3e5f02617aa --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 688016)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3654000 ms
- Stale: false
- User command: `kill -TERM '688016'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID b723b1a87d493fd8dc35d7140ee1ca00dfbaed902e818d5812fbbfc7e20d0811 --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 688096)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3654000 ms
- Stale: false
- User command: `kill -TERM '688096'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts --format Json --non-interactive --nologo (pid 700779)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3605000 ms
- Stale: false
- User command: `kill -TERM '700779'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715067 --child-identity-time 0001-01-01T16:03:49.120Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715068)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715068'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715074 --child-identity-time 0001-01-01T16:03:49.130Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715075)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715075'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715071 --child-identity-time 0001-01-01T16:03:49.120Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715077)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715077'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715076 --child-identity-time 0001-01-01T16:03:49.130Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715078)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715078'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715072 --child-identity-time 0001-01-01T16:03:49.120Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715086)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715086'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715105 --child-identity-time 0001-01-01T16:03:49.130Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715128)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715128'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715150 --child-identity-time 0001-01-01T16:03:49.140Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715160)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715160'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715180 --child-identity-time 0001-01-01T16:03:49.160Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715182)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715182'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 715188 --child-identity-time 0001-01-01T16:03:49.160Z --monitor 687106 --monitor-identity-time 0001-01-01T16:01:55.030Z (pid 715195)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3542000 ms
- Stale: false
- User command: `kill -TERM '715195'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 1775885)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '1775885'`

