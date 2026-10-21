# Run resource leak report

Generated: 2026-10-21T17:28:48.109Z
Worktree: `/home/agent/projects/orchid/worktrees/issue-752`
Aspire probe: ok
Docker probe: failed — docker ps failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Volumes probe: failed — docker volume ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Networks probe: failed — docker network ls failed (1): Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Process probe: ok

## apphost: /home/agent/projects/deploy-d3327a7/repo/aspire/apphost.ts (pid 985207)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/deploy-d3327a7/repo/aspire/apphost.ts' --non-interactive --nologo`

## apphost: /home/agent/projects/llm-bench/runs/2026-10-21-benchv2/dsv41flash-r2/notes/aspire/apphost.mts (pid 1272163)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/llm-bench/runs/2026-10-21-benchv2/dsv41flash-r2/notes/aspire/apphost.mts' --non-interactive --nologo`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire agent mcp (pid 947188)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 3962000 ms
- Stale: false
- User command: `kill -TERM '947188'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire run --non-interactive --apphost /home/agent/projects/deploy-d3327a7/repo/aspire/apphost.ts --log-file /home/agent/.aspire/logs/cli_20261021T071451020_detach-child_b5c4654eb2084c87bb9c833e19ade2c1.log --log-level None (pid 985126)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36836000 ms
- Stale: true
- User command: `kill -TERM '985126'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/deploy-d3327a7/repo/aspire/.aspire/integrations/apphosts/8d13af2b7470 (pid 985207)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36836000 ms
- Stale: true
- User command: `kill -TERM '985207'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 985207 --kubeconfig /ephemeral/tmp/aspire-dcpCcmkeC/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 986632)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36829000 ms
- Stale: true
- User command: `kill -TERM '986632'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /ephemeral/tmp/aspire-dcpCcmkeC/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-ipkiyvii --monitor 986632 --monitor-identity-time 0001-01-14T18:08:17.760Z (pid 986669)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36829000 ms
- Stale: true
- User command: `kill -TERM '986669'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 986805 --child-identity-time 0001-01-14T18:08:18.210Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 986806)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986806'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 986937 --child-identity-time 0001-01-14T18:08:18.320Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 986938)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986938'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 986939)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986939'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 986939 --child-identity-time 0001-01-14T18:08:18.330Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 986952)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986952'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 986953 --child-identity-time 0001-01-14T18:08:18.330Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 986955)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986955'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 986951 --child-identity-time 0001-01-14T18:08:18.330Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 986960)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36828000 ms
- Stale: true
- User command: `kill -TERM '986960'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 906c2d68301cc85f1c2821bf5c68a7b2c973843255c9419d6ad541991df532c5 --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 987669)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36826000 ms
- Stale: true
- User command: `kill -TERM '987669'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID 0cf039fc7d3d43d89bd1062aaa149bd3b641a18d0a0c9f0c7b4c8c4b965bd58d --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 987728)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36826000 ms
- Stale: true
- User command: `kill -TERM '987728'`

## process: /home/agent/.local/share/mise/installs/aspire/13.5.3/aspire describe --follow --apphost /home/agent/projects/deploy-d3327a7/repo/aspire/apphost.ts --format Json --non-interactive --nologo (pid 989573)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36776000 ms
- Stale: true
- User command: `kill -TERM '989573'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992565 --child-identity-time 0001-01-14T18:10:17.190Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992566)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992566'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992580 --child-identity-time 0001-01-14T18:10:17.200Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992582)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992582'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992581 --child-identity-time 0001-01-14T18:10:17.200Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992583)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992583'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992584 --child-identity-time 0001-01-14T18:10:17.200Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992585)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992585'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992586 --child-identity-time 0001-01-14T18:10:17.200Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992602)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992602'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992631 --child-identity-time 0001-01-14T18:10:17.210Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992637)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992637'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992661 --child-identity-time 0001-01-14T18:10:17.230Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992665)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992665'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992696 --child-identity-time 0001-01-14T18:10:17.240Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992698)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992698'`

## process: /home/agent/.aspire/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 992660 --child-identity-time 0001-01-14T18:10:17.230Z --monitor 986669 --monitor-identity-time 0001-01-14T18:08:17.840Z (pid 992717)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 36709000 ms
- Stale: true
- User command: `kill -TERM '992717'`

## process: /home/agent/.local/aspire/aspire run --non-interactive --apphost /home/agent/projects/llm-bench/runs/2026-10-21-benchv2/dsv41flash-r2/notes/aspire/apphost.mts --log-file /home/agent/.local/logs/cli_20261021T165648622_detach-child_68845addf7ff45cdb8b2afa43f11d501.log --isolated (pid 1272079)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1919000 ms
- Stale: false
- User command: `kill -TERM '1272079'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/llm-bench/runs/2026-10-21-benchv2/dsv41flash-r2/notes/aspire/.aspire/integrations/apphosts/53f411b2b690 (pid 1272163)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1919000 ms
- Stale: false
- User command: `kill -TERM '1272163'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 1272163 --kubeconfig /home/agent/.cache/tmpexec/aspire-dcploW6aI/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 1273125)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273125'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /home/agent/.cache/tmpexec/aspire-dcploW6aI/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-ivvdjzzb --monitor 1273125 --monitor-identity-time 0001-01-15T03:50:15.080Z (pid 1273155)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273155'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1273268 --child-identity-time 0001-01-15T03:50:15.510Z --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1273270)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273270'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1273322 --child-identity-time 0001-01-15T03:50:15.620Z --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1273325)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273325'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1273324 --child-identity-time 0001-01-15T03:50:15.620Z --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1273326)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273326'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 1273349)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273349'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1273349 --child-identity-time 0001-01-15T03:50:15.630Z --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1273354)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1911000 ms
- Stale: false
- User command: `kill -TERM '1273354'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-container --containerID a96a2a747116440d6c2bd4f150c880fff8b7c40d22b27f42edb48a8593fc3e91 --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1274240)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 1907000 ms
- Stale: false
- User command: `kill -TERM '1274240'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 1694004 --child-identity-time 0001-01-15T04:16:16.180Z --monitor 1273155 --monitor-identity-time 0001-01-15T03:50:15.150Z (pid 1694005)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 350000 ms
- Stale: false
- User command: `kill -TERM '1694005'`

## process: /home/agent/.local/aspire/aspire agent mcp (pid 1706527)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 289000 ms
- Stale: false
- User command: `kill -TERM '1706527'`

## process: /home/agent/.local/aspire/aspire ps --format Json (pid 1766576)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 0 ms
- Stale: false
- User command: `kill -TERM '1766576'`

## process: /home/agent/.local/aspire/aspire run --non-interactive --apphost /home/agent/projects/llm-bench/runs/2026-10-21-benchv2/coder-r2/notes/aspire/apphost.mts --log-file /home/agent/.local/logs/cli_20261021T115958050_detach-child_dbb00d09e5174edca3f8f20f99485fd9.log --isolated (pid 2866677)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19729000 ms
- Stale: true
- User command: `kill -TERM '2866677'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed server --contentRoot /home/agent/projects/llm-bench/runs/2026-10-21-benchv2/coder-r2/notes/aspire/.aspire/integrations/apphosts/45f4ec39e5f9 (pid 2866755)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19729000 ms
- Stale: true
- User command: `kill -TERM '2866755'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp start-apiserver --monitor 2866755 --kubeconfig /home/agent/.cache/tmpexec/aspire-dcpl6Q81b/kubeconfig --tls-cert-thumbprint B61BC460D594D5C0EF406F52A03D4577A49D1DFC --tls-cert-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.crt --tls-key-file /home/agent/.aspire/dev-certs/https/6F03282E49E0C2CE1D973527276E709279C362F311F2F0A59C955B8F2174A329.key (pid 2868818)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19722000 ms
- Stale: true
- User command: `kill -TERM '2868818'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp run-controllers --kubeconfig /home/agent/.cache/tmpexec/aspire-dcpl6Q81b/kubeconfig --notification-socket /home/agent/.cache/dcp/dcp-notify-sock-lsvqnosb --monitor 2868818 --monitor-identity-time 0001-01-14T22:53:24.500Z (pid 2868848)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19722000 ms
- Stale: true
- User command: `kill -TERM '2868848'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 2868963 --child-identity-time 0001-01-14T22:53:24.940Z --monitor 2868848 --monitor-identity-time 0001-01-14T22:53:24.560Z (pid 2868964)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19721000 ms
- Stale: true
- User command: `kill -TERM '2868964'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 2869009 --child-identity-time 0001-01-14T22:53:25.050Z --monitor 2868848 --monitor-identity-time 0001-01-14T22:53:24.560Z (pid 2869011)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19721000 ms
- Stale: true
- User command: `kill -TERM '2869011'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 2869008 --child-identity-time 0001-01-14T22:53:25.050Z --monitor 2868848 --monitor-identity-time 0001-01-14T22:53:24.560Z (pid 2869012)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19721000 ms
- Stale: true
- User command: `kill -TERM '2869012'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/managed/aspire-managed dashboard (pid 2869041)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19721000 ms
- Stale: true
- User command: `kill -TERM '2869041'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 2869041 --child-identity-time 0001-01-14T22:53:25.060Z --monitor 2868848 --monitor-identity-time 0001-01-14T22:53:24.560Z (pid 2869042)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19721000 ms
- Stale: true
- User command: `kill -TERM '2869042'`

## process: /home/agent/.local/versions/13.5.3_b5f143315ffb6968ea939a9978797a5b20e4c688-9c44730df5df187c/dcp/dcp monitor-process --child 2871062 --child-identity-time 0001-01-14T22:53:35.300Z --monitor 2868848 --monitor-identity-time 0001-01-14T22:53:24.560Z (pid 2871065)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 19711000 ms
- Stale: true
- User command: `kill -TERM '2871065'`

