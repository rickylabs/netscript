# Run resource leak report

Generated: 2026-10-07T19:51:51.142Z
Worktree: `<worktree>`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: <operator-home>/projects/deploy-85d15ee/repo/aspire/apphost.ts (pid 992)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '<operator-home>/projects/deploy-85d15ee/repo/aspire/apphost.ts' --non-interactive --nologo`

## process: <operator-home>/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost <operator-home>/projects/deploy-85d15ee/repo/aspire/apphost.ts --log-file <operator-home>/.aspire/logs/cli_20261007T130942030_detach-child_4040e64870284f47b08ec39befdd0c33.log (pid 973)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24128000 ms
- Stale: true
- User command: `kill -TERM '973'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot <operator-home>/projects/deploy-85d15ee/repo/aspire/.aspire/integrations/apphosts/6d028ea97706 (pid 992)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24128000 ms
- Stale: true
- User command: `kill -TERM '992'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 992 --kubeconfig <ephemeral>/tmp/aspire-dcpVYBKDG/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file <operator-home>/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file <operator-home>/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1329)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1329'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig <ephemeral>/tmp/aspire-dcpVYBKDG/kubeconfig --notification-socket <operator-home>/.cache/dcp/dcp-notify-sock-pclwfutb --monitor 1329 --monitor-identity-time 0001-01-01T00:03:08.100Z (pid 1359)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1359'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1479 --child-identity-time 0001-01-01T00:03:08.530Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1481)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1481'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1539 --child-identity-time 0001-01-01T00:03:08.630Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1541)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1541'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1538 --child-identity-time 0001-01-01T00:03:08.630Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1543)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1543'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1544)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1544'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1544 --child-identity-time 0001-01-01T00:03:08.630Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1547)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1547'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1548 --child-identity-time 0001-01-01T00:03:08.630Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1560)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1560'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1564 --child-identity-time 0001-01-01T00:03:08.640Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 1572)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24121000 ms
- Stale: true
- User command: `kill -TERM '1572'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID d6cda5669d01fbb0abb33ee4749766497233cb0dcad82867975f7a808e02cb81 --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 2116)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24116000 ms
- Stale: true
- User command: `kill -TERM '2116'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID f4d6b3caab3a23cd25c9b2f8dea5fbe47693a9e7ed3246c0bfcbd20d293c71d4 --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 2212)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24115000 ms
- Stale: true
- User command: `kill -TERM '2212'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 25975 --child-identity-time 0001-01-01T00:03:30.260Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 25976)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24099000 ms
- Stale: true
- User command: `kill -TERM '25976'`

## process: <operator-home>/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 25974 --child-identity-time 0001-01-01T00:03:30.260Z --monitor 1359 --monitor-identity-time 0001-01-01T00:03:08.170Z (pid 25977)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 24099000 ms
- Stale: true
- User command: `kill -TERM '25977'`

## process: <operator-home>/.local/aspire/aspire ps --format Json (pid 2173155)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '2173155'`
