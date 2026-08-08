use harness

You are the W2-C implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster covering two issues: **#1327 — `db migrate` reports success in headless mode without
creating the migration implied by the command**, and **#1202 — the scaffolded users service binds a
stale Postgres endpoint** (partial: see the boundary below).

## SKILL

Activate and follow, in this order:

- `netscript-harness`
- `netscript-cli` (db commands, scaffold output, generated projects, CLI E2E suites — this is the
  primary skill for this slice)
- `aspire` (endpoint allocation, resource health, structured logs, correlated OTEL, isolated start)
- `netscript-doctrine` (A6 CLI/tooling; `packages/cli` carries accepted maintainer/public-mixing and
  permission-docs debt — do not deepen either)
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`

Read `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md` in full.

## Identity

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Lane           | `light_implementation` — Codex · OpenAI · GPT-5.6 Sol · low               |
| Worktree       | `/home/codex/repos/ns005-w2c`                                             |
| Branch         | `fix/cli-db-live-endpoint-and-migrate-artifact`                           |
| Base           | `origin/main@c383b2e84`                                                   |
| Slice dir      | `.llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327/`           |
| Draft PR       | you open it, direct to `main`                                             |
| IMPL-EVAL      | Claude · Fable 5 · medium, separate session, launched by the orchestrator |
| Review pairing | `review_codex_light` → Opus 5 · high                                      |

## Hard boundary on #1202 — read this before writing the PR body

#1202's acceptance includes an **observational row that only the owner's machine can satisfy**: the
colliding Windows service on the fixed low port must be identified with it present, and three
consecutive clean full `scaffold.runtime` passes captured. **Your PR must carry `Refs #1202`, never
`Closes #1202`, and you must not tick that row.** The orchestrator captures it separately. You may
close **#1327**.

## Mission

Read both issues in full and re-verify every claim against the current worktree first.

1. Trace every generated service/database **endpoint authority** and remove fixed low/common default
   binding wherever discovery makes it unnecessary. Add RED tests for stale/persisted endpoint
   writes across consecutive AppHost allocations — the bug is that a value written on run 1 survives
   into run 2's differently-allocated topology.
2. Prove the users service's Prisma connection matches the **live** Postgres allocation on first and
   second starts, using health JSON, resource endpoints, structured logs, and correlated OTEL. A
   process that exits zero is not evidence.
3. Define artifact semantics for `db migrate` consistent with `db init` / `db generate`: a
   successful schema-change migration must **name and verify the files it created** and the database
   state it applied.
4. Make headless inability to create a migration **fail non-zero** with an actionable next command.
   Give deploy-only behaviour a distinct unambiguous verb, and report created and applied sets
   separately.
5. Add TTY **and** non-TTY E2E fixtures that mutate the schema, assert migration files exist,
   inspect database state, and include deploy-only and no-change negative controls.
6. Gates: focused DB/CLI/generator tests, scoped wrappers, `quality:gate`, `arch:check`, clean
   resource-health checks, then the serialised one-pass `scaffold.runtime` (request the token
   first).

One green start, or `db migrate` exiting zero, is insufficient. Files, database state, live endpoint
identity, health payload, and telemetry are the decisive artifacts.
