# Receipt — #1343 installed-consumer smoke against `0.0.5-canary.18`

Supersedes the canary.17 receipt for stable-readiness purposes. Executed under expensive-gate ledger
**grant row 68** (`e4f283882`), committed and pushed **before** execution; released as row 69.

## Why this re-run was required

The canary.17 receipt (row 65) is pinned to that content and does **not** transfer. Ten first-parent
merges landed since, touching `packages/cli`, `packages/mcp`, `plugins/streams`, contracts and the
Deno toolchain. That scope limit was written into the original receipt; this run discharges it
against the content that will ship.

## Precondition — C18 is a verified green pair

| | |
| --- | --- |
| publish-and-prove | `completed success` (run 31315204496) |
| pinned production E2E | `completed success` (run 31315395870) |
| commit status | `release/canary-pair: success — Canary 0.0.5-canary.18 publish + pinned production E2E passed` |
| payload (post-publish, content-derived) | `merge-history-payload` PASS — 10 commits, 10 PRs, 9 closed issues |

## Provenance

`jsr:@netscript/cli@0.0.5-canary.18`, published on JSR. No local-source fallback — the harness's own
`scaffold.init` evidence records the resolved invocation:

```
deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.5-canary.18 init \
  plugin-smoke-20260809-152748 --path /home/codex/ns1343-c18 --db postgres ...
```

`--source jsr` throws unless the entrypoint is `jsr:@netscript/cli@<version>` or the local bin
(`scaffold-gates.ts:29-35`), so a silent local fallback is unreachable on this path.

Note on the flag: `--minimum-dependency-age=0` on `deno run` works on 2.9.3 as well — the upstream
defect was scoped to the dependency-mutation subcommands `deno add` / `deno remove`, which is why the
canary.17 receipt was legitimately green before the 2.9.5 standardization.

## Command and result

```
deno run --allow-all packages/cli/e2e/cli.ts run scaffold.runtime \
  --source jsr --cli jsr:@netscript/cli@0.0.5-canary.18 \
  --smoke-root /home/codex/ns1343-c18 --cleanup --format pretty
```

| | |
| --- | --- |
| **Raw exit code** | **0** — captured from `$?`, not inferred from the report's `ok` field |
| Summary | `passed=79 failed=0 skipped=2` |
| Total steps | **81** = 79 + 0 + 2, so the aggregate is arithmetically checkable |
| Duration | 481,172 ms |
| Per-step verdicts | `{passed: 79, skipped: 2}` — no other verdict class |

Both skips named individually, and both are the expected owned-suite deferrals:
`behavior.otel.stream-consumer` and `behavior.otel.traces` (`DEFERRED #1398`). No other skip.

## Cleanup and leak outcome

`agentic:leak-check --owned-root /home/codex/ns1343-c18` before and after: **zero run-owned
survivors**. The single survivor both times is the foreign `redis-jfgcbtaf` owned by
`/home/codex/repos/w6-review-desk` (created 2026-08-06) — reported and left untouched per resource
hygiene.

## Consumer-visible rough edge, unchanged from the canary.17 run

A plain `rm -rf` of the generated workspace still fails with `Permission denied` on
`.data/postgres/18/docker` and `.data/redis/dump.rdb`, because the containers write them as root.
Removal requires a container. Any consumer who scaffolds and later deletes the workspace as a normal
user hits this. Release-notes candidate; not a defect of this smoke.
