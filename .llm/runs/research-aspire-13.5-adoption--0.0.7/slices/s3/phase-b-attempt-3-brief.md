# S3 Phase B — attempt 3 (same thread; host address gap closed by supervisor relay)

You are the S3 implementer for #1715 / PR #1741 (worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s3`, branch
`test/aspire-13-5-s3-fixture-recapture` @ `85bd4967`, push with the explicit refspec only). Your
phase-b brief and its contract are unchanged (`slices/s3/phase-b-brief.md`); this message supplies
the new host facts and the exact protocol. Do not launch evaluators or write `evaluate*.md`; do not
touch Docker resources you did not create.

## Host facts (supersede every earlier host paragraph)

- `netscript-dind` = `10.4.12.22`, Docker 28.5.2, `DOCKER_HOST=tcp://netscript-dind:2375` via
  `/home/agent/.local/bin/mise exec --`. `/home/agent` is bind-mounted identically into the dind:
  generated `DataPath` bind mounts now work — keep the scaffold defaults (no DataPath removal).
- DCP still publishes container ports on the dind's `127.0.0.1`. The **supervisor runs an
  owner-scoped relay** under the lease that makes each run-owned `127.0.0.1:<port>` reachable at
  `127.0.0.1:<port>` on this host within ~2 s of the container appearing. Proof:
  `receipts/preflight-relay-181818Z/` (postgres `Healthy`, web `/health` Healthy). Containers named
  `relay-*` and any process named `loopback-relay.ts` are the supervisor's: **never stop, remove, or
  report them as leaks** — list them under "foreign/supervisor-owned" in your receipt and leave them
  alone.
- `aspire start` performs a TypeScript check of the AppHost helpers that import `zod`; run
  `deno install` **at the generated project root** (creates root `node_modules/zod`, per
  `nodeModulesDir: auto`) before `aspire restore`/`aspire start`, or the start fails with
  `TS2307 zod` before any resource exists.
- `aspire wait`: target the container resource (`postgres-<id>`) or the database resource, **not**
  `netscript-db-postgres-*` — that is a command-only resource that stays `NotStarted` by design.

## Steps (single AppHost, one start, no retry)

1. Preflight verbatim into your worklog: `aspire ps` → `[]`; `docker ps -a` → empty (relay
   containers may appear only after your start). Record your own owner token: `s3-attempt-3`.
2. Scaffold the scratch under `.llm/tmp/` exactly as the phase-b brief says (postgres + service +
   workers so `health-check` exists), set the scratch `aspire/aspire.config.json` to the 13.5.3
   train (`sdk.version` 13.5.3, PostgreSQL/Redis 13.5.3, Browsers `13.5.3-preview.1.26425.3`),
   `deno install` at the scratch root, `aspire restore --apphost <apphost.mts>`.
3. `aspire start --apphost <apphost.mts> --isolated --non-interactive --nologo --format Json`;
   register the identity (appHostPath, appHostPid) in your run resource registry.
4. `aspire wait <postgres container resource> --timeout 120`, then the workers resource; trigger the
   `health-check` job per the README; capture the two envelopes from the dashboard URL reported by
   `aspire ps`; save them + fixture + test case; flip the parity row; run the Phase-A gate set.
5. Teardown: `aspire stop --apphost <exact path>`; remove **only** your persistent `postgres-<id>`
   survivor (created after your start time) and its same-second anonymous volume if any;
   `agentic:leak-check` (ignore `relay-*`); final `aspire ps` `[]`, containers = only `relay-*` or
   none, volumes 0, recorded verbatim; remove the scratch tree.
6. Commit by slice, push explicitly, comment on PR #1741 `## [PHASE: IMPL] S3 phase B`, and end with
   the teardown proof line. If the start or capture fails for any host reason: keep the exact error
   receipt, tear down, report — no workaround, no retry.
