# Infra handoff — `ai-agents` ↔ `netscript-dind` topology (accepted boundary, D-55)

**Problem (proven 2026-08-30 13:50Z on the repaired host: tini PID 1, Docker 28.5.2, inotify
1024):** the remote `netscript-dind` daemon (`10.4.12.19`) cannot see `ai-agents` (`10.4.12.18`)
worktree paths, and ports it publishes on its own loopback are unreachable from `ai-agents`.
Aspire/DCP needs both (bind-mounted `.data/<resource>` dirs; `127.0.0.1:<port>` dialling), so **no
AppHost can boot its backing services from `ai-agents`** (D-42 / D-43 / D-55).

## Required topology (any one)

1. **Shared network namespace + identical-path bind (preferred):** run `ai-agents` and
   `netscript-dind` in one network namespace (e.g. `network_mode: service:netscript-dind` or the
   reverse) **and** bind `/home/agent/projects/netscript/worktrees` into `netscript-dind` at the
   identical absolute path (read-write).
2. **Local daemon:** a Docker daemon (socket) inside `ai-agents` with `DOCKER_HOST` unset/local.
3. **Off-host:** run every AppHost-boot gate (Phase B for S3/S6/S7/S8/S9/S10, `scaffold.runtime`) in
   CI (`e2e-cli.yml`) or on a host with local Docker; `ai-agents` stays static-only.

## Acceptance probes (both must pass from `ai-agents`, exactly as written)

```bash
# 1 — bind-mount visibility: must list the worktree (entries > 0), not an empty dir
docker run --rm -v /home/agent/projects/netscript/worktrees/007-aspire-s10:/probe alpine:3 \
  sh -c 'echo "entries=$(ls /probe | wc -l)"'

# 2 — loopback locality: a port published on the daemon host must answer on 127.0.0.1 here
docker run -d --rm --name topo-probe -p 127.0.0.1::8080 alpine:3 \
  sh -c 'while true; do printf "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok" | nc -l -p 8080; done'
PORT=$(docker port topo-probe 8080/tcp | head -1 | awk -F: '{print $NF}')
curl -s --max-time 3 http://127.0.0.1:$PORT   # must print: ok
docker stop -t 1 topo-probe; docker rmi alpine:3
```

Current results (D-55): probe 1 → `entries=0`; probe 2 → `curl` exit 7 / `Connection refused` (`ok`
only from inside the dind netns). After the change, `aspire ps` must still read `[]` and
`docker ps -a` empty; then the Aspire supervisor requests one serialized Phase-B lease for the
closest S10/S9/S8 leaf.
