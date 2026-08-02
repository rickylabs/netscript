# Research — #1046 run-owned teardown

Every fact below was derived on this checkout / this host on 2026-08-01→02, not carried in.

## F1. The leak has a named source: `--cleanup` is opt-in and defaults to `false`

`.llm/tools/e2e/scaffold-e2e-test.ts`:

- `cleanup: false` in the default options (line ~201), `--cleanup` is an opt-in CLI flag (line ~307,
  "Stop the generated Aspire AppHost before exit").
- The stop path exists and is already correctly scoped:
  `get stopCommand() { return ['aspire','stop','--apphost', this.appHost,'--non-interactive','--nologo']; }`
  (line ~641) and `#cleanupAspire()` (line ~1268).
- It only fires under `if (this.#options.cleanup && this.#startedAspire && !this.#options.dryRun)`
  (line ~675).

So the tool that starts AppHosts already knows how to stop **its own** AppHost by path. The defect
is that stopping is optional and nothing above it notices when it was skipped. This is the "advice,
not enforcement" shape the issue describes, in code rather than prose.

## F2. There is already a per-AppHost stop; `--all` is never needed

`aspire stop --apphost <path> --non-interactive --nologo` is the shipped, already-used form.
`aspire stop --all` would cross run boundaries and must not be introduced.

## F3. `aspire ps --format Json` is a machine-readable ownership source (verified live)

Real output on this host:

```json
[
  {
    "appHostPath": "/home/codex/repos/fix-1011/.llm/tmp/cli-e2e/plugin-smoke-20260801-235901/aspire/apphost.mts",
    "appHostPid": 52220,
    "status": "running",
    "sdkVersion": "13.4.6",
    "cliPid": 51963,
    "dashboardUrl": "https://localhost:46251",
    "logFilePath": "/home/codex/.aspire/logs/cli_20260801T220035753_detach-child_....log"
  }
]
```

Key properties:

- `appHostPath` is an **absolute path inside the owning run's worktree**. Under this repo's
  parallelism model every concurrent slice runs in its own `/home/codex/repos/<worktree>` worktree,
  so path containment separates runs exactly.
- `appHostPid` / `cliPid` give a second, independent identity.
- The command already runs in the e2e preflight (`preflight-no-running-apphost`, line ~723), so the
  JSON shape is not speculative — it is already consumed by shipped code.

## F4. Aspire-created containers already carry an ownership label set (verified live)

`docker ps -a --format '{{.Names}} {{.Labels}}'` on this host shows every Aspire-created container
carries `com.microsoft.developer.usvc-dev.*` labels, including:

| Label                                                    | Value on this host                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `com.microsoft.developer.usvc-dev.name`                   | `postgres-6bdea913`                                                                                  |
| `com.microsoft.developer.usvc-dev.creatorProcessId`       | `45429`                                                                                              |
| `com.microsoft.developer.usvc-dev.creatorProcessStartTime`| `0001-01-01T00:19:04.220Z`                                                                           |
| `com.microsoft.developer.usvc-dev.mountsLabel`            | `type=bind,src=/home/codex/repos/fix-1011/.llm/tmp/cli-e2e/plugin-smoke-20260801-235901/.data/postgres` |
| `com.microsoft.developer.usvc-dev.persistent`             | `true`                                                                                               |
| `com.microsoft.developer.usvc-dev.uid`                    | `3c1d3be1-6e04-4b18-b593-45a01705f4b8`                                                               |

**This is the decisive finding.** `mountsLabel`'s `src=` is an absolute path under the *creating
run's worktree*. Two concurrent runs are therefore already distinguishable **without inventing a new
labelling mechanism**, and the distinction is a path-containment test, not a name pattern.

Live proof of parallelism on this host at research time: containers bound to
`/home/codex/repos/fix-1011/...` **and** `/home/codex/repos/fix-1025/...` were running
simultaneously, both named `postgres-*`. A `postgres-*` name-pattern kill would have destroyed both
sibling runs. This is exactly the failure mode the issue forbids.

**Caveat (must be handled, not hidden):** not every Aspire container has `mountsLabel` — the live
`garnet-pmurrpaj` and `redis-ujufnejr` containers carry the `usvc-dev` label set but **no**
`mountsLabel` (no bind mount). Path containment alone is therefore *sufficient but not necessary*;
a second proof (creatorProcessId ∈ this run's recorded PID set) is required for coverage, and where
neither proof holds the container must be escalated, never killed.

## F5. The slice terminal contract is a real, single enforcement seam

`.llm/tools/agentic/codex/run-codex-slice-lib.ts`:

```ts
export type DoneContract =
  | { readonly state: 'done' }
  | { readonly state: 'blocked'; readonly reason: string }
  | { readonly state: 'running' };

export function parseDoneContract(reply: string): DoneContract { … }
```

`.llm/tools/agentic/codex/run-codex-slice.ts` is the run-loop exit path: on `contract.state ===
'done'` it sets `state = 'done'` and exits `0`; `blocked` exits `3`, `budget_exhausted` exits `4`.
Every WSL Codex slice funnels through this one function, and it already writes
`codex-slice-status.json` + `codex-thread-ids.md` into the slice dir. An agent cannot report success
without passing through here — which makes it the correct place to make "you left an AppHost
running" impossible to report as success.

## F6. `aspire mcp start` is structurally distinct from an AppHost

MCP servers are `aspire mcp start` processes; they never appear in `aspire ps --format Json`, which
lists **AppHosts** (`appHostPath` + `appHostPid`). Teardown that only ever acts on rows returned by
`aspire ps` and only ever issues `aspire stop --apphost <path>` cannot reach an MCP server, because
there is no MCP row to act on and no MCP path to pass. This is a structural exclusion, not a pattern
that hopes to miss.

## F7. Blanket removal is being deleted, not relocated

PR #1034 (open, branch `fix/1023-agent-init-skill-surface`) removed
`docker ps -aq | xargs -r docker rm -f` from `skills/help.md` after owner review comment 1 (HIGH),
on the principle "a scoping filter we could not prove is worse than none". Only read-only
`docker ps` survives in that bundle. This run must not reintroduce any form of it, and this run
*can* prove scoping (F4) — but the proof must be positive, and failure to prove must mean "leave it
alone", matching #1034's principle rather than contradicting it.

## F8. The consumer skill surface is not yet on `main`

`git ls-tree origin/main -- skills` returns only `manifest.json`, `netscript/`, `netscript-build/`,
`netscript-operate/`. `skills/aspire/SKILL.md`, `skills/deno/SKILL.md` and `skills/help.md` exist
**only on PR #1034's branch**. Consequences for this run:

- Dogfooding must be done by **routing to `skills/`**, not by copying content — the content is
  another PR's and is still moving.
- Any AGENTS.md pointer must degrade gracefully until #1034 merges.
- `deno task check:assets-barrel` on #1034 now diffs `skills.generated.ts`; do not touch
  `skills/**` from this run at all.

## F9. Tooling that is shipped but not discoverable from the symptom is not used

Measured across five agent runs on `0.0.2`: `aspire otel` **0** invocations, `netscript plugin
doctor` **0** invocations, despite `plugin doctor` being named six times in the shipped skills
(#1023 / PR #1034 body). A `deno task` that merely exists will repeat that outcome. The task must be
reachable from the symptom ("my run failed and I do not know what is still running", "service-health
timed out") in `AGENTS.md`, the harness run-loop, and the tools index — not only from a verb table.

## F10. Live host state at research time (foreign — left untouched)

| Resource                          | Owner (by path/label)                                | Age at observation | Action taken |
| --------------------------------- | ---------------------------------------------------- | ------------------ | ------------ |
| AppHost pid 52220 (cli 51963)     | `/home/codex/repos/fix-1011/.llm/tmp/cli-e2e/...`     | live               | none         |
| `postgres-6bdea913`               | `fix-1011` (mountsLabel src)                          | ~2 min             | none         |
| `garnet-pmurrpaj`, `redis-ujufnejr` | `fix-1011` (creatorProcessId 53249, no mountsLabel) | ~1 min             | none         |
| `postgres-bc75ea00`               | `fix-1025` (`/home/codex/repos/fix-1025/.llm/tmp/telemetry-1025-repro/.data/postgres`) | ~11 min | none |

None of these belong to this run. Under the design below every one of them is *foreign*, and the
correct behaviour for this run's teardown is to report them and stop.

## Open questions (closed before the Plan-Gate)

1. *Can we stamp our own label at creation?* — Not for Aspire-created containers; the AppHost
   creates them and we do not control its container-runtime invocation. **Closed:** use the
   ownership evidence Aspire already stamps (F4) plus a run-side registry recorded at start; do not
   invent a labelling mechanism we cannot actually apply.
2. *Is a baseline snapshot diff enough?* — No. A sibling run starting a container after our baseline
   would be inside the diff. Snapshot diff may narrow candidates but must never, on its own,
   authorize a kill.
3. *Does `aspire ps` list MCP servers?* — No (F6); this is what makes the MCP exclusion structural.
