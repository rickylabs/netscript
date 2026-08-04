use harness

# Implementation Prompt — S1: `--allow-ffi` reaches every sqlite resource

Run: `test-e2e-sqlite-runtime-tier--1158` · Issue **#1158** · Draft PR **#1220** Branch:
`test/e2e-sqlite-runtime-tier-1158` · Worktree: `/home/codex/repos/ns-1158` Baseline for this slice:
`dd178da7`

PLAN-EVAL returned **`PASS`** (`.llm/runs/test-e2e-sqlite-runtime-tier--1158/plan-eval.md`).
Implementation is unblocked. **You implement S1 only.** Do not start S2–S7.

## SKILL

Activate and follow, in this order:

1. `.agents/skills/netscript-harness/SKILL.md` — run loop, slice discipline, commit trail.
2. `.agents/skills/netscript-doctrine/SKILL.md` — Archetype 6 (CLI / Tooling); axioms A7/A11
   (generators are pure string builders, IO stays at the runtime edge).
3. `.agents/skills/netscript-cli/SKILL.md` — scaffold/generator surface.
4. `.agents/skills/netscript-tools/SKILL.md` — scoped wrappers, gate evidence, lock hygiene.
5. `.agents/skills/rtk` — prefix read-heavy `git`/`grep` with `rtk`.

## Required Reading

1. `.llm/harness/workflow/run-loop.md` § 5 (Implement) and § "Concept of Done (per slice)".
2. `.llm/runs/test-e2e-sqlite-runtime-tier--1158/plan.md` — locked decision **D0**, risk **R-1**.
3. `.llm/runs/test-e2e-sqlite-runtime-tier--1158/research.md` — **finding 8** is the defect.
4. `.llm/runs/test-e2e-sqlite-runtime-tier--1158/worklog.md` § Design — the S1 row and the "Public
   Surface" section (the design is already recorded; do not rewrite it).
5. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` — Concept of Done.

## The defect

Issue #1191 fixed "generated SQLite service command omits `--allow-ffi`" — but **only for
services**. `withRequiredServicePermissions` lives in
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts:32-38`, and
`databaseEngine` is declared only on `RegisterServicesOptions`
(`packages/cli/src/kernel/templates/aspire/helpers/types.ts:69`).

`generate-register-apps.ts`, `generate-register-background.ts`, and `generate-register-plugins.ts`
emit `resolvePermissions(...)` with **no sqlite branch** and never receive `databaseEngine`. On a
sqlite-backed project the generated Fresh app, the background processors (workers, sagas, triggers,
streams), and the plugin API services all touch the DB through `node:sqlite`/libsql FFI and will
**exit 1 at startup** — the same failure #1191 fixed for services, unfixed everywhere else.

Verify it yourself before changing anything:

```bash
rtk grep -rn "allow-ffi" packages/cli/src/kernel/templates/aspire/helpers/register/
```

Exactly one file should match today.

## Scope of S1

**In scope**

- Extract the sqlite permission rule out of `generate-register-services.ts` into a single shared
  helper in the `register/` module (name it for what it does, e.g.
  `withDatabasePermissions(permissions, databaseEngine)`), and reuse it from **all four**
  generators: services, apps, background, plugins.
- Thread `databaseEngine?: DatabaseEntry['Engine']` into `RegisterAppsOptions`,
  `RegisterBackgroundOptions`, and `RegisterPluginsOptions` in `helpers/types.ts`, and pass it from
  every call site that already knows the engine (follow the existing services call site).
- Unit tests in `packages/cli/src/kernel/templates/aspire/helpers/tests/` proving:
  1. sqlite ⇒ `--allow-ffi` appears **exactly once** in each of the four generated outputs (never
     duplicated when the entry already declares it);
  2. **non-sqlite output is unchanged** — this is risk R-1 and is the most important test. Assert
     the postgres/mysql/mssql/none outputs are byte-identical to today's.

**Out of scope — do not touch**

- `packages/cli/e2e/**` (that is S2–S5).
- `.github/**` (that is S6).
- `SCAFFOLD_DEFAULTS.CACHE_BACKEND`, `buildCacheBlock`, `ensureSharedCache`, or anything cache
  related.
- The doctrine `Restructure` work on `@netscript/cli` (`pipeline.ts`, `official-plugin-copier.ts`) —
  do not grow those files.
- Regenerating `embedded.generated.ts` unless the change genuinely requires it; if it does, say so
  explicitly in the PR comment.

## Doctrine constraints

- Generators stay **pure string builders** (A11). The helper takes values and returns values; no IO,
  no `Deno.env`, no process probing.
- The branch keys off `databaseEngine === 'Sqlite'` — an existing domain value from
  `DatabaseEntry['Engine']`. **No hardcoded plugin names, no `kind === '…'` host-side coupling.**
- **No `any`, no `as unknown as`, no new `// deno-lint-ignore`.** Adding a lint-ignore to green a
  wrapper is a review-blocking finding, not a pass.
- Finite vocabularies stay constants with derived unions.

## Gates for this slice (all required, evidence goes in the PR comment)

```bash
deno test packages/cli/src/kernel/templates/aspire/helpers/tests/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno task quality:scan
deno task arch:check
```

`quality:scan` and `arch:check` are **mandatory** — this slice touches `packages/**`. A green scoped
wrapper alone is not a verdict (that is the hole that let #745 merge).

Do **not** run `deno task e2e:cli` for this slice. The expensive runtime suite runs at
merge-readiness, not per slice.

## Concept of Done

- Every new file is reachable from the public surface or a test.
- The helper is used by all four generators — no copy-pasted second implementation.
- Public functions carry a JSDoc one-liner (what it does, not how).
- Non-sqlite generated output is provably unchanged.
- The slice's gates pass.

## Commit / push / comment

1. Inspect `rtk git status --short` first; do **not** fold in unrelated changes.
2. Commit with a message naming **what the slice proves**, not what it contains. Suggested:

   ```
   fix(cli): sqlite --allow-ffi reaches apps, background processors, and plugins

   #1191 fixed the missing FFI permission for generated services only. Apps,
   background processors, and plugin services never received databaseEngine, so
   a sqlite-backed scaffold started them without --allow-ffi and they exited 1.
   One shared permission helper now serves all four register generators.

   Refs #1158
   ```

3. Push the branch.
4. Comment on **PR #1220** with: slice scope, commit hash, and the raw result of every gate above.
5. Update `.llm/runs/test-e2e-sqlite-runtime-tier--1158/worklog.md` (Progress Log + Gate Results)
   and `context-pack.md` **in the same slice** — a slice whose commit does not touch the run dir is
   incomplete. Append `drift.md` if reality diverges from the plan.

## Stop conditions — do not improvise

- If threading `databaseEngine` into a generator requires a call site that genuinely does not know
  the engine, **stop and record it in `drift.md`**, then report. Do not invent a lookup or reach for
  global state.
- If a non-sqlite output changes, **stop**. That is R-1 materialising and needs the supervisor.
- Do not self-certify. After your gates pass, the Tier-A supervisor performs the slice review and
  makes the sign-off. Report back with your evidence; do not proceed to S2.
