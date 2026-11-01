# Run resource leak report

Generated: 2026-11-01T18:42:04.031Z
Worktree: `.`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-c84d4dd-r2/repo/aspire/apphost.ts (pid 1726785)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-c84d4dd-r2/repo/aspire/apphost.ts' --non-interactive --nologo`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 423894)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '423894'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-c84d4dd-r2/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261101T160351306_detach-child_79f36d776100475a9c1ef551c6ce264f.log --log-level None (pid 1726716)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9492000 ms
- Stale: true
- User command: `kill -TERM '1726716'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-c84d4dd-r2/repo/aspire/.aspire/integrations/apphosts/3480035d817c (pid 1726785)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9492000 ms
- Stale: true
- User command: `kill -TERM '1726785'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 1726785 --kubeconfig /ephemeral/tmp/aspire-dcpvUc1Gi/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1728958)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9484000 ms
- Stale: true
- User command: `kill -TERM '1728958'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpvUc1Gi/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-vjoxxmtm --monitor 1728958 --monitor-identity-time 0001-01-02T08:09:37.670Z (pid 1728991)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9484000 ms
- Stale: true
- User command: `kill -TERM '1728991'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1729177 --child-identity-time 0001-01-02T08:09:38.120Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729181)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729181'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1729214 --child-identity-time 0001-01-02T08:09:38.250Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729216)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729216'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1729215 --child-identity-time 0001-01-02T08:09:38.250Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729222)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729222'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1729240)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729240'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1729240 --child-identity-time 0001-01-02T08:09:38.260Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729241)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729241'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1729239 --child-identity-time 0001-01-02T08:09:38.260Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729242)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9483000 ms
- Stale: true
- User command: `kill -TERM '1729242'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 315ae03d7b962395f1260372ca65065936fd4039c9371967a98a0d977c8c1e42 --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729914)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9482000 ms
- Stale: true
- User command: `kill -TERM '1729914'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID a51f01745954737a458709ea2f6cc2c1c1e6b9d8dbc53f5c89551ddf6dd18b54 --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1729942)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9482000 ms
- Stale: true
- User command: `kill -TERM '1729942'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost /home/agent/projects/deploy-c84d4dd-r2/repo/aspire/apphost.ts --format Json --non-interactive --nologo (pid 1742986)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9432000 ms
- Stale: true
- User command: `kill -TERM '1742986'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757565 --child-identity-time 0001-01-02T08:11:31.840Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757566)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757566'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757580 --child-identity-time 0001-01-02T08:11:31.850Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757581)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757581'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757583 --child-identity-time 0001-01-02T08:11:31.860Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757584)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757584'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757582 --child-identity-time 0001-01-02T08:11:31.860Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757595)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757595'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757620 --child-identity-time 0001-01-02T08:11:31.860Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757624)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757624'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757625 --child-identity-time 0001-01-02T08:11:31.870Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757627)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757627'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757631 --child-identity-time 0001-01-02T08:11:31.870Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757633)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757633'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757651 --child-identity-time 0001-01-02T08:11:31.880Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757669)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757669'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1757668 --child-identity-time 0001-01-02T08:11:31.880Z --monitor 1728991 --monitor-identity-time 0001-01-02T08:09:37.750Z (pid 1757671)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 9369000 ms
- Stale: true
- User command: `kill -TERM '1757671'`

