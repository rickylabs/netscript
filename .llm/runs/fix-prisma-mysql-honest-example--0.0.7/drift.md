# Drift Log: prisma-mysql-honest-example (#1112)

No other lane's artifact was edited. This record incorporates the coordinator amendment in place as
explicitly directed; it does not leave the superseded envelope as the current plan.

## 2026-08-28 — Coordinator widened the product envelope 5 → 7

- **What:** The coordinator added `packages/prisma-adapter-mysql/examples/basic-usage.ts` and
  `packages/prisma-adapter-mysql/tests/connection_errors_test.ts` to the frozen product envelope.
- **Source:** coordinator exact-main audit at `cf648f1ff973d74c213bb125a6f5f5b9328e693b`.
- **Reason:** The checked-in example repeats the false Deno-driver story, comments out every Prisma
  operation, substitutes a connected-adapter raw query, and manually disposes it. The existing
  connection-error test already owns injected `FakePoolClient` cleanup behavior and is therefore the
  non-duplicative home for mapping and successful-close evidence.
- **Previous constraint:** The example and focused test were outside the authorized product set, so
  acceptance rows 2 and 5 could not be completed honestly.
- **Current constraint:** Exactly seven named product paths are authorized. An eighth product path
  is still a hard rescope.
- **Severity:** significant
- **Action:** accepted and incorporated
- **Evidence:** `research.md` rows 39-49; direct base example check selected 1 file with zero
  diagnostics while Prisma code remained comments; focused base test passed 33/33 without mapping or
  positive close-count assertions.

## 2026-08-28 — TLS identity mode is accepted but not implemented as named

- **What:** `MySqlConnectionConfig.tls.mode` accepts `'verify_identity'`, but base translation only
  adds joined `ssl.ca` when custom CAs are non-empty and does not enable mysql2 hostname identity
  verification.
- **Source:** `packages/prisma-adapter-mysql/src/types.ts:23-29`;
  `packages/prisma-adapter-mysql/src/adapter.ts:725-743`; installed mysql2 3.22.5 `SslOptions`.
- **Expected:** Every advertised option has observable behavior matching its name.
- **Actual at base:** Without non-empty `caCerts`, `ssl` is left unset, so the connection is
  plaintext and no TLS is requested. With non-empty `caCerts`, only joined `ssl.ca` is forwarded;
  mysql2 hostname identity verification is not enabled.
- **Severity:** significant
- **Action:** deprecate the existing public member and document/characterize its exact legacy
  behavior without changing runtime semantics.
- **Resolution design:** add a JSDoc `@deprecated` tag in the existing `src/types.ts` surface and
  aligned documentation; direct-test both legacy translator branches through the source-only export.
  Do not add a replacement mode or change the generated mysql2 options.
- **Boundary:** no public-barrel export and no runtime injection port.
- **Deferred:** any behavior change or removal requires a separately scoped breaking change.

## 2026-08-28 — Exact-pin mysql2 probe transiently modified `deno.lock`

- **What:** The explicit exact-pin mysql2 import probe transiently added this resolution beside the
  existing `npm:mysql2@^3.22.5` entry: `"npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3",`.
- **Cause:** The worktree was clean before probing; `deno info npm:mysql2@3.22.5` requested the
  exact specifier represented by the added lock entry. This side effect was caused by this research
  turn, not carried in from another owner.
- **Detection:** Existing gate 15, the direct git/lock/path truth check, reported `deno.lock` in
  `git status` and `git diff --name-only` before staging or commit.
- **Action:** Inspected the one-line diff, removed only that generated exact-pin entry, and reran
  the direct comparison against immutable base `cf648f1ff973d74c213bb125a6f5f5b9328e693b`.
- **Final state:** `deno.lock` was byte-identical to base before every commit and never entered the
  branch history. No lockfile or cache was deleted.
- **Severity:** transient process side effect
- **Prevention:** Keep gate 15 as written and run future exact dependency probes with lock writes
  disabled or from an isolated scratch context.

## 2026-08-28 — Artifact allowlist omitted harness supervisor bootstrap, then was amended

- **What:** Harness activation requires `supervisor.md`, but the original leaf grant allowed
  creation of only `research.md`, `plan.md`, `context-pack.md`, `worklog.md`, and `drift.md` in this
  run dir.
- **Source:** user task artifact allowlist versus `.llm/harness/workflow/activation.md` mandatory
  artifact list.
- **Expected:** Activated run includes `supervisor.md`.
- **Actual at discovery:** Creating it would have violated the explicit turn contract, so the file
  was not created and the omission was recorded here and in `context-pack.md`.
- **Severity:** significant
- **Initial action:** Preserve the five-file allowlist and record the activation variance rather
  than silently exceeding scope or claiming a waiver.
- **Coordinator ruling:** No waiver. The allowlist was amended by exactly one control-plane path,
  `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/supervisor.md`. This is not an eighth product
  path and does not widen the seven-path product envelope.
- **Resolution:** Resolved by the bounded allowlist amendment. `supervisor.md` now pins topic and
  leaf ownership, author route, seven-path ceiling, stop line, TLS ruling, seam boundary, both
  Tier-A passes, and the reverted lock-probe history.
- **Current evidence:** the run directory contains the six authorized harness artifacts, including
  the mandatory supervisor identity record. No product path or `deno.lock` was changed.

## 2026-08-28 — PLAN-EVAL cycle 1 rejected the unresolved generated-client import

- **What:** PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`. D3
  named a “real generated client” but neither fixed the package example's import specifier nor
  proved that the actual file could resolve it without an eighth committed path.
- **Source:** fresh opposite-family evaluator comment on draft PR #1711, F1; evaluator also returned
  F2 (hard-coded driver-claim count), F3 (missing research/plan PR comments), and F4 (incomplete JSR
  audit path).
- **Severity:** blocking plan defect for F1; advisory record/gate defects for F2-F4.
- **Probe:** In a detached scratch worktree at the evaluated head, the prospective actual example
  imported exactly `./.generated/client.ts`. An uncommitted `.llm/tmp` schema generated a real
  Prisma 7.8.0 Deno client into that location, and the structured actual-file checker was used as
  the verdict source. No ambient declaration, `// @ts-ignore`, or ungenerated `@prisma/client` `any`
  stub was used.
- **Finding inside F1:** The real client rejected `PrismaMySqlAdapterFactory` because
  `PrismaMySqlResultSet.columnTypes` was declared as `number[]`, wider than Prisma's
  `SqlResultSet.columnTypes`. The implementation already maps to Prisma column types.
- **Resolution design:** Keep exact `./.generated/client.ts`; generate it only as uncommitted gate
  output from `.llm/tmp`; narrow the declaration in approved `src/adapter.ts` to
  `SqlResultSet['columnTypes']`. The same structured check then exited 0 with one selected file and
  zero diagnostics. No runtime behavior changes.
- **Scope result:** The seven approved paths are sufficient. No schema, generated client, import
  map, config, or other eighth product path is added. The detached scratch worktree and generated
  output were removed, and the leaf worktree/lock remained clean.
- **Other repairs:** Census acceptance now applies every `Correct`/`Delete` table row and permits
  only the legacy debug namespace to remain; the JSR gate names
  `.llm/tools/fitness/audit-jsr-package.ts`; research and plan PR comments are required on the
  repaired head.
- **Stop line:** Cycle 2 has not been launched. Formal PLAN-EVAL remains selected for #1112 under
  the critical/complex/decision-heavy policy, pending a separate coordinator grant; no product
  implementation is authorized.

## 2026-08-28 — Tier-A found permanent post-cleanup `TS2307` in the first F1 repair

- **What:** Fresh Tier-A failed plan head `3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone.
  The literal checked-in `./.generated/client.ts` import passed only during the scratch generation
  window. After cleanup, ordinary package-root checking selected 12 files and failed `TS2307`. Gate
  5 selected only `mod.ts`, so the plan had no post-cleanup resolvability evidence.
- **Accepted from that head:** F2 census authority, F3 PR phase trail, and F4 full JSR tool path.
- **Rejected alternative:** Adding `"exclude": ["examples/**"]` to package `deno.json` is both an
  eighth path and a false green: it stops checking the example rather than resolving it.
- **Severity:** significant plan defect; no product mutation had occurred.
- **Re-derivation:** Created a pristine tracked-files-only `git archive` at the failed head and
  applied the prospective dynamic shell there. With no generated output, the ordinary structured
  root wrapper selected all 12 package files, reported zero failed batches/diagnostics, and exited
  0. No exclusion or scratch config was used. After the specialized gate and removal of generated
  output, the same command again selected 12 and exited 0.
- **Resolution design:** The checked-in example computes
  `new URL('./.generated/client.ts', import.meta.url).href` and dynamically imports that non-literal
  URL. Gate 1 proves only the stable tracked shell—adapter construction and query/`finally` cleanup
  control flow. `PrismaClient` and `prisma` are untyped in that gate; the plan must not call it full
  generated-client type checking.
- **Specialized evidence:** Gate 5 generates a real Prisma 7.8 Deno client, statically checks a
  scratch-only compatibility wrapper covering factory construction, `$queryRawUnsafe`, and
  `$disconnect()` in `finally`, then imports the actual example module. The import smoke exited 0
  and printed `dynamic-import-smoke:ok`. Since `import.meta.main` was false, no query or MySQL
  connection ran.
- **Scope result:** Both jobs pass inside the existing seven product paths. No eighth path,
  generated artifact, config, schema, lockfile, ambient declaration, ignore, or package exclusion is
  planned.
- **Stop line:** Fresh Tier-A must pass the pushed repair before any PLAN-EVAL cycle-2 grant or
  dispatch. No implementation is authorized.

## 2026-08-28 — PLAN-EVAL cycle 2 rejected the unnecessary non-literal import

- **What:** PLAN-EVAL cycle 2 evaluated plan head `da769cd7c8e0438f2317ed761ec10bce15692d03` as
  terminal `FAIL_PLAN` on F1-b. The second repair's non-literal URL kept clean-root checking green
  but made the generated `PrismaClient` and `prisma` `any` in the actual checked-in example.
- **Source:** evaluator artifact commit `60cf79ee54ca17dfaa7d62c609290993040539f9`,
  `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/plan-eval-cycle-2.md`, and public comment
  `5454993523`; the supervisor independently reproduced the load-bearing behavior on Deno 2.9.5.
- **Terminology correction:** The preceding Tier-A entry's “literal checked-in import” was a static
  import. Static import with generated output absent produces `TS2307`. Literal _dynamic_
  `await import('./.generated/client.ts')` is deferred to runtime and stays green when output is
  absent.
- **Measured correction:** With generated output absent, the ordinary root wrapper selected 12 files
  with zero failures before generation and after cleanup. With the real Prisma 7.8 client present
  under the scratch config, a deliberate assignment of `PrismaClient` to `number` produced `TS2322`,
  proving the actual example retained the generated type rather than `any`. Passing the connected
  adapter instead of the factory produced `TS2741`.
- **Owner ruling:** Replace the non-literal URL with the literal dynamic import; gate 5 checks the
  actual example under the scratch config, while the compatibility wrapper remains focused D17
  evidence and the import-only smoke remains. Gate 1 continues to leave client values untyped while
  output is absent and is undefined during the generated window.
- **Advisories folded:** Owned example/README prose states that generated output needs
  `@prisma/client` resolvable through the consumer import map or an `npm:` specifier. The smoke pins
  `import.meta.main` as a precondition and requires `main()` invocation to stay exclusively inside
  that guard.
- **Architecture framing:** This is a temporary Prisma 7 correctness measure ahead of imminent
  Prisma 8 and the Prisma-next database-layer rewrite. It adds no abstraction, architecture
  commitment, runtime behavior, or product path.
- **Scope/stop result:** Exactly five run artifacts are amended; `supervisor.md`, all seven product
  paths, and `deno.lock` remain untouched. There is no cycle 3 or third evaluator. The generator
  stops before fresh focused Tier-A and does not self-certify or implement.

## 2026-08-29 — D17 source spelling adjusted to preserve doc-lint

- **What:** The planned public declaration `SqlResultSet['columnTypes']` made the full export-map
  `deno doc --lint` gate fail `private-type-ref` because `SqlResultSet` is imported from
  `@prisma/driver-adapter-utils` but is not part of this package's public root.
- **Measured evidence:** The structured actual-example check with a real Prisma 7.8 client passed
  after D17, but `deno task doc:lint --root packages/prisma-adapter-mysql --pretty` reported one
  `private-type-ref` at the public `PrismaMySqlResultSet.columnTypes` declaration.
- **Resolution:** Spell Prisma 7's closed numeric `ColumnType` union inline on `columnTypes`. This
  remains structurally assignable to Prisma's `SqlResultSet`, keeps the real-client check green, and
  avoids re-exporting upstream types or inventing a new public alias.
- **Boundary:** Type-only, within approved `src/adapter.ts`; runtime mapping is unchanged. This is
  part of the temporary Prisma 7 correctness measure, not durable architecture.
- **Severity:** minor implementation drift required by an already-selected gate.

## 2026-08-29 — Public legacy-type deletion landed with its barrel update

- **What:** Slice 1 changed `src/types.ts` but temporarily retained the stale legacy declarations so
  its pushed commit remained independently type-checkable while `src/mod.ts` still re-exported them.
- **Resolution:** Slice 2 removes the declarations and their root re-exports together. The final
  seven-path result matches D9 and the census; no stale or broken intermediate public barrel is
  committed.
- **Severity:** minor sequencing drift; product scope and two-slice order are unchanged.

## 2026-08-29 — Optional D17 scratch wrapper dropped during implementation

- **Planned evidence:** Gate 5 retained `.llm/tmp/prisma-example-compatibility.ts` as a focused D17
  wrapper alongside the structured check of the actual example and the guarded import-only smoke.
  This supersedes the historical statement at line 165 that the wrapper remained D17 evidence; that
  statement accurately records the earlier owner amendment and is intentionally preserved.
- **Implemented evidence:** The optional wrapper was dropped. The structured check of the actual
  `examples/basic-usage.ts` caught the identical D17 defect with the same `TS2322` and exercised the
  same factory construction, `new PrismaClient({ adapter })`, `$queryRawUnsafe`, and `finally`
  disconnect path against the real generated Prisma 7 client.
- **Measured justification:** Keeping a second scratch program would duplicate the load-bearing
  actual-file evidence without increasing coverage. Gate 5 therefore consists of the structured
  actual-example check under the scratch config followed by the guarded import-only smoke.
- **Boundary:** Evidence-neutral implementation-versus-plan drift only. No product behavior, product
  path, generated output, configuration, or lockfile changed as a result.

## 2026-08-29 — Agent-docs corpus freshness gate omitted from the plan

- **What:** The selected gate set omitted `deno task check:agent-docs-prose` even though this leaf
  edits `docs/site/reference/prisma-adapter-mysql/index.md`, whose rendered page is listed in
  `.llm/assets/agent-docs/provenance.json` and therefore ships in the checked-in agent-docs prose
  corpus.
- **Detection:** CI's `quality` job caught stale `prose.json.gz` and `provenance.json` only after
  supervisor Tier-A and IMPL-EVAL cycle 1 had passed. This is a generated-cascade gate gap, not a
  defect in the accepted seven-path product change.
- **Resolution:** Ran `deno task gen:agent-docs-prose` rather than hand-editing generated output,
  then `deno task check:agent-docs-prose` exited 0 with `fresh: true` and no stale paths. Only the two
  tracked agent-docs assets were regenerated; the seven-path product ceiling is unchanged.
- **Future gate:** Any leaf touching a documentation page listed in `provenance.json` must include
  `deno task check:agent-docs-prose` in its gate set and regenerate the corpus when the check reports
  staleness.
- **Boundary:** Generated harness assets and run artifacts only; no product path or `deno.lock`
  change.
