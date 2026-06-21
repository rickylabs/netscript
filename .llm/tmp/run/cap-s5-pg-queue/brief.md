# S5 Codex Slice — PostgreSQL queue adapter

Run-id: `cap-s5-pg-queue` · Slice S5 of the capability-caveats fix track. PLAN-EVAL PASS on PR #65.
Worktree: `/home/codex/repos/netscript-cap-s5-pgqueue` · Branch: `fix/cap-caveat-s5-pg-queue` (off `origin/main`, at 159db1f).

You are a WSL Codex implementation agent for NetScript. **Use harness.** Activate skills: `netscript-harness`, `netscript-doctrine` (ARCHETYPE for `packages/queue`), `netscript-deno-toolchain`, `rtk`. You implement only; the supervisor (Claude) opens the PR and dispatches IMPL-EVAL. Do NOT self-certify.

## Problem (validated by PLAN-EVAL against current main)
`packages/queue/factory/create-queue.ts:221` — the `QueueProvider.Postgres` branch returns
`Promise.reject(new QueueConfigurationError('PostgreSQL queue adapter not yet implemented'))`. The
provider is advertised but unusable. RabbitMQ, Redis, and DenoKV adapters are real (`createRabbitMqQueue`,
`createRedisQueue`, `createDenoKvQueue`) — find them and MIRROR their structure/contract exactly.

## Dependency — already catalogued, do NOT add a new one
`pg` is **already in the root catalog** (`deno.json` → `"pg": "^8.21.0"`). Import it via the catalog
(`npm:pg` / `pg` per the repo's existing import style — match how `mysql2`/`amqplib` adapters import).
Do NOT add, bump, or move any catalog entry; do NOT touch version pins. Adding `pg`'s **resolution**
to `deno.lock` is the ONLY lock change permitted (see Gates) — nothing else.

## Fix — implement the Postgres adapter, mirroring the existing adapters
1. Read the `MessageQueue<T>` contract and an existing adapter (prefer `createRedisQueue` — closest
   shape) to learn the exact methods/semantics you must satisfy (publish/consume/ack/close, etc.).
2. Implement `createPostgresQueue<T>(name, connection)` using `pg`, satisfying the same contract. Use
   a standard, correct pattern (e.g. a queue table + `SELECT ... FOR UPDATE SKIP LOCKED` polling, or
   `LISTEN/NOTIFY`) — whichever matches the existing adapters' delivery semantics most faithfully.
3. Wire it into the factory switch at `create-queue.ts` (replace the reject branch).

## Constraints (binding)
- Keep the diff to `packages/queue`. No unrelated churn. No `docs/` edits. S5 only — do not touch
  S1/S2/S3/S4 surfaces.
- Do NOT change the catalog, version pins, or generated files. Do NOT de-catalog.
- `deno.lock`: the ONLY permitted change is the additive `pg` resolution that `deno` writes when the
  new import is resolved. If your lock diff contains anything beyond `pg` (e.g. `clsx`, `tailwind-merge`,
  `@prisma/client`, `amqplib@^2`), main's lock is independently stale — do NOT absorb that churn;
  restore those unrelated hunks (`git checkout origin/main -- deno.lock` then re-add only via a scoped
  `deno cache` of your new module) and record the observation in `drift.md`.

## Gates (all required; wrap deno runs in `rtk proxy`)
1. New test: a real (or containerised/embedded) Postgres-backed publish→consume round-trip, OR if no
   PG is available in-sandbox, a contract-level test against the adapter with a `pg` client double that
   proves the adapter issues the correct queries and satisfies the `MessageQueue` contract. The test
   must fail if the adapter regresses to the reject stub. `deno test` green for the affected tests.
2. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/queue --ext ts,tsx`
   green (wrapper passes `--unstable-kv`).
3. `deno lint` green for the touched scope.
4. `git diff --stat origin/main -- deno.lock` shows ONLY `pg`-related lines (or empty).

## Report + commit
- Write `.llm/tmp/run/cap-s5-pg-queue/worklog.md`: files changed, which adapter you mirrored, the
  delivery pattern chosen + why, the test's evidence, all gate results, and the exact `deno.lock`
  delta. Append the commit line to `.llm/tmp/run/cap-s5-pg-queue/commits.md`.
- Commit message starts: `feat(queue): implement PostgreSQL queue adapter`
  and ends with EXACTLY these two trailer lines:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_018fq9V7ujx7e1rWXi57qkPG
  ```
- `git branch --unset-upstream`, then push with an explicit refspec:
  `git push origin fix/cap-caveat-s5-pg-queue:fix/cap-caveat-s5-pg-queue` (never a bare push — this
  worktree tracks origin/main, so a bare push would target main).
- Do NOT open the PR. Final worklog line: `DONE <sha>` + a one-line gate summary.

## STOP condition
If a correct Postgres queue adapter genuinely requires schema/migration infrastructure or transport
beyond an M-sized slice (e.g. it cannot reuse the existing adapters' connection/lifecycle model), do
NOT force a half-built adapter — record the finding and a concrete rescope recommendation in
`.llm/tmp/run/cap-s5-pg-queue/drift.md` and stop for supervisor rescope. Do NOT silently downscope to
a stub.
