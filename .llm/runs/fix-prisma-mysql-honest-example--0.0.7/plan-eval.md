# PLAN-EVAL — fix-prisma-mysql-honest-example--0.0.7 (cycle 1)

- Plan evaluator session: native Claude Fable 5 · medium, fresh session, bg job `29284a3f`,
  2026-08-28. Opposite family to the generator (Codex `gpt-5.6-sol` · high, thread `01a047f1-…`).
- Run: `fix-prisma-mysql-honest-example--0.0.7` — issue #1112, draft PR #1711
- Evaluated head (immutable): `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Evaluator worktree: `/home/codex/repos/netscript-007-eval-1711` (detached; the author's worktree
  was not entered)
- Surface / archetype: `@netscript/prisma-adapter-mysql` — Archetype 2 (integration)
- Scope overlays: `docs`

## Verdict

**`FAIL_PLAN`** (harness vocabulary) — PR-comment vocabulary `CHANGES_REQUESTED`.

One Plan-Gate box is unchecked: the **open-decision sweep**. The plan commits to a gate
(gate 1: compile-check `examples/basic-usage.ts` as the actual file with a live generated
`PrismaClient` import) that cannot go green inside the seven-path ceiling as the plan is written,
and it does not say which import specifier the example will use or how that specifier resolves
under `deno check`. Deferring that decision forces rework of D3, gate 1, or the envelope. Everything
else the brief asked me to test independently holds; findings F2–F4 are advisory.

## Identity (executed)

| Check | Command | Result |
| --- | --- | --- |
| Local head | `git rev-parse HEAD` | `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` |
| Remote head | `git ls-remote origin fix/prisma-mysql-honest-example` | `069fd3e9…` — equal |
| PR head | `gh pr view 1711 --json headRefOid,isDraft,labels` | `069fd3e9…`, draft, labels `type:docs status:plan priority:p1 area:database` |
| Worktree | `git status --porcelain \| wc -l` | `0` (clean, before and after every probe) |
| Merge-base | `git merge-base HEAD cf648f1f…` | `cf648f1f…` — base is an ancestor |
| Diff envelope | `git diff --stat cf648f1f… HEAD` | 6 files, all under `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`; **no product path touched** |
| Lock history | `git log --name-only cf648f1f…..HEAD \| grep -c deno.lock` | `0` |

Identity holds; the head is not moving.

## Plan-Gate checklist

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` re-baselined against `cf648f1f…` (`research.md:3-26`). Spot-checks below (TLS source, `onConnectionError`, Prisma 7 adapter type, base gates) all reproduce. |
| Decisions locked | PASS | D1–D16 with rationale (`plan.md:94-113`). D2 verified against `@prisma/client@7.9.1` `runtime/library.d.ts:782` — `adapter?: SqlDriverAdapterFactory`. |
| Open-decision sweep | **FAIL** | F1 below: the example's `PrismaClient` import path / resolvability is an unflagged open decision that forces rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS | Two slices, each naming proof, files, and gates (`plan.md:146-154`); every file is inside the seven-path ceiling. |
| Risk register | PASS | `plan.md:179-192`; mitigations map to D12/D13/D14/D16. The "example type-checks while its Prisma code remains dead" risk is listed but its mitigation assumes gate 1 can pass — see F1. |
| Gate set selected | PASS (with F1 caveat) | 15 gates (`plan.md:156-177`). All commands exist: `quality:gate` (`deno.json:52`), `docs:accuracy` (`:86`), `doc:lint` (`:133`), `arch:check` (`:164`), `check:source-format` (`docs/site/deno.json:5`), `run-deno-check.ts --file` (`.llm/tools/run-deno-check.ts:180`). Gate 12's script lives at `.llm/tools/fitness/audit-jsr-package.ts` (plan omits the path — F4). No runtime/Aspire/Docker/browser/`e2e:cli` gate is planned (`plan.md:176-177`, `supervisor.md:62`). |
| Deferred scope explicit | PASS | Seven named deferrals (`plan.md:205-217`), including the TLS behaviour change as a separately scoped breaking change (item 7). |
| jsr-audit surface scan (pkg/plugin) | PASS | `research.md:207-215`; base dry-run 8 files / no slow-type diagnostic; pre-1.0 legacy-type deletion flagged as a public-surface change. |

## Claims tested independently

### 1. Source-only seam — holds

- `packages/prisma-adapter-mysql/deno.json` export map: `"." → "./mod.ts"`. Root `mod.ts` is
  `export * from './src/mod.ts'` — so the **package root surface is exactly `src/mod.ts`'s export
  list**; any name added to `src/mod.ts` propagates to JSR automatically. The plan's prohibition on
  re-exporting from `src/mod.ts` (D13/D14, Non-Scope, gate 14) is therefore the correct and
  sufficient boundary.
- `deno doc --filter toMysql2PoolOptions packages/prisma-adapter-mysql/mod.ts` → `Node
  toMysql2PoolOptions was not found!` (absent from the published root today).
- `deno doc packages/prisma-adapter-mysql/mod.ts` lists `PrismaMySql`, `PrismaMySqlAdapterFactory`
  (reference), `inferCapabilities`, and 12 types; `PrismaMySqlAdapter` is not published. The plan
  keeps it that way (D14).
- No runtime injection port is planned (D14; Non-Scope `plan.md:81`; Deferred item 4).

### 2. Legacy TLS disposition — holds; stated behaviour matches source

- Source, `src/adapter.ts:738-740`:
  `if (config.tls?.mode === 'verify_identity' && config.tls.caCerts?.length) { options.ssl = { ca:
  config.tls.caCerts.join('\n') }; }` — nothing else touches `ssl`.
  - Without non-empty `caCerts`: `ssl` is never set → mysql2 receives no `ssl` → plaintext, no TLS
    requested. Plan D12 states exactly this.
  - With non-empty `caCerts`: only `ssl.ca` (joined by `\n`) is forwarded; `verifyIdentity` is not
    set. Plan D12 states exactly this. Neither branch is over- or under-stated.
- No behaviour flip at HEAD: `grep -rn verifyIdentity .llm/runs/fix-prisma-mysql-honest-example--0.0.7/`
  hits only `supervisor.md:67` (the prohibition) and `supervisor.md:90` (the history row).
  `plan.md` and `research.md` at HEAD contain zero occurrences. No replacement mode is introduced
  (D12 "add no replacement mode"; Non-Scope `plan.md:88-90`; Deferred item 7).
- Characterization tests that pin both branches (`plan.md:72-73`, `research.md:136-138`) are the
  right instrument for a deprecate-without-change ruling: they make the deprecation notice
  falsifiable and will fail loudly when the separately scoped breaking change lands. The deferral
  is named, not silently omitted.

### 3. `supervisor.md` is control-plane only and its Tier-A history is truthful — holds

- Commit trail (`git log --name-only cf648f1f…..HEAD`): five commits, every file under the run
  dir; `supervisor.md` first appears in `069fd3e91` alongside `context-pack.md`, `drift.md`,
  `worklog.md`. It is not a product path.
- Tier-A history verified against git:
  - `git show 7a3639969:…/plan.md | grep -n verifyIdentity` → line 101: D12 "always set mysql2
    `ssl.verifyIdentity: true`"; line 180 risk-register row.
  - `git show 7a3639969:…/research.md | grep -n coordinator-authorized` → line 130: "The
    coordinator-authorized correction is to forward `ssl.verifyIdentity: true`…".
  - `git show 34a6e3d98:…/plan.md | grep -n verifyIdentity` → no matches.
  The history rows at `supervisor.md:90-91` describe exactly this. The record does not soften it.
- Advisory (F3): the Tier-A reviews and the plan phase have **no PR comment trail** —
  `gh pr view 1711 --json comments` → `0` comments. The harness commit-trail rule expects a phase
  comment per phase; the Tier-A passes are currently only asserted inside `supervisor.md`.

### 4. Exact identity — holds (table above).

### 5. NOT_RUN / runtime boundaries — holds, except gate 1

- `plan.md:176-177` and `supervisor.md:62` state no runtime, Aspire, Docker, browser, `e2e:cli`, or
  release gate. Gates 2–15 are static or unit-level and I reproduced the two base measurements the
  plan relies on:
  - `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts` →
    `filesSelected:1`, `uniqueOccurrences:0` (matches `research.md:199`).
  - `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts`
    → `passed:33 failed:0` (matches `research.md:202`).
- Gate 1 is **not** achievable as written — F1.

### 6. Plan-gate specifics

- **Falsehood census** — over-precise. See F2.
- **Option-surface audit vs acceptance row 4** — complete. `research.md:117-130` traces every
  `MySqlConnectionConfig` field and both `PrismaMySqlOptions` fields to `adapter.ts:727-739` /
  `:34-52` / `:624-627`; I confirmed the `toMysql2PoolOptions` body (`adapter.ts:725-743`) reads
  exactly those seven top-level fields plus `tls`. The only accepted-but-not-honestly-implemented
  option is `verify_identity`, and its disposition is deprecation (row 4 permits "remove/deprecate").
- **`onConnectionError`** — published at `src/types.ts:34-45` (JSDoc contract `:37-42`, member
  `:44`); site `index.md:23` claims it is unsupported. Research row 7 and D8 correct this. Holds.
- **Example compile-checked as the actual file** — planned (gate 1, D3, `plan.md:58-59`) but not
  achievable — F1.
- **Seven paths, one story** — the "Coherent example contract" (`plan.md:129-144`) fixes one
  sequence (factory → `new PrismaClient({ adapter })` → one query → `$disconnect()` in `finally`)
  for site, README, module JSDoc, adapter JSDoc, and the example. Coherent as designed; F1 is the
  only place the story cannot be executed as specified.

## Findings

### F1 — BLOCKING (open-decision sweep): the example's `PrismaClient` import cannot type-check under D3 + the seven-path ceiling

**Claim in plan:** D3 (`plan.md:100`) — "the checked-in package example uses its stated `prisma
generate` prerequisite and a real generated `PrismaClient` import rather than an ambient
declaration"; gate 1 (`plan.md:160`) — "live generated-client import, factory construction, Prisma
query, and cleanup type-check" on the actual file; risk register (`plan.md:184`) requires "the
actual file plus a content review proving live `PrismaClient`".

**Evidence:**

1. No generated client exists in the repository:
   `find . -path ./node_modules -prune -o -name client.server.ts -print` and
   `… -path "*/.generated/*" -name "*.ts" -print` → no output. Committing one is Deferred item 3
   (an eighth path).
2. `@prisma/client` does not resolve from the package. It appears in root `deno.json` only under
   `"catalog"` (`deno.json:235`), not under `"imports"`, and `packages/prisma-adapter-mysql/deno.json`
   has no `imports`. Probe (scratch file placed beside the example, deleted immediately; worktree
   clean afterwards):
   ```
   deno check --unstable-kv packages/prisma-adapter-mysql/examples/__plan_eval_probe.ts
   TS2307 [ERROR]: Import "@prisma/client" not a dependency and not in import map
   exit=1
   ```
   No workspace `.ts` imports `@prisma/client` today (`grep -rln "from '@prisma/client'" packages
   docs/site` → none).
3. Even if it were mapped, Prisma 7's `@prisma/client` entry is `export * from
   '.prisma/client/default'` (`~/.cache/deno/npm/registry.npmjs.org/@prisma/client/7.9.1/default.d.ts`),
   i.e. a generated-output re-export, and its ungenerated stub types `PrismaClient` as `any`
   (`scripts/default-index.d.ts:19,35`) — so a `deno check` pass through that path would not be the
   semantic evidence gate 1 claims.
4. A relative import of a non-existent generated path fails `deno check` with a module-not-found
   error; a `// @ts-ignore` or ambient `declare` is exactly what D3 forbids.

**Consequence:** gate 1 cannot report green on the implementation head without one of: (a) an
eighth path (fixture or an `imports` entry in the package `deno.json`, which is a config path the
ceiling names as a rescope), (b) reversing D3 (ambient/narrowed declaration), or (c) honestly
re-labelling gate 1 as conditional on a consumer-supplied generated client (i.e. `NOT_RUN` in this
leaf, with the "semantic evidence" claim withdrawn). The plan chooses none of these and its
open-decision sweep (`plan.md:115-127`) lists "Actual example path — Resolved: owned" as closed. It
is not closed. Whichever option is chosen, D3, gate 1, slice 2's proving gate, the risk-register
row, and research row 41/44 must be amended together — that is rework, hence `FAIL_PLAN`.

**Required fix (plan-level, not code):** state the exact import specifier `examples/basic-usage.ts`
will carry, show (with a probe like the one above) that `run-deno-check.ts --file` on that file
resolves it inside the seven paths, and rewrite gate 1's expected result accordingly. If resolution
needs an eighth path, return to the coordinator for a rescope ruling before PLAN-EVAL cycle 2.

### F2 — ADVISORY (accuracy): "exactly eight Deno-native prose locations" under-counts its own census

`research.md:105-110` and `context-pack.md` say the count is "exactly eight": README `:13`, `:20`;
`src/mod.ts:4-5`; `src/types.ts:92`; `src/adapter.ts:173`, `:216`, `:333`; `examples/basic-usage.ts:4`.
Executed: `grep -in -E "deno[-_ ]native|deno_mysql|deno mysql|Deno's native" <seven paths>` also
returns:

- `packages/prisma-adapter-mysql/README.md:7` — "through Deno's native MySQL driver" (census row
  15 covers `:7-8` as Correct, but it is excluded from the eight);
- `docs/site/reference/prisma-adapter-mysql/index.md:100` and `:104` — "`deno_mysql` client"
  (census row 14, Delete — also excluded).

Every occurrence has a disposition in the 49-row table, so this does not force rework. But gate 13
(`plan.md:172`) sets its expected result as "Eight Deno-native prose locations corrected", which an
implementer can satisfy while leaving `README.md:7` or the site driver table untouched. Fix: make
gate 13's expected result "every Correct/Delete row in the census table, re-run the grep, only
`adapter.ts:30` remains" and drop the hard-coded count.

### F3 — ADVISORY (process): no PR comment trail for research, plan, or the two Tier-A passes

`gh pr view 1711 --json comments` → `0`. The harness commit-trail rule and `netscript-pr` expect one
phase comment per phase; `supervisor.md:88-91` asserts two Tier-A PASSes with no PR-visible record.
Not a Plan-Gate box; recorded so the coordinator can decide whether to backfill before cycle 2.

### F4 — ADVISORY (precision): gate 12 names `audit-jsr-package.ts` without its path

The script is `.llm/tools/fitness/audit-jsr-package.ts`. Minor; add the path so the implementer runs
the right tool.

## Open-decision sweep (evaluator-run)

1. **Example `PrismaClient` import specifier and its `deno check` resolvability** — open, forces
   rework (F1).
2. Everything else the plan lists as resolved I could confirm against source or git: seam shape,
   test ownership, TLS disposition, debug namespace, legacy-type deletion (repo-wide
   `grep -rn -E "\b(DenoMySqlClient|DenoMySqlConnection|QueryResult|FieldInfo|ExecuteResult)\b"`
   finds consumers only in `src/mod.ts:53-55` and the site table `index.md:104-106`, both inside the
   ceiling).

## Verdict restated

`FAIL_PLAN` — cycle 1 of 2. Return to Plan & Design for F1; F2–F4 may be folded into the same
revision. Do not begin implementation on `069fd3e9…`.

Nothing outside this file was modified in this worktree; no product, test, docs, or lock path was
touched, no label or readiness state was changed, and no runtime lease was taken.
