# Run resource leak report

Generated: 2026-10-28T13:49:20.962Z
Worktree: `.`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-d1b07d9/repo/aspire/apphost.ts (pid 1729263)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-d1b07d9/repo/aspire/apphost.ts' --non-interactive --nologo`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-d1b07d9/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261023T224104843_detach-child_f0c6bd4e273f418f8cb468512abe8dad.log --log-level None (pid 1729190)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400095000 ms
- Stale: true
- User command: `kill -TERM '1729190'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-d1b07d9/repo/aspire/.aspire/integrations/apphosts/c0b224152298 (pid 1729263)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400095000 ms
- Stale: true
- User command: `kill -TERM '1729263'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 1729263 --kubeconfig /ephemeral/tmp/aspire-dcp9BnlUl/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1730196)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730196'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcp9BnlUl/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-eceexeko --monitor 1730196 --monitor-identity-time 0001-01-17T09:34:31.750Z (pid 1730234)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730234'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1730341 --child-identity-time 0001-01-17T09:34:32.200Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730342)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730342'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1730377 --child-identity-time 0001-01-17T09:34:32.300Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730378)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730378'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1730376 --child-identity-time 0001-01-17T09:34:32.300Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730393)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730393'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1730395)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730395'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1730395 --child-identity-time 0001-01-17T09:34:32.310Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730399)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730399'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1730394 --child-identity-time 0001-01-17T09:34:32.310Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730401)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400087000 ms
- Stale: true
- User command: `kill -TERM '1730401'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 0dbb08435d7bb46076ec51a628922a8f32e86dcd203b79dafed2e3ad2902f642 --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730663)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400085000 ms
- Stale: true
- User command: `kill -TERM '1730663'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 749440d9616d40a82ddf8aeecc7770e43855456ed1418920929a48c8124170af --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1730723)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 400085000 ms
- Stale: true
- User command: `kill -TERM '1730723'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734035 --child-identity-time 0001-01-17T09:36:26.500Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734036)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734036'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734037 --child-identity-time 0001-01-17T09:36:26.510Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734038)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734038'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734049 --child-identity-time 0001-01-17T09:36:26.510Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734050)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734050'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734051 --child-identity-time 0001-01-17T09:36:26.510Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734054)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734054'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734052 --child-identity-time 0001-01-17T09:36:26.510Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734061)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734061'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734053 --child-identity-time 0001-01-17T09:36:26.510Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734104)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734104'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734120 --child-identity-time 0001-01-17T09:36:26.530Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734121)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734121'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734122 --child-identity-time 0001-01-17T09:36:26.530Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734123)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734123'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1734119 --child-identity-time 0001-01-17T09:36:26.530Z --monitor 1730234 --monitor-identity-time 0001-01-17T09:34:31.830Z (pid 1734135)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 399973000 ms
- Stale: true
- User command: `kill -TERM '1734135'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost /home/agent/projects/deploy-d1b07d9/repo/aspire/apphost.ts --format Json --non-interactive --nologo (pid 2484924)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 174514000 ms
- Stale: true
- User command: `kill -TERM '2484924'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 3584921)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '3584921'`

