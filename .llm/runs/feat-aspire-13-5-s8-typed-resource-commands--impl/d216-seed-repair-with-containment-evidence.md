use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts; no self-certification.
- netscript-doctrine — `packages/cli` is framework code; no `any`/casts/lint-ignores introduced.
- netscript-tools — scoped check/lint/fmt wrappers; CI artifact retrieval; gate receipts.

## D-216 — `database.seed` IS S8's. Diagnose and repair it.

### Retracting the steering that pointed you away from this

In D-206/D-207 the supervisor told you the seed failure was "almost certainly exonerated" for S8
because it reproduced on S9 and S10. **That reasoning was wrong, and you should discard it.** S9 and
S10 **contain S8's 13 commits** — they were never independent controls. The supervisor also cited a
"fully green" #1744 run that was in fact a **policy skip** (`Skipped by policy=success`, every real
step `skipped`). Both errors are corrected; work from the evidence below instead.

### The evidence that now points at S8

**Containment, tested with
`git cat-file -e <head>:packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts`:**

| Head | contains S8's typed-db surface | `database.seed` |
| --- | --- | --- |
| #1747 `2032d4ed7` | **no** | **PASS** (`passed=46`) |
| S8 `bc838a0b3` | yes | FAIL 1813 ms |
| S8 `d1c6d8b54` (converged) | yes | FAIL 1811 ms, `passed=41 failed=1` |
| S9 `a8cf585b0` | yes | FAIL |
| S10 `21a0bfec6` | yes | FAIL 1310 ms, `passed=40 failed=1` |

**Convergence did not fix it, and that is itself evidence.** S8 now sits on `main` `6c195acaf`, newer
than #1747's base, and still fails. Its **20 non-generated product blobs are byte-identical** across
the convergence — so nothing about S8's own bytes changed, and neither did the failure. A
branch-base cause is refuted.

**A second S8 gate is also failing:** S10's sqlite tier at `21a0bfec6` fails **`runtime.resource-command`**
(`passed=86 failed=1`) — S8's own typed resource-command gate.

### The failure

```
> database.seed: Seed generated database
  FAILED ~1.8s — Command exited 16; expected 0.
  Validating and executing command 'seed' on resource 'postgres-cli'...
  Failed to execute command 'seed' on resource 'postgres-cli':
    error: Uncaught (in promise) PrismaClientKnownRequestError
    Invalid `prisma.user.findFirst()` invocation:
```

`database.init`, `database.migration-artifacts` and `database.generate` all **pass** immediately
before it, so the schema pipeline runs.

### Step 1 — get the Prisma `code` and `meta`. This is still unread and it is the diagnosis.

The console line truncates before them. Download the `e2e-cli-scaffold-runtime-report` artifact from
run **`33415203923`** (converged head, job `99564164750`) and, for comparison, **`33404324013`**.
Report the exact `code` and full `meta`.

The code decides the direction, so do not guess: `P2021`/`P2022` = missing table/column, i.e. the
migration did not apply to the database `seed` actually connects to; `P1001` = cannot reach the
database; `P2002` = unique-constraint/idempotency.

### Step 2 — the likely mechanism, to confirm or refute

S8 routes database commands through the **resident Aspire AppHost** via typed `<db>-cli` resource
commands rather than the previous path. A plausible and testable story: `init`/`migrate`/`generate`
apply to one database or connection, while the typed `seed` command executes against a **different**
one (different connection string, different env resolution, different working directory, or a second
AppHost/resource instance) — so the schema exists where the migration ran but not where `seed` looks.

Check specifically:
- `operation-runner*.ts`, `generate-db-cli-mode*`, `run-tool.ts.template`, and the resource-command
  argv/env construction;
- how `seed` resolves its connection string versus how `init`/`migrate`/`generate` resolve theirs;
- whether S8's D-07 observability work (`stripVTControlCharacters`, `actionableStderr`) now exposes
  a fuller error than the console shows — use it.

Compare against `origin/main`'s `seed` path to state exactly what S8 changed.

### Step 3 — repair

Repair **within #1754**, minimally, with **focused regression coverage that is red without the fix**.
Do **not** make the gate green by weakening it: no skipping `database.seed`, no catching the Prisma
error, no seeding around the failure, no tier exclusion, no timeout inflation.

If the artifacts prove the cause is genuinely outside S8, say so with the evidence rather than
forcing a repair — but note the containment table above is strong, so a claim of external cause needs
strong evidence.

### Runtime

**Do not start Aspire, Docker, or an AppHost.** Host leases are serialized and you hold none. CI
delivers the runtime verdict; the supervisor releases the run under a one-at-a-time admission rule.

### Verification before pushing

Scoped `deno check --unstable-kv`, lint, fmt on every changed file; focused tests for the touched
areas plus your regression test; repo-wide `deno task check` (`failedBatches: 0`).

### Push

Branch `feat/aspire-13-5-s8-typed-resource-commands` at **`d1c6d8b54`**. `git ls-remote` immediately
before pushing; fast-forward expected — if a force would be required, stop and report.

### Out of scope

No rebase (you are already on current `main`), no PR base change, no label or lifecycle change, no
touching S9/S10. **No self-dispatched evaluator** — the supervisor dispatches a delta IMPL-EVAL if
product bytes move.

### Report back

The Prisma `code` + `meta` from both artifacts; what S8 changed on the `seed` connection/execution
path; the confirmed mechanism; the repair; the regression test name and its red-without-fix proof;
verification exit codes; the new head; and confirmation the worktree is clean and the push landed.
