# Receipt — #1343 installed-consumer scaffold smoke against the post-fix canary

Executed by the orchestrator under expensive-gate ledger **grant row 64** (committed and pushed at
`59dae7a10` **before** execution). W3-B1 was parked at `45001bb6b` and held nothing; no other lane
was live, so the grant was uncontended. The concurrent Fable 5 IMPL-EVAL of PR #1406 is a read-only
evaluator session and does not consume the runtime token.

## Package version and provenance

| Field | Value |
| --- | --- |
| Package | `@netscript/cli` |
| Version | **`0.0.5-canary.17`** |
| Registry | JSR (`jsr:@netscript/cli@0.0.5-canary.17`), confirmed present in `https://jsr.io/@netscript/cli/meta.json` |
| Contains #1342 | **yes** — `git merge-base --is-ancestor 1455231b0 v0.0.5-canary.17` exits 0 (`1455231b0` = "fix(scaffold): make generated quality gates own executable source (#1342)") |
| Local-source fallback | **none** — `--source jsr` with `--cli jsr:@netscript/cli@0.0.5-canary.17` |

Resolved invocation captured in the report's own `scaffold.init` evidence — this is the machine
record, not a restatement of the command I typed:

```
deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.5-canary.17 init \
  plugin-smoke-20260809-081438 --path /home/codex/ns1343-cleanroom --db postgres \
  --service --service-name users --ci --yes --no-git --force
```

The entrypoint is the published registry specifier. The harness enforces this: `--source jsr`
throws unless the entrypoint is `jsr:@netscript/cli@<version>` or the local bin
(`scaffold-gates.ts:29-35`), so a silent local fallback is not reachable on this path.

## Command and working root

```
deno run --allow-all packages/cli/e2e/cli.ts run scaffold.runtime \
  --source jsr \
  --cli jsr:@netscript/cli@0.0.5-canary.17 \
  --smoke-root /home/codex/ns1343-cleanroom \
  --cleanup --format pretty \
  --report .llm/tmp/e2e-1343-report.json --log-file .llm/tmp/e2e-1343.ndjson
```

- **Consumer working root:** `/home/codex/ns1343-cleanroom` — outside the framework checkout
  (`/home/codex/repos/ns005-stable-opus5`), emptied to zero entries before each pass.
- **Generated project (pass 2):** `/home/codex/ns1343-cleanroom/plugin-smoke-20260809-081438`.
- The E2E harness itself is the test driver and runs from the checkout; the **consumer workspace and
  the CLI under test are both external to it**, which is what the acceptance criterion governs.

## Per-step verdicts and raw exit code

| Pass | Started | Duration | Report `ok` | passed | failed | skipped | Raw exit code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-09T05:56:35Z | 428 533 ms | true | 76 | 0 | 0 | **not captured** (detached via `nohup`) |
| 2 | 2026-08-09T06:14:38Z | 306 410 ms | true | 76 | 0 | 0 | **0** |

Pass 1 was green but its receipt was incomplete: the acceptance criterion requires a raw exit code
and `nohup` had detached the driver, so only the harness's self-reported `suite-end {ok:true}`
existed. Rather than assert the exit code from the harness's own JSON, pass 2 re-ran the identical
command with `echo "RAW_EXIT_CODE=$?"` appended. `RAW_EXIT_CODE=0`. Pass 2 is the receipt of record;
pass 1 is retained at `.llm/tmp/e2e-1343-report.pass1.json` and doubles as reproducibility evidence
(two independent green runs, 76/76 both times).

**Verdict arithmetic:** the report contains **76 steps**, and `Counter(verdict)` over those steps is
`{'passed': 76}` — 76 = 76 passed + 0 failed + 0 skipped, so the aggregate is unreachable unless
every step ran. **`skipped=0`**: unlike the local-source runtime suite (which carries two expected
`DEFERRED #1398` skips), this published-consumer path skipped nothing.

Coverage spans the full consumer lifecycle: scaffold init, all seven plugin installs
(`worker`, `saga`, `trigger`, `stream`, `auth`, `ai`, plus `ai.mcp` / `ai.lifecycle`), database
init/generate/seed, Aspire restore/start/restart, twelve `runtime.wait.*` readiness gates, and 24
`behavior.*` gates including `behavior.otel.traces` and `behavior.otel.task-traces`.

## Cleanup and leak outcome

- `cleanup.aspire-stop` **passed** (AppHost stopped) and `cleanup.docker-created-containers`
  **passed** — both counted inside the 76.
- `agentic:leak-check` with `--owned-root /home/codex/ns1343-cleanroom` (so the external clean room
  carries ownership proof rather than escalating as foreign) reports **1 survivor, ownership
  `foreign`** after both passes: container `redis-jfgcbtaf`, owned by
  `/home/codex/repos/w6-review-desk`, created 2026-08-06 — pre-existing, from another worktree,
  three days older than this run. **Left untouched** per resource-hygiene rules.
- **Run-owned survivors: zero.**
- The generated project tree remains under the clean room (727 MB) — `--cleanup` stops Aspire and
  removes suite-created containers, it does not delete the workspace. Removed by the orchestrator
  after the receipt was written, and the clean room directory itself is gone (verified: `rmdir`
  succeeded, so it was empty).

  Operational detail worth recording: a plain `rm -rf` **could not** remove
  `.data/postgres/18/docker` and `.data/redis/dump.rdb` — Postgres and Redis write those as root
  from inside the containers, so they are not owned by the invoking user. Removal required
  `docker run --rm -v /home/codex/ns1343-cleanroom:/target alpine:3 sh -c 'rm -rf /target/*'`.
  Any consumer or CI job that scaffolds into a workspace and later tries to delete it as a normal
  user will hit the same wall; a bare `rm -rf` will fail with `Permission denied` on those two
  paths. This is a consumer-visible rough edge, not a defect in the smoke.

## Scope note

This proves the installed-consumer surface against `0.0.5-canary.17`. If the content that ships as
0.0.5 stable diverges materially from canary.17, this receipt does not transfer and the smoke must
be re-run against the final canary. Running it now was a deliberate derisk of the stable cut using
an otherwise-idle token, not a substitute for cut-time verification.
