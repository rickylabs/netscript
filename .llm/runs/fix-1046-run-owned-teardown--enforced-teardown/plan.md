# Plan — #1046 run-owned teardown, enforced

- Archetype: **6 — CLI / tooling**, with a **docs** scope overlay.
- Doctrine verdict: `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` (current
  `main`); this run touches `.llm/tools/**`, `.llm/harness/**`, `.agents/skills/**`, `AGENTS.md`,
  `deno.json` — **no `packages/**` or `plugins/**` source**.
- Base: `origin/main` @ `26b01ea5b`.

## The one-sentence problem

Teardown is optional (`--cleanup` defaults to `false`, F1) and unenforced, so leaked AppHosts and
containers contend with sibling runs and produce failures that get misread as product defects.

## The one-sentence solution

Prove ownership from evidence Aspire already stamps (F3/F4), stop **only** what this run started,
**escalate** everything else, and make a surviving owned resource unable to exit as `DONE` (F5).

## Architecture decisions — LOCKED

### D1. Ownership is proven, never inferred. Two positive proofs, both path/identity based.

A resource is **owned by this run** iff at least one proof holds:

- **P1 — path containment.** The resource's own recorded absolute path is inside this run's
  worktree root (`/home/codex/repos/<wt>`), resolved with `realpath` and compared as a
  path-segment prefix (`a/b` must not match `a/bc`).
  - AppHost: `aspire ps --format Json` → `appHostPath`.
  - Container: label `com.microsoft.developer.usvc-dev.mountsLabel` → the `src=` value.
- **P2 — registry identity.** The resource matches an entry this run wrote into
  `<slice-dir>/run-resources.json` at creation time, on the **pair** (pid, creatorProcessStartTime)
  for containers / (appHostPid, appHostStartedAt) for AppHosts. The pair defeats PID reuse; a bare
  PID match is **not** a proof.

Everything else — including a `postgres-*` name match, a snapshot-diff hit, or "it looks like ours"
— is **not ownership**. Rationale: F4 proved two sibling runs (`fix-1011`, `fix-1025`) had
concurrently-running `postgres-*` containers; pattern killing would have destroyed both.

**Invariant (the hard requirement): if ownership cannot be proven, do not touch it.** The default
branch of every classification is `unproven → escalate`, and it is asserted by a test that feeds an
empty registry and asserts zero actionable resources.

### D2. Classification is a three-valued, total function — no boolean, no fallthrough kill.

`classify(resource, registry, worktreeRoot) -> 'owned' | 'foreign' | 'unproven'`

- `owned` — P1 or P2 holds.
- `foreign` — a *different* run is positively identified (path resolves under another
  `/home/codex/repos/<other>` worktree). Reported with the owning run named.
- `unproven` — no proof either way (e.g. the live `garnet`/`redis` containers with no `mountsLabel`,
  F4 caveat). Reported as unknown-owner.

Only `owned` is ever actionable. `foreign` and `unproven` take the identical escalation path — the
difference is only what the report can tell the user.

### D3. Teardown acts per resource, never in bulk.

- AppHost: `aspire stop --apphost <owned path> --non-interactive --nologo`, one invocation per owned
  AppHost. **`aspire stop --all` is forbidden** and a test greps the whole diff for `stop --all`.
- Container: `docker rm -f <container-id>` for a *single, re-verified* id, and only for a container
  that is (a) `owned` and (b) still present after its owning AppHost was stopped. Labels are
  re-read immediately before removal; if the re-read no longer proves ownership the removal is
  abandoned and the resource is escalated.
- **Forbidden in any form, enforced by a repo-wide grep test:** `docker ps -aq`, `docker rm -f $(…)`,
  `xargs … docker rm`, `docker container prune`, `docker system prune`, `aspire stop --all`.

### D4. MCP servers are excluded structurally, not by pattern.

Teardown's only sources of AppHost truth are rows from `aspire ps --format Json`, and its only
AppHost verb is `aspire stop --apphost <path>`. `aspire mcp start` processes do not appear in
`aspire ps` (F6), so there is no row to act on and no path to pass. Defence in depth: a guard
rejects any candidate whose resolved command line matches `aspire\s+mcp\b` even if it somehow
reached the actionable set, and the guard has its own test.

### D5. The enforcement point is the slice terminal contract (F5).

`parseDoneContract` stays a pure parser. A new pure function

```ts
enforceTeardown(contract: DoneContract, leaks: LeakReport): DoneContract
```

downgrades `{state:'done'}` to `{state:'blocked', reason:'teardown: <n> owned resource(s) survived: …'}`
when the report contains **owned** survivors. `foreign`/`unproven` entries never downgrade the
contract — they are reported only; a run must not be failed for a sibling's resources.

`run-codex-slice.ts` wires it on the `done` branch: leak-check → if owned survivors, run scoped
teardown once → re-check → apply `enforceTeardown`. A slice that leaves its own AppHost running
exits `3` (blocked), not `0`. This is the "cannot report success while it is still running"
acceptance box.

### D6. Escalation is a rendered report with the exact command, never an action.

Every `foreign`/`unproven` resource, and anything older than `STALE_AFTER_MS` (default 2 h,
constant, overridable by `--stale-after`), is written to
`<slice-dir>/leak-report.md` **and** stdout JSON with: kind, identity, age, the run that appears to
own it (worktree path when derivable, else `unknown`), and the exact copy-pasteable command the
**user** could run (`aspire stop --apphost <path> --non-interactive --nologo` /
`docker rm -f <id>`). The tool never runs those commands for foreign or unproven resources.

### D7. Dogfooding routes to the consumer bundle; it does not copy it (F7/F8).

`skills/aspire`, `skills/deno`, `skills/help.md` exist only on PR #1034's branch. This run
**creates and edits nothing under `skills/**`**. Instead:

- a `deno task agentic:dogfood-skills` runs the local CLI's `agent init` bundle into
  `.agents/generated/consumer-skills/` for this repo's own agents — it installs whatever the bundle
  contains, so it picks up #1034 automatically on merge and cannot drift from it;
- `AGENTS.md` gains a **Resource hygiene** section routing by symptom to that surface plus the
  existing internal `.agents/skills/aspire`;
- `.claude/skills/**` is untouched (it is a generated mirror of `.agents/skills/**`).

### D8. Discoverability is symptom-indexed, because presence alone measurably fails (F9).

The new verbs are reachable from the symptom in four places, not just a verb table: `AGENTS.md`
Resource hygiene, `.llm/harness/workflow/run-loop.md` § Close, `.llm/tools/entry.md` /
`.llm/tools/README.md`, and the `netscript-tools` + `netscript-deno-toolchain` skills. Symptoms
indexed: "my run failed and I do not know what is still running", "`behavior.service-health` timed
out", "ports are in use", "a `postgres-*` container I did not start".

## Open-decision sweep

| Decision                                                    | Status                | Safe to defer? |
| ----------------------------------------------------------- | --------------------- | -------------- |
| Ownership proof mechanism (label stamp vs existing evidence) | **Resolved** (D1, F4) | No — resolved  |
| Bulk vs per-resource verbs                                   | **Resolved** (D3)     | No — resolved  |
| MCP exclusion mechanism                                      | **Resolved** (D4)     | No — resolved  |
| Enforcement seam                                             | **Resolved** (D5)     | No — resolved  |
| `skills/**` fork vs route                                    | **Resolved** (D7)     | No — resolved  |
| Staleness threshold value                                    | 2 h constant + flag   | Yes            |
| Whether `e2e --cleanup` default flips                        | **Resolved** — flips to on, `--no-cleanup` opt-out that still registers + escalates | No |
| Whether teardown ever removes containers at all             | **Resolved** — yes, per-id, re-verified, owned-only (D3) | No |

## Commit slices

| #   | Slice                                                                                          | Gate                                                                 | Files |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----- |
| 1   | Run-dir artifacts (research/plan/supervisor/worklog Design)                                     | `deno task doc:lint`                                                  | `.llm/runs/<run>/*` |
| 2   | `ownership.ts` — three-valued classification, path containment, pid+startTime pair, MCP guard   | `run-deno-check.ts --root .llm/tools/agentic/teardown` + `deno test`   | `.llm/tools/agentic/teardown/ownership.ts{,_test.ts}` |
| 3   | `run-resources.ts` — per-run registry read/write, atomic write, schema version                  | check + `deno test`                                                   | `…/run-resources.ts{,_test.ts}` |
| 4   | Probes behind ports — `aspire ps --format Json`, `docker ps -a` label parse; fixture-driven      | check + `deno test`                                                   | `…/probes.ts`, `…/ports.ts`, `…/__fixtures__/*`, `_test.ts` |
| 5   | `leak-check.ts` — read-only reporter + escalation rendering (`leak-report.md` + JSON)           | check + `deno test` + manual read-only run on this host               | `…/leak-check.ts{,_test.ts}` |
| 6   | `teardown.ts` — owned-only per-resource stop/remove, `--dry-run` default-safe                   | check + `deno test` + forbidden-command grep test                     | `…/teardown.ts{,_test.ts}`, `…/forbidden-commands_test.ts` |
| 7   | `deno task agentic:leak-check` / `agentic:teardown` + tools index rows                          | `deno task fmt:check`, `doc:lint`                                     | `deno.json`, `.llm/tools/entry.md`, `.llm/tools/README.md` |
| 8   | **Enforcement** — `enforceTeardown` + wiring on the `done` branch of `run-codex-slice.ts`       | check + `deno test` (DONE→BLOCKED on owned survivor)                  | `.llm/tools/agentic/codex/run-codex-slice-lib.ts{,_test.ts}`, `run-codex-slice.ts` |
| 9   | e2e: `cleanup` defaults on, `--no-cleanup` opt-out, AppHost registered at start                 | check + `deno test`                                                   | `.llm/tools/e2e/scaffold-e2e-test.ts` |
| 10  | Dogfood + symptom routing — `agentic:dogfood-skills`, `AGENTS.md`, run-loop § Close, skills rows | `doc:lint`, `agentic:sync-claude:check`                               | `deno.json`, `AGENTS.md`, `.llm/harness/workflow/run-loop.md`, `.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/netscript-deno-toolchain/SKILL.md` |
| 11  | Worklog + context-pack finalization, gate evidence tables                                       | —                                                                     | `.llm/runs/<run>/*` |

11 slices, < 30. Each names its gate and its files.

## Risk register

| #  | Risk                                                                             | Severity | Mitigation |
| -- | -------------------------------------------------------------------------------- | -------- | ---------- |
| R1 | Teardown kills a sibling run's live resources → manufactures the phantom failure this issue exists to remove | **Critical** | D1/D2 three-valued classification; `unproven` is the default branch; empty-registry test asserts zero actionable; forbidden-command grep test; per-resource verbs only (D3) |
| R2 | Teardown kills `aspire mcp start` → breaks the running session                    | **Critical** | D4 structural exclusion + explicit guard + test |
| R3 | PID reuse makes a foreign container look owned                                     | High     | P2 requires the (pid, creatorProcessStartTime) **pair**, never a bare PID |
| R4 | Label schema drift in a future Aspire release silently voids P1                    | Medium   | Probes fail closed: an unparseable/absent label yields `unproven`, never `owned`; fixtures pin the observed 13.4.6 shape and a test asserts the fail-closed direction |
| R5 | Enforcement makes every slice blocked → agents route around it                     | Medium   | Only **owned** survivors downgrade the contract; teardown is attempted automatically once before the downgrade; the block reason names the exact resource and the exact command |
| R6 | Duplicating #1034's `skills/**` content → merge conflict + two sources of truth     | High     | D7: this run creates/edits nothing under `skills/**`; route only |
| R7 | Shipped-but-undiscovered tooling repeats the zero-invocation outcome (F9)           | Medium   | D8 four-surface symptom indexing |
| R8 | The new tool itself leaks (spawns aspire/docker and hangs)                          | Medium   | Probes are read-only and time-bounded; `teardown.ts` defaults to `--dry-run` unless `--apply` is passed |

## Gate set

Static: `.llm/tools/run-deno-check.ts` (never pass `--unstable-kv` — it is emitted by default and
the flag is rejected with exit 1), `run-deno-lint.ts`, `run-deno-fmt.ts --check`, `deno task
doc:lint`, `deno test` on the new modules, `deno task agentic:sync-claude:check`.
Fitness/runtime/consumer/jsr-audit: **N/A** — no `packages/**` / `plugins/**` surface change, no
export change. `quality:scan` / `arch:check`: N/A for the same reason (recorded, not skipped
silently).

## Debt implications

None created. One closed in spirit: the advisory-cleanup gap named in `.llm/tools/CLEANUP-PLAYBOOK.md`
becomes machine-enforced for AppHosts/containers.

## Deferred scope

- Stamping a first-party `netscript.run.id` label at container creation — not achievable without
  controlling the AppHost's container-runtime invocation (F/OQ1). Revisit if Aspire exposes a
  label-injection hook.
- Cross-machine / CI-runner leak reporting.
- Adding a teardown symptom row to `skills/help.md` — owned by #1034; follow-up comment on that PR.
# Augment review remediation plan — 2026-08-02

The owner waived a new open-model PLAN-EVAL for this review round; the supervisor performs the
review gates. Existing decisions D1–D8 remain locked, especially the owned-only mutation bar.

1. **Probe resilience (#3696850088):** add per-tool probe outcomes at the process adapter boundary,
   preserve successful sibling results, thread injectable command/file ports through leak-check,
   and prove unavailable tools cannot block DONE.
2. **AppHost settle window (#3696850097):** add an immediately-first, bounded retry helper with an
   injected delay and configurable budget; distinguish timeout from probe failure in diagnostics.
3. **AppHost-only registry probe (#3696850093):** route E2E registration through the exported
   Aspire-only probe so Docker availability is outside this operation's dependency graph.
4. **Portable attribution (#3696850101):** derive the sibling-worktree parent from the active
   worktree root for reporting and foreign classification without changing either owned proof.
5. **Traversal pruning (#3696850083):** prune `.git` and `.llm/runs` before recursion, then prove the
   guard still fails against a temporary tracked-file violation and record the red output.

Risks are bounded by focused regression tests: probe status must never authorize mutation; retry
uses a finite monotonic budget; derived attribution uses path segments; traversal keeps exact
canonical and dogfood inventories. No package/plugin export changes or architecture debt are
introduced. Required final gates are the six commands in the supervisor brief plus a final
read-only Docker/Aspire inventory.
