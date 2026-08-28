# PLAN-EVAL cycle 2 — fix-prisma-mysql-honest-example--0.0.7

- Plan evaluator session: native Claude Fable 5 · medium, fresh session, 2026-08-28; distinct from
  the author (Codex `gpt-5.6-sol` thread `01a047f1-…`), the topic supervisor, and the cycle-1
  evaluator
- Evaluator worktree: `/home/codex/repos/netscript-007-eval-1711-c2` (detached, evaluator-only)
- Run: `fix-prisma-mysql-honest-example--0.0.7` · issue #1112 · draft PR #1711
- Evaluated head: `da769cd7c8e0438f2317ed761ec10bce15692d03` (immutable)
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Surface / archetype: `@netscript/prisma-adapter-mysql` · Archetype 2 (Integration)
- Scope overlays: docs
- Scope of this cycle: the repaired F1 architecture and the five Tier-A claims only. Cycle-1 F2–F4
  and the accepted items (seven-path envelope, source-only `toMysql2PoolOptions` seam, non-breaking
  TLS deprecation, `supervisor.md`, census wording) were not re-litigated and are not broken by the
  F1 repair.

## Head identity

| Check                                                            | Result                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `git rev-parse HEAD`                                             | `da769cd7c8e0438f2317ed761ec10bce15692d03`                           |
| `git ls-remote origin fix/prisma-mysql-honest-example`           | `da769cd7c8e0438f2317ed761ec10bce15692d03`                           |
| `gh pr view 1711 --json headRefOid,isDraft,baseRefName`          | `da769cd7c…` · draft=true · base=main                                |
| `git status --porcelain \| wc -l`                                | `0`                                                                  |
| `git merge-base HEAD cf648f1f…`                                  | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                           |
| `git diff --stat cf648f1f… HEAD`                                 | 6 files, all under `.llm/runs/…/`; no product path touched (plan phase) |

## Reproduction environment

All probes ran in a pristine tracked-files-only archive, not in any worktree:
`git archive da769cd7c… \| tar -x -C $CLAUDE_JOB_DIR/tmp/archive` (no `.git`, no untracked
residue). The plan pins only the two dynamic-import lines of the prospective example (D3) plus its
prose contract; the evaluator wrote a minimal example satisfying that contract (import `PrismaMySql`,
non-literal URL dynamic import at module scope, factory → `new PrismaClient({ adapter })` →
`$queryRawUnsafe('SELECT 1 + 1 AS result')` → `$disconnect()` in `finally`, `main()` guarded by
`import.meta.main`). The gate-5 scratch schema, scratch `deno.json`, and compatibility wrapper were
written byte-for-byte from the plan. Toolchain: deno 2.9.5, Prisma 7.8.0.

## The five Tier-A claims — re-derived

| # | Claim                                                                     | Command (in archive)                                                                                                                                                                | Result                                                                                                                                                | Status     |
| - | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1a | Clean archive, ordinary root, 12 files, green **before** generation      | `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx` with no `.generated`                                                                                          | `filesSelected:12, failedBatches:0, uniqueOccurrences:0`, exit 0                                                                                       | reproduces |
| 1b | `examples/basic-usage.ts` is genuinely **selected**                       | appended `const deliberateRed: number = 'not-a-number';` to the example; same command                                                                                               | `failedBatches:1`, `TS2322` at `examples/basic-usage.ts:45:7`, exit 1 → the example is type-checked, not skipped                                       | reproduces |
| 1c | Green **after** cleanup                                                   | after gate 5: `rm -rf examples/.generated .llm/tmp/prisma-example*`; same command                                                                                                   | `filesSelected:12, failedBatches:0, uniqueOccurrences:0`, exit 0; `find . -name .generated` empty                                                      | reproduces |
| 2a | Wrapper **fails** at unmodified source                                    | `prisma@7.8.0 generate` (exit 0) then `run-deno-check.ts --file .llm/tmp/prisma-example-compatibility.ts --ext ts --deno-arg --config=.llm/tmp/prisma-example-check-deno.json`      | `TS2322 Type 'PrismaMySqlAdapterFactory' is not assignable to type 'SqlDriverAdapterFactory'` at wrapper `11:37`, `failedBatches:1`                    | reproduces |
| 2b | Wrapper **passes** with D17                                               | `sed` `columnTypes: number[]` → `columnTypes: SqlResultSet['columnTypes']` at `src/adapter.ts:522`; same command                                                                     | `filesSelected:1, failedBatches:0, uniqueOccurrences:0`, exit 0                                                                                        | reproduces |
| 3  | Import-only smoke prints marker without MySQL                             | `deno eval --no-lock --config=.llm/tmp/prisma-example-check-deno.json 'await import(new URL("./packages/prisma-adapter-mysql/examples/basic-usage.ts", import.meta.url).href); console.log("dynamic-import-smoke:ok")'` | `dynamic-import-smoke:ok`, exit 0                                                                                                                      | reproduces |
| 3-why | The safety is `import.meta.main`, not the absence of network            | ran the same example **as main** with `MYSQL_HOST=127.0.0.1 MYSQL_PORT=1`                                                                                                             | Prisma runtime error thrown from `basic-usage.ts:34` (the `$queryRawUnsafe` line), exit 1 → the query path is live; only the guard keeps the smoke off MySQL | confirmed  |
| 4  | Root-shell evidence separated from semantic evidence                      | read `plan.md` gate 1/gate 5 rows, "Coherent example contract" ¶, risk register row 2, worklog handoff note                                                                         | Every statement says `PrismaClient`/`prisma` are untyped under gate 1 and that only gate 5 proves compatibility. A reader is not misled about what gate 1 proves. | reproduces (see F1-b for what it does not say) |
| 5  | Exclusion / ambient / `@ts-ignore` / `@prisma/client` stub / eighth path forbidden | `grep -n -i -E "ts-ignore\|ts-expect-error\|declare module\|ambient\|\"exclude\"\|exclude.*examples\|stub\|eighth" plan.md`                                                    | Only prohibitions and the eighth-path rescope rule match; D3 and the gate-1 row keep all five forbidden; scratch inputs live under `.llm/tmp` and are deleted | reproduces |

Claim 1 additionally: a **static** `import { PrismaClient } from './.generated/client.ts'` with the
file absent fails `TS2307` (the cycle-1 / Tier-A F1 shape), confirming the failure the repair was
designed around is real.

## Plan-Gate checklist

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` (55 KB) present; spot-checked: `src/adapter.ts:23,634` imports `mysql2/promise` (D1 authority); `src/adapter.ts:522` declares `columnTypes: number[]` (D17 premise) |
| Decisions locked                        | FAIL   | D3 locks "the non-literal specifier is deliberate" on a rationale that does not hold — see F1-b                                                           |
| Open-decision sweep                     | FAIL   | "Actual example import — Resolved" rests on the same false premise; the choice between literal and non-literal dynamic specifier was never weighed        |
| Commit slices (< 30, gate + files each) | PASS   | 2 slices, each names files and proving gates (`plan.md` "Commit slices")                                                                                   |
| Risk register                           | PASS   | present; row "Example recreates the connected-adapter mistake" is mitigated by prose only — see F1-b                                                       |
| Gate set selected                       | PASS   | 15 ordered gates with commands and expected results; matrix-derived plus docs overlay                                                                     |
| Deferred scope explicit                 | PASS   | "Deferred scope / coordinator rescope" lists 7 items                                                                                                       |
| jsr-audit surface scan (pkg/plugin)     | PASS   | gate 12 names `.llm/tools/fitness/audit-jsr-package.ts`; publish dry-run gate 11; translator kept out of the export map (gate 14)                          |

## Findings

### F1-b — BLOCKING — the non-literal specifier discards static evidence that a literal dynamic import keeps, for no gain

**Claim in the plan (D3, gate-1 row, "Coherent example contract"):** the specifier must be
non-literal so that "ordinary checking validates the tracked example shell without statically
resolving absent generated output"; in exchange, `PrismaClient` and `prisma` are accepted as
untyped in the checked-in example, and a *separate* scratch wrapper restores the type evidence.

**Executed evidence that the premise is false.** In the same archive, replacing only the import line
with a **literal** dynamic import — `const { PrismaClient } = await import('./.generated/client.ts');`
— gives:

| Condition                                                       | Non-literal (plan)                    | Literal dynamic import                                        |
| --------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| Gate 1, no `.generated`, ordinary root wrapper                  | 12 selected, 0 failed, exit 0         | 12 selected, 0 failed, exit 0                                 |
| Same, raw `deno check --unstable-kv examples/basic-usage.ts`    | exit 0                                | exit 0 (deno defers unresolvable *dynamic* literal imports to runtime; only the *static* import yields `TS2307`) |
| Gate 1 repeated after cleanup                                   | 12 selected, 0 failed, exit 0         | 12 selected, 0 failed, exit 0                                 |
| Gate 5 smoke, client present, scratch config                    | `dynamic-import-smoke:ok`, exit 0     | `dynamic-import-smoke:ok`, exit 0                             |
| `deno lint examples/basic-usage.ts`                             | clean                                 | clean                                                         |
| **Client present + scratch config, `new PrismaClient({ adapter: 42 })`** | **exit 0 — not caught**      | `TS2322 Type 'number' is not assignable to type 'SqlDriverAdapterFactory'` |
| **Client present, `new PrismaClient({ adapter: await adapter.connect() })`** (the plan's own risk-register mistake, D4) | **exit 0 — not caught** | `TS2741 Property 'connect' is missing in type 'PrismaMySqlConnectedAdapter' but required in type 'SqlDriverAdapterFactory'` |
| **Client present, `prisma.$queryRawUnsafe(42)`**                | **exit 0 — not caught**               | `TS2345 Argument of type 'number' is not assignable to parameter of type 'string'` |

So a literal dynamic import satisfies every gate-1 requirement the repair was built for (selected,
green before generation, green after cleanup, no exclusion, no ambient, no ignore, no stub, no
eighth path) **and** makes the actual checked-in example statically typed against the real generated
client under gate 5. The plan's non-literal choice buys nothing over it and costs:

1. **The wrapper is not the example.** Gate 5 types a hand-copied sequence in `.llm/tmp`, not the
   file that ships. Drift between wrapper and example is invisible to every gate: the table shows
   the example can carry the exact connected-adapter mistake D4/the risk register warn against, or a
   wrong query argument, and both gate 1 and gate 5 stay green. The risk-register mitigation
   "forbid `connect()` in the normal example" is prose; with a literal specifier it is a compiler
   error.
2. **The consumer copies an `any`-typed example.** `await import(nonLiteralUrl)` is `Promise<any>`;
   `PrismaClient`, `prisma`, and the query result are `any` in the shipped file. Nothing in the
   plan's docs surfaces tells a consumer that this shape is a gate accommodation and not the shape
   they should copy (D3 says application docs use a *static* `client.server.ts` import — a different
   shape from the package example, without stating why they differ).
3. **The plan is honest about what gate 1 does not prove, but not about why it gave that up.** Claim
   4 holds as written; the omission is that the sacrifice was avoidable. This is the "trades real
   evidence for a green gate" pattern the cycle brief names, in its mildest form: not an evasion of
   checking, but an unnecessary downgrade of what is checked.

**Why blocking rather than advisory.** D3 is the locked decision the cycle-2 repair exists to
establish, and its stated rationale is contradicted by an executed probe on the repo's own
toolchain. A locked decision on a false premise does not satisfy "Decisions locked with rationale",
and the open-decision sweep marks the import question "Resolved" without having considered the
dominant alternative. The fix is a one-line plan change now; after implementation it becomes a
shipped consumer-facing example plus a gate rewrite.

**Required fix (narrow; nothing else in the plan needs to move):**

1. D3 / Scope bullet / "Coherent example contract" / gate-5 protocol: replace
   `new URL('./.generated/client.ts', import.meta.url).href` + `await import(generatedClientUrl)`
   with the literal `const { PrismaClient } = await import('./.generated/client.ts');`. Record the
   observed behaviour as the rationale: deno 2.9.5 `deno check` defers an unresolvable **dynamic**
   literal import to runtime (exit 0, 12/12 selected, before generation and after cleanup), while a
   **static** import fails `TS2307`.
2. Gate 5: add a structured check of the **actual example file** under the scratch config
   (`run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts --deno-arg --config=.llm/tmp/prisma-example-check-deno.json`),
   expected 1 selected / 0 diagnostics, with the client present. The scratch wrapper may stay as a
   D17 probe or be dropped; it is no longer the sole type evidence. Keep the import-only smoke.
3. Gate 1 row and worklog handoff: keep the statement that gate 1 leaves `PrismaClient`/`prisma`
   untyped (still true with the client absent), and add that gate 5 now types **the example itself**.
4. Risk register row "Example recreates the connected-adapter mistake": mitigation becomes the gate-5
   example check (`TS2741` observed), not prose.

Everything else — D17, the wrapper's D17 evidence, the smoke, the five prohibitions, the seven-path
ceiling — is unaffected by this change and was independently reproduced above.

### A1 — ADVISORY — the example is not runnable from the package without an import map the plan does not mention

Root `deno.json` lists `@prisma/client` only under `catalog:` (line 235), not `imports:`. With the
client generated and **no** scratch config, `deno check examples/basic-usage.ts` fails
`TS2307 Import "@prisma/client/runtime/client" not a dependency and not in import map` from the
generated files. Gate 5 sidesteps this with `.llm/tmp/prisma-example-check-deno.json`, but a reader
following the example header ("generate, then `deno run -A examples/basic-usage.ts`") will hit the
same error. The example prose (or README) should state that the generated client needs
`@prisma/client` resolvable via the consumer's import map / `npm:` specifier. No new path is
needed; it is wording inside owned paths.

### A2 — ADVISORY — gate 1 is only specified for the "absent" state; say so explicitly

During the gate-5 window the ordinary root wrapper would also select `examples/.generated/**`
(no `--exclude` is permitted) and fail on the same import-map gap. The plan already sequences gate 1
strictly before generation and after cleanup; adding one sentence that gate 1 is **undefined** while
`.generated` exists prevents an implementer from reporting a red mid-window run as a defect.

### A3 — ADVISORY — Claim 3's safety is a one-line guard; pin it

`import.meta.main` is the only thing separating the import smoke from a live MySQL attempt (running
the file as main reaches the Prisma query at line 34 and errors out against an unreachable host).
The gate-5 row should name the guard as a precondition, and the implementation should keep `main()`
invocation exclusively inside that guard, so a future edit that hoists the query cannot silently turn
the smoke into a network call.

## Open-decision sweep (evaluator-run)

- Literal vs non-literal dynamic specifier — **must resolve now** (F1-b). Not flagged by the plan.
- No other open decision found that would force rework if deferred.

## Verdict

`FAIL_PLAN`

One blocking finding (F1-b), tied to executed evidence above; three advisories. All five Tier-A
numeric claims reproduce exactly as recorded, and none of the cycle-1 accepted items is broken by
the F1 repair. The required fix is confined to plan wording for D3, gate 5, gate 1, and one risk
row; it adds no product path, no exclusion, no ambient declaration, no ignore, and no stub. This is
the second `FAIL_PLAN` for #1112; the harness loop limit routes the next step to the owner.

## Evaluator boundaries

No product, test, docs, or tooling path was modified in this worktree. No label, readiness, checkbox,
or lease was touched. Archive probes were confined to `$CLAUDE_JOB_DIR/tmp` and left no residue in
any repository checkout.
