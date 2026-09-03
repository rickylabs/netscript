# D-240 — S8-free SQLite listener control

## Verdict

**BLOCKED — no SQLite ownership verdict.** The S8-free tier did not reach
`runtime.health.listener-unreachable`; it failed at the preceding `runtime.wait.garnet` gate. The
target gate's baseline `Promise.all` therefore never executed, so this run cannot say whether
`garnet omitted healthReports.test_only_garnet_resp` would appear there. Neither “pre-existing” nor
“S8-owned” is supported by this control.

Runtime work stopped after the canonical suite's cleanup changed the protected host baseline. No
repair, second runtime pass, hosted Phase B run, evaluator dispatch, or `evaluate.md` was produced.

## S8-free head

The control used freshly fetched `origin/main` at
`60ae56af0144644db00b0e2fdc28986919ee12ee` in a detached checkout of this same worktree. It is
S8-free because the S8-owned Phase-B verifier is absent:

```text
60ae56af0144644db00b0e2fdc28986919ee12ee
S8_MARKER_ABSENT cat-file_exit=128
```

The exact check was:

```text
git cat-file -e 60ae56af0144644db00b0e2fdc28986919ee12ee:packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts
```

The worktree was clean before detaching and was returned to
`feat/aspire-13-5-s8-typed-resource-commands` afterward. No rebase occurred.

## Control invocation

The long suite ran in a managed detached execution session with a polled log, an explicit remote
Docker host, a unique worktree-local smoke root, and normal exact-AppHost cleanup:

```text
DOCKER_HOST=tcp://netscript-dind:2375 /home/agent/.local/bin/mise exec -- deno task e2e:cli run scaffold.runtime.sqlite --cleanup --format pretty --smoke-root /home/agent/projects/netscript/worktrees/007-s8-recon/.llm/tmp/d240-control/smoke --name d240-s8-free-sqlite --report /home/agent/projects/netscript/worktrees/007-s8-recon/.llm/tmp/d240-control/report.json --log-file /home/agent/projects/netscript/worktrees/007-s8-recon/.llm/tmp/d240-control/events.ndjson
```

The checked-in main lifecycle script invoked
`aspire start --isolated --non-interactive --apphost <exact path>`. The exact AppHost was:

```text
/home/agent/projects/netscript/worktrees/007-s8-recon/.llm/tmp/d240-control/smoke/d240-s8-free-sqlite/aspire/apphost.mts
```

## Gate output

The suite's own output is decisive about reachability:

```text
> runtime.wait.garnet: Wait for garnet listener health
  FAILED 300316ms
    Command exited 1; expected 0.
    error: Uncaught (in promise) Error: aspire wait garnet --status healthy --timeout 300 --apphost /home/agent/projects/netscript/worktrees/007-s8-recon/.llm/tmp/d240-control/smoke/d240-s8-free-sqlite/aspire/apphost.mts --non-interactive --nologo failed (17): ❌ Timed out waiting for resource 'garnet' to be healthy after 300s.
    📄 See logs at /home/agent/projects/netscript/.aspire/logs/cli_20260901T052724_c9f07ae8.log
    🔍 See AppHost logs at /home/agent/projects/netscript/.aspire/logs/cli_20260901T052716920_detach-child_24d45c1258e146e38ba678e5c0c1230e.log
        throw new Error(`aspire ${args.join(' ')} failed (${result.code}): ${stderr || stdout}`);
              ^
        at runAspire (file:///home/agent/projects/netscript/worktrees/007-s8-recon/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts:85:11)
        at async verifyListenerReadiness (file:///home/agent/projects/netscript/worktrees/007-s8-recon/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts:43:3)
        at async file:///home/agent/projects/netscript/worktrees/007-s8-recon/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts:123:3
> cleanup.aspire-stop: Stop generated Aspire AppHost
  PASSED 549ms
Summary: passed=42 failed=1 skipped=0
```

There is no `> runtime.health.listener-unreachable` line in either the pretty log or NDJSON event
stream. The target gate did not start.

## Pre-target health observation

A read-only `aspire describe` during the blocked wait reported:

```text
"healthStatus": "Unhealthy",
"healthReports": {
  "garnet_resp": {
    "status": "Unhealthy",
    "description": "RESP listener unreachable: ETIMEDOUT"
  },
  "test_only_garnet_resp": {
    "status": "Healthy",
    "description": "RESP listener ready on localhost:18999"
  }
}
```

This proves only the state during `runtime.wait.garnet`. It is not the target gate's baseline
`Promise.all`, so it is not substituted for the requested decisive evidence.

The prior D-100 two-hop relay implementation was recovered verbatim into ignored `.llm/tmp` after
the failed wait, with both extracted files matching their Git blob IDs at commit `1840ff959`. The
relay was **not started** because the post-cleanup baseline check had already failed.

## Baseline before the suite

Immediately before the control:

```text
aspire ps --format Json
[]
docker ps -aq
docker volume ls -q
d33e5c2e561d7b67619051bce7af005eaae9d5f8ca21f0b7352c36ea486bbaa2
docker network ls
NETWORK ID     NAME                                                DRIVER    SCOPE
da17c2b0272a   aspire-persistent-network-581c13b7-aspire-managed   bridge    local
aac626180bda   bridge                                              bridge    local
34fb0583d79c   host                                                host      local
43950b90a3c3   none                                                null      local
```

The protected identities were:

```text
volume d33e5c2e561d7b67619051bce7af005eaae9d5f8ca21f0b7352c36ea486bbaa2 created 2026-08-31T16:19:59Z
network da17c2b0272a06b910272927fa06938bdbdb54fcf9a27ef9e25968a64692f1da created 2026-08-31T16:37:29.44834407Z creator PID 2743257
```

## Post-cleanup state and lease break

The suite's exact-AppHost cleanup passed, but the subsequent raw baseline check showed that the
protected custom network had been removed and a new anonymous volume had been left behind. No
manual Docker removal command was run.

The new volume is:

```text
Name: 90d704b4be20244540f4785e866c28c91c41812cc33b9e5cc4dff5f6845ef63f
CreatedAt: 2026-09-01T05:27:23Z
Labels: com.docker.volume.anonymous
```

The protected anonymous volume remains identifiable by its original name and creation time. The
protected network lookup now returns:

```text
[]
Error response from daemon: network aspire-persistent-network-581c13b7-aspire-managed not found
```

The final four required commands therefore do **not** satisfy the requested baseline:

```text
$ aspire ps --format Json
[]
```

```text
$ docker ps -aq
```

```text
$ docker volume ls -q
90d704b4be20244540f4785e866c28c91c41812cc33b9e5cc4dff5f6845ef63f
d33e5c2e561d7b67619051bce7af005eaae9d5f8ca21f0b7352c36ea486bbaa2
```

```text
$ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
aac626180bda   bridge    bridge    local
34fb0583d79c   host      host      local
43950b90a3c3   none      null      local
```

The protected network was not recreated, and the new anonymous volume was not force-removed,
because neither action could restore the foreign baseline unchanged and the volume carries no
positive ownership label.

## Read-only reporter

```text
Task agentic:leak-check deno run --no-lock --allow-read --allow-write --allow-run .llm/tools/agentic/teardown/leak-check.ts '--' '--slice-dir' '/home/agent/projects/netscript/worktrees/007-s8-recon/.llm/runs/feat-aspire-13-5-s8-typed-resource-commands--impl' '--worktree' '/home/agent/projects/netscript/worktrees/007-s8-recon'
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-01T05:37:52.446Z",
  "worktreeRoot": "/home/agent/projects/netscript/worktrees/007-s8-recon",
  "probes": {
    "aspire": {
      "state": "ok"
    },
    "docker": {
      "state": "ok"
    }
  },
  "survivors": []
}
```

The reporter does not inventory anonymous volumes or absent networks; its empty survivor list does
not override the raw Docker evidence above.
