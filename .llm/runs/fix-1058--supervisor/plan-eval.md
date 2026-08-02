# PLAN-EVAL — #1058 (supervisor-performed, per owner waiver 2026-08-01)

Evaluator: Claude supervisor. The Plan-Gate open-model evaluator is waived by the owner
(2026-08-01); no OpenRouter/Qwen/OpenHands run was attempted.

## Verdict: PASS (proceed to implementation)

## Reproduction evidence (supervisor-run, published canary CLI)

Commands, in order, all against `jsr:@netscript/cli@0.0.3-canary.3` with
`--minimum-dependency-age=0`:

1. `init e2eproj --path <dir> --db postgres --service --service-name users --service-port 3001
   --ci --yes --no-git --force` -> exit 0.
   `database/postgres/schema/schema.prisma` line 17 = `model User {`.
2. `plugin install auth --name auth --project-root . --no-samples --force` -> exit 0,
   writes exactly one file: `database/postgres/schema/plugins/auth/auth.prisma`, line 2
   `model User {`.
3. `grep -rn '^model ' database/postgres/schema/` ->
   `plugins/auth/auth.prisma:2 model User`, `:17 model Session`, `:33 model Account`,
   `:55 model Verification`, and `schema.prisma:17 model User`.
   Five declarations, **two** named `User`, **one per file**.
4. Local-lane control: same install with the workspace CLI and
   `--local-path /home/codex/repos/b12-release/plugins/auth` -> exit 0 and **no** fragment
   written at all (`find database -name '*.prisma'` returns only `schema.prisma`).

## Hypotheses on the issue: both REFUTED

- "Fetched fragments merged in addition to scaffold fragments -> two copies of the auth
  fragment." **False.** Step 3 shows one fragment file with one `User`.
  `fetchJsrPackageSchemaFragments` behaves correctly; #1043 is not duplicating anything.
- "print-failed-report-steps.ts output does not reach the job log." **False.**
  `gh run view 30743141553 --repo rickylabs/netscript --log` shows the `Report production E2E
  failure` step succeeded and printed 77 lines including `FAILED GATE: database.init` and, ~60
  lines in, the full `Error code: P1012 ... The model "User" cannot be defined`. #1057 works.

## Actual cause

A name collision between two *different* models that share the identifier `User`:

- the scaffold's own example model — `validate-init.ts:132` derives
  `modelName = toPascalName(singularize(serviceName))`, and the prod E2E passes
  `--service-name users` (`scaffold-gates.ts:44-46`), so `users` -> `User` at
  `schema/schema.prisma:17`, exactly the line Prisma names;
- the auth plugin's better-auth model `User` (`@@map("auth_users")`).

It is production-only because `copyPluginSchemasToRootDb` reads
`<projectRoot>/plugins/<name>/database`, which a local-path install never populates — the known
boundary #1043 recorded on #1014 — so fragments only actually land in dependency mode, i.e. after
#1043.

## Why the chosen remedy

`plugins/auth` is the **sole** official plugin that does not prefix its models: sagas ->
`Saga*`, workers -> `Job*`/`Task*`/`WrapperType`, triggers -> `Trigger*`; auth squats `User`,
`Session`, `Account`, `Verification`. Prefixing auth applies the existing convention rather than
inventing one, and keeps every `@@map` so the physical tables are unchanged. Blast radius is
effectively nil: no dependency-mode install ever received these tables (fragments were omitted
before #1043) and local-path installs still do not write them.

Feasibility verified before briefing, from the pinned packages:
`@better-auth/core@1.6.25/dist/db/get-tables.mjs` honours `options.{user,session,account,
verification}.modelName` (lines 132/79/179/42), and
`@better-auth/prisma-adapter@1.6.25/dist/index.mjs` indexes `db[model]` directly (lines 172-246),
so the mapped values must be the camelCase Prisma client accessors (`authUser`, ...). That
correction was sent to the implementation thread.

## Constraint coverage check

- #1043 must keep working -> brief forbids touching `fetchJsrPackageSchemaFragments` or the two
  #1043 tests, and requires them to pass unmodified.
- Merge idempotent / named error -> Part B: identical body deduplicates, differing body raises a
  named `ScaffoldValidationError` identifying plugin, fragment and the existing declaring file.
- No assertion weakening -> `--service-name users` is explicitly frozen in the brief.
- Regression test with RED proof required before the fix is applied.
