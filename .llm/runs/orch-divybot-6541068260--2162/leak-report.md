# Run resource leak report

Generated: 2026-10-31T09:05:41.937Z
Worktree: `/home/agent/projects/orchid/worktrees/issue-6541068260`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts (pid 28504)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts' --non-interactive --nologo`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261031T080259528_detach-child_65f93b39b5f142838cf699f20465b915.log --log-level None (pid 28484)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3761000 ms
- Stale: false
- User command: `kill -TERM '28484'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-6b5dc26/repo/aspire/.aspire/integrations/apphosts/84a421cd1fc9 (pid 28504)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3760000 ms
- Stale: false
- User command: `kill -TERM '28504'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 28504 --kubeconfig /ephemeral/tmp/aspire-dcpMO1fZw/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 29105)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29105'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpMO1fZw/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-geunbppo --monitor 29105 --monitor-identity-time 0001-01-01T00:08:47.750Z (pid 29131)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29131'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 29244 --child-identity-time 0001-01-01T00:08:48.230Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29255)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29255'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 29283)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29283'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 29281 --child-identity-time 0001-01-01T00:08:48.370Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29284)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29284'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 29285 --child-identity-time 0001-01-01T00:08:48.380Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29286)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29286'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 29282 --child-identity-time 0001-01-01T00:08:48.380Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29287)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29287'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 29283 --child-identity-time 0001-01-01T00:08:48.380Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29290)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3751000 ms
- Stale: false
- User command: `kill -TERM '29290'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 5679d71219d8e5a07d0a816ce663df6339cf048c9af20a2901b03cb014dae069 --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29590)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3748000 ms
- Stale: false
- User command: `kill -TERM '29590'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID cb815669d11ef5768c1dfd8b47949000058a85c18661b1735a7212f7170d72ef --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 29647)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3748000 ms
- Stale: false
- User command: `kill -TERM '29647'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost /home/agent/projects/deploy-6b5dc26/repo/aspire/apphost.ts --format Json --non-interactive --nologo (pid 34314)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3702000 ms
- Stale: false
- User command: `kill -TERM '34314'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39616 --child-identity-time 0001-01-01T00:10:41.970Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39618)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39618'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39617 --child-identity-time 0001-01-01T00:10:41.970Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39619)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39619'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39620 --child-identity-time 0001-01-01T00:10:41.980Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39624)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39624'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39621 --child-identity-time 0001-01-01T00:10:41.980Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39633)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39633'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39636 --child-identity-time 0001-01-01T00:10:41.980Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39639)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39639'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39635 --child-identity-time 0001-01-01T00:10:41.980Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39673)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39673'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39692 --child-identity-time 0001-01-01T00:10:41.990Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39701)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39701'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39708 --child-identity-time 0001-01-01T00:10:42.000Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39714)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39714'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 39704 --child-identity-time 0001-01-01T00:10:41.990Z --monitor 29131 --monitor-identity-time 0001-01-01T00:08:47.850Z (pid 39715)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3637000 ms
- Stale: false
- User command: `kill -TERM '39715'`

## process: aspire ps --format Json --non-interactive --nologo (pid 814886)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '814886'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 815041)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '815041'`

