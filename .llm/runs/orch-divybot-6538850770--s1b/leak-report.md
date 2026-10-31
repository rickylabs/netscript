# Run resource leak report

Generated: 2026-10-31T04:35:27.638Z
Worktree: `.`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: <other-checkout>/aspire/apphost.ts (pid 16489)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '<other-checkout>/aspire/apphost.ts' --non-interactive --nologo`

## process: ~/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost <other-checkout>/aspire/apphost.ts --log-file ~/.aspire/logs/cli_20261030T134822689_detach-child_a3ea6c08c8fb4b8c8c6f7d6d391f43aa.log --log-level None (pid 16208)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53224000 ms
- Stale: true
- User command: `kill -TERM '16208'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot <other-checkout>/aspire/.aspire/integrations/apphosts/13e4b0554594 (pid 16489)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53224000 ms
- Stale: true
- User command: `kill -TERM '16489'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 16489 --kubeconfig $TMPDIR/aspire-dcp5HacM7/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file ~/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file ~/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 18684)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53215000 ms
- Stale: true
- User command: `kill -TERM '18684'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig $TMPDIR/aspire-dcp5HacM7/kubeconfig --notification-socket ~/.cache/dcp/dcp-notify-sock-pnplazop --monitor 18684 --monitor-identity-time 0001-01-01T00:12:14.300Z (pid 18839)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53215000 ms
- Stale: true
- User command: `kill -TERM '18839'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 19095 --child-identity-time 0001-01-01T00:12:14.820Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 19096)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19096'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 19186 --child-identity-time 0001-01-01T00:12:14.940Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 19187)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19187'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 19194)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19194'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 19193 --child-identity-time 0001-01-01T00:12:14.950Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 19195)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19195'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 19194 --child-identity-time 0001-01-01T00:12:14.950Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 19198)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19198'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 19197 --child-identity-time 0001-01-01T00:12:14.950Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 19199)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53214000 ms
- Stale: true
- User command: `kill -TERM '19199'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 35c6b1e8fe8fc768bd0eac82014406adea09ff2ac58d22d4fb6e8195ea7584e0 --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 20040)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53211000 ms
- Stale: true
- User command: `kill -TERM '20040'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 604b96b02fbb77a8bf67d5e8ff6f65bb0871465322548f2ed4676edc560bd08c --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 20121)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53211000 ms
- Stale: true
- User command: `kill -TERM '20121'`

## process: ~/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost <other-checkout>/aspire/apphost.ts --format Json --non-interactive --nologo (pid 29792)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53165000 ms
- Stale: true
- User command: `kill -TERM '29792'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38716 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38717)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38717'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38718 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38720)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38720'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38719 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38722)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38722'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38721 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38723)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38723'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38724 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38730)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38730'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38728 --child-identity-time 0001-01-01T00:14:08.490Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38747)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38747'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38794 --child-identity-time 0001-01-01T00:14:08.500Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38796)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38796'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38833 --child-identity-time 0001-01-01T00:14:08.520Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38836)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38836'`

## process: ~/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 38832 --child-identity-time 0001-01-01T00:14:08.520Z --monitor 18839 --monitor-identity-time 0001-01-01T00:12:14.390Z (pid 38859)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 53100000 ms
- Stale: true
- User command: `kill -TERM '38859'`

## process: ~/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 3765632)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 49000 ms
- Stale: false
- User command: `kill -TERM '3765632'`

## process: ~/.local/aspire/aspire ps --format Json (pid 3779418)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '3779418'`

