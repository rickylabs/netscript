use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts; no self-certification.
- netscript-doctrine — `packages/cli` is framework code; no `any`/casts/lint-ignores introduced.
- netscript-tools — scoped check/lint/fmt wrappers; gate receipts; raw git verification.
- netscript-deno-toolchain — `deno doc` before broad reads; dependency/version questions.

## D-205 — S8 (#1754) `database.seed` fails on the Postgres tier; diagnose, then repair or split

### The failure

This is the **first time S8's Postgres runtime tier has ever executed** — every earlier run in this
lane was cancelled or skipped. It ran, and it failed:

- Run `33404324013`, job `99545166227`, head **`bc838a0b3`**, `passed=41 failed=1`.
- Gate **`database.seed`** — FAILED 1813 ms, after `database.init` (23008 ms),
  `database.migration-artifacts` (28004 ms) and `database.generate` (6310 ms) all **PASSED**.
- CLI output:
  ```
  Validating and executing command 'seed' on resource 'postgres-cli'...
  Failed to execute command 'seed' on resource 'postgres-cli':
    error: Uncaught (in promise) PrismaClientKnownRequestError
    Invalid `prisma.user.findFirst()` invocation:
    at vn.handleRequestError (.../node_modules/.deno/@prisma/...client.js)
  Error: Database operation failed with exit code 16
  ```
- It **never reaches Garnet** — the suite skipped gates 41–45 and jumped to cleanup. The separate
  `runtime.wait.garnet` issue (**#1844**) is unrelated; **do not wait on it and do not touch it**.

### Step 1 — capture the full Prisma error, do not work from the truncated CI line

The CI log truncates before the Prisma **error code** and **meta**. Get them:

- Download the run artifacts (`e2e-cli-scaffold-runtime-report` on run `33404324013`) and read the
  structured report — the failing step's captured stdout/stderr is richer than the console line.
- Report the exact `code` (e.g. `P2021`/`P2022`/`P1001`/`P2002`) and the full `meta` object. The code
  is the whole diagnosis: a missing table/column is a migration-application problem, a connection
  error is a wiring problem, a unique-constraint error is a seed-idempotency problem. **Do not guess
  which — name the code.**

### Step 2 — establish ownership with an exact-`main` control

`database.init`, `migration-artifacts` and `generate` all passed, so the schema pipeline ran. The
open question is whether **S8's typed `<db>-cli` command lifecycle/arguments** changed how `seed` is
invoked or which database/connection string it reaches.

- Diff S8's typed-command surface against `origin/main` for the `seed` path specifically:
  `operation-runner*.ts`, `generate-db-cli-mode*`, `run-tool.ts.template`, and the resource-command
  argv construction. State precisely what S8 changed about how `seed` is executed.
- **If a live control is required to decide**, say so and STOP — host runtime leases are
  **coordinator-granted and serialized**, and you do not hold one. Report exactly what you would run.
  Do **not** start Aspire, Docker, or an AppHost on your own initiative.

### Step 3 — repair or split

- **If S8 introduced it** (typed command lifecycle, argument order, cwd, env/connection-string
  selection): repair **within #1754**, add **focused regression coverage that is red without the
  fix**, and keep the repair minimal — this is not a redesign.
- **If exact `main` reproduces it**, do **not** bend #1754 around it. Report that finding with the
  evidence; a precise shared issue will be split instead.

Either way, do not make the gate green by weakening it: no skipping `database.seed`, no catching the
Prisma error, no seeding around the failure, no tier exclusion.

### Verification before pushing

- Focused `deno check --unstable-kv`, lint, fmt (scoped wrappers) on every file you change.
- The focused tests for the touched areas plus your new regression test.
- Repo-wide `deno task check` — expect `failedBatches: 0`.

### Push

Branch `feat/aspire-13-5-s8-typed-resource-commands` at `bc838a0b3`. `git ls-remote` immediately
before pushing; fast-forward expected — if a force would be required, stop and report.

### Out of scope

- No rebase onto main, no PR base change, no label or lifecycle change.
- **No self-dispatched evaluator.** If product bytes move, the supervisor dispatches a fresh delta
  IMPL-EVAL — that is already authorized.

### Report back

The exact Prisma `code` + `meta`; what S8 changed on the `seed` invocation path; the ownership
verdict (S8-introduced vs reproduces on `main`) and the evidence for it; the repair if any; the
regression test name and its red-without-fix proof; verification exit codes; the new head; and
confirmation the worktree is clean and the push landed.
