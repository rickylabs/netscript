use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`. You are the
Codex · GPT-5.6 Sol · medium implementation thread for **S1 (#1713 / PR #1727) convergence gate
correction**. Worktree `/home/agent/projects/netscript/worktrees/007-aspire-s1`, branch
`chore/aspire-13-5-s1-pin-bump` @ `38c3e9e181bf` (frozen on main `52a881c58842`; upstream unset —
push only with `git push origin HEAD:refs/heads/chore/aspire-13-5-s1-pin-bump`). **No runtime, no
AppHost, no containers, no evaluators, no `evaluate*.md`, no CI dispatch.**

## Evidence

Hosted `e2e-cli.yml` run 33328727942 at `38c3e9e181bf`: static, desktop, SQLite/Garnet tiers
PASS; PostgreSQL tier **67 PASS / 1 FAIL** at `behavior.live-db-endpoint`
(`packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts:67`):
`consecutive AppHost starts reused the same database allocation: postgres://localhost:12074`.
All database init/migrate/generate/seed, waits, health, workers/MCP gates and cleanup passed.

## Adjudication (coordinator, official sources)

Aspire 13.5 change log "Consistent port allocation for proxyless endpoints"
(https://github.com/microsoft/aspire/wiki/13.5-Change-log): deterministic assignments are persisted
for persistent resources; persistent-lifetime docs (https://aspire.dev/app-host/persistent-containers/):
persistent resources reuse the same instance and a **stable local endpoint across AppHost
restarts**. Equality of the first/second Postgres allocation is therefore **expected 13.5
behaviour**, not a product failure. The gate's inequality requirement (pre-S1 code from #1393/#1654)
is obsolete on 13.5.

## Required change (bounded gate correction — do not weaken the gate)

1. Remove the `first.postgresUrl === second.postgresUrl` inequality throw. Replace it with proof
   that the **second live endpoint is actually observed and used**: the second receipt's
   `postgresUrl` must equal the endpoint the running AppHost currently reports (read it live from
   `aspire describe --format Json` / `aspire ps` for the Postgres resource on the *second* start,
   not from any receipt), the users service `/health` must prove readiness against it, and the
   telemetry correlation (`pollUsersTelemetryCorrelation`) must still succeed. Equality with the
   first allocation is allowed; assert `assertDatabaseAuthority` on both as today.
2. Add a **negative stale/literal endpoint case**: if the second receipt's URL is a literal/stale
   endpoint that the live AppHost does not report (e.g. the first-start URL when the second start
   reports a different port, or a hard-coded `postgres://localhost:5432`), the gate must fail with
   a precise message. RED first, then GREEN, as unit tests of the pure comparison/decision
   function (extract it from the script so it is testable without an AppHost); fixtures shaped
   like the 13.5.3 `describe` JSON (real capture available at
   `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/receipts/preflight-relay-181818Z/07-describe-after-wait.json`).
3. Update the gate title/description text to the 13.5 semantics ("uses the live second-start
   allocation", not "second allocation differs"). Touch nothing else in `packages/`.
4. Gates: `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`, lint/fmt scoped, the new
   tests via `run-deno-test.ts -- --allow-all`, `arch:check`, `quality:scan`. One commit
   (`fix(e2e): accept stable 13.5 persistent allocation; prove live second endpoint`), citing run
   33328727942 and both sources; push explicitly; PR #1727 comment `## [PHASE: IMPL] S1
   convergence — live-db-endpoint gate on 13.5 semantics` with the SHA and gate exits. Final line:
   the new head SHA. The supervisor refreezes the head and reruns the hosted tiers.
