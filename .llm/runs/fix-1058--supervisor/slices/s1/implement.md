use harness. You are the implementation agent (Codex · GPT-5.6 Sol · high,
`complex_implementation` lane) for issue **#1058** in `rickylabs/netscript`, run
`fix-1058--supervisor`, supervised by the Claude orchestrator. This is the **only remaining
blocker on the 0.0.3 release**.

## SKILL

Activate `netscript-harness`, `netscript-pr`, `netscript-deno-toolchain`.
Worktree: `/home/codex/repos/fix-1058`, branch `fix/1058-schema-dedup`, base `f72afba90`.
Run dir: `.llm/runs/fix-1058--supervisor/slices/s1/` (worklog + evidence).

## Evaluator waiver (verbatim, owner-directed)

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

## The diagnosis is DONE. Do not re-litigate it; do not "fix" the refuted hypothesis.

The supervisor reproduced the failure end-to-end against the published canary CLI and read the
merged schema. Both hypotheses recorded on issue #1058 are **REFUTED**. Findings, with the exact
commands that produced them:

1. `deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.3-canary.3 init e2eproj --path
   <dir> --db postgres --service --service-name users --service-port 3001 --ci --yes --no-git
   --force` produces `database/postgres/schema/schema.prisma` whose **line 17** is `model User {`.
   That is the scaffold's own example model: `validate-init.ts:132` derives
   `modelName = toPascalName(singularize(serviceName))`, and the prod E2E passes
   `--service-name users` (`packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts:44-46`),
   so `users` -> `User`. Line 17 is exactly the line Prisma names in the P1012 error.

2. `... plugin install auth --name auth --project-root . --no-samples --force` (dependency mode,
   published CLI) writes **exactly one** file:
   `database/postgres/schema/plugins/auth/auth.prisma`. Its line 2 is `model User {`
   (better-auth, `@@map("auth_users")`).

3. `grep -rn '^model ' database/postgres/schema/` over the reproduced tree returns exactly five
   models and exactly **two** `model User` — one per file. **There is no duplicated fragment.**
   `fetchJsrPackageSchemaFragments` fetched one copy, wrote one copy, and is behaving correctly.
   The suspected "fetched fragments merged in addition to scaffold fragments" cause is **wrong**.

4. The real cause is a **name collision between two different models that happen to share the
   name `User`**: the scaffold's example model and the auth plugin's better-auth model.

5. Why the prod lane is the only red one: the same install run through the local lane
   (`deno run -A packages/cli/bin/netscript.ts plugin install auth ... --local-path
   /home/codex/repos/b12-release/plugins/auth`) writes **no** fragment at all —
   `copyPluginSchemasToRootDb` reads `<projectRoot>/plugins/<name>/database`, which a local-path
   install never populates. That is the known boundary #1043 recorded on #1014. So the collision
   exists in principle everywhere but only *materialises* where fragments actually land, i.e.
   dependency mode after #1043.

Reproduce it yourself before you change anything; the supervisor's transcripts are in the run dir
notes but your own reproduction is the gate. **Do not weaken, retarget or delete any assertion or
E2E gate argument to reach green** — in particular `--service-name users` in `scaffold-gates.ts`
stays exactly as it is. Changing it hides the bug and will be rejected.

## The fix (three parts). Part A is what turns the gate green.

### Part A — namespace the auth plugin's Prisma models (`plugins/auth`, `packages/auth-better-auth`)

Every other official plugin already prefixes its models — `plugins/sagas/database/sagas.prisma`
has `SagaRuntimeState`/`SagaInstance`/…, `plugins/workers/database/workers.prisma` has
`JobDefinition`/`TaskDefinition`/…, `plugins/triggers/database/triggers.prisma` has
`TriggerEvent`/`TriggerDefinition`. **`auth` is the sole outlier**, squatting the four commonest
identifiers in the user's own namespace: `User`, `Session`, `Account`, `Verification`. This is not
a new convention; it is applying the existing one to the one plugin that violates it.

- In `plugins/auth/database/auth.prisma`, rename the models to `AuthUser`, `AuthSession`,
  `AuthAccount`, `AuthVerification`, updating every relation field type and back-reference.
  **Leave every `@@map(...)` untouched** — the physical tables stay `auth_users`, `auth_sessions`,
  `auth_accounts`, `auth_verifications`, so this is a Prisma-identifier change only, with no
  migration or table rename.
- Blast radius is bounded: no dependency-mode install has ever received these tables (fragments
  were silently omitted before #1043) and local-path installs still do not write them, so there is
  no installed base to migrate.
- **Coupling you must handle:** `packages/auth-better-auth/src/better-auth.ts:166` calls
  `prismaAdapter(prisma, { provider, debugLogs, usePlural, transaction })`. better-auth resolves
  its internal `user`/`session`/`account`/`verification` entities to Prisma client accessors **by
  name**, so renaming the models breaks the adapter unless the options carry per-entity
  `modelName` mappings (`user: { modelName: 'AuthUser' }`, etc.). Add those mappings in
  `createBetterAuthOptions` so they are the defaults, and make sure the existing
  `betterAuthOptions` / `explicitBetterAuthOptions` spreads can still **override** them — study
  the current spread order at lines 162-171 and preserve caller precedence.
- **Verify, do not assume:** confirm the pinned better-auth version actually supports per-entity
  `modelName` (check the installed types / `deno doc`, and the lockfile pin). If it does **not**,
  STOP and report to the supervisor with the evidence rather than improvising a workaround.
- Update the docs that state the old identifiers — they name the mapping explicitly and will
  become wrong: `docs/site/identity-access/auth.md:296-297`,
  `docs/site/tutorials/workspace/02-auth.md:137-139`,
  `docs/site/identity-access/how-to/add-authentication.md:134-137`. The `auth_*` table names in
  `docs/site/data-persistence/database.md`, `docs/site/glossary.md` and
  `docs/site/orchestration-runtime/how-to/add-a-plugin.md` remain correct — do not churn them.

### Part B — make the schema merge safe by construction (`packages/cli`)

Acceptance box 2 of #1058: a fragment that duplicates an existing model must be **deduplicated or
rejected with a named error, never silently merged**. Today `writeSchemaFragment`
(`packages/cli/src/kernel/adapters/plugin/db-integration.ts:251-274`) writes fragments blind.

In `copyPluginSchemasToRootDb`, before writing each fragment, collect the top-level declaration
names (`model`, `enum`, `type`, `view`) already present in the destination schema tree — the base
`database/<engine>/schema/schema.prisma` plus any fragment already written under
`schema/plugins/**` — and compare against the incoming fragment's declarations. Then:

- **Byte-identical redeclaration** (same name, same normalised body, e.g. the same plugin
  reinstalled or the same fragment resolved twice): treat as idempotent — the declaration appears
  **once**; do not write a second copy and do not error.
- **Same name, different body** (our `User` case): throw a `ScaffoldValidationError` that
  **names** the plugin, the fragment path, the colliding declaration name, and the path of the
  file that already declares it. No silent merge, no silent drop.

Constraints on Part B:
- **#1043 must keep working.** Dependency-mode installs must still resolve and write published
  plugin fragments. `fetchJsrPackageSchemaFragments` and the `source.kind === 'jsr'` ladder stay.
  The existing test `installs a published Prisma fragment from JSR metadata into the root schema
  tree` in `packages/cli/src/public/features/plugins/install/install-plugin_test.ts` must still
  pass **unmodified** — if you have to touch it, you have broken #1043.
- Also keep passing, unmodified: `rejects a DB-required JSR plugin that declares migrations
  without a published fragment`.
- Keep the parser deliberately small and local (a declaration-header scan is enough); do not add a
  dependency or a general Prisma parser.

### Part C — regression tests

- A test in `packages/cli/src/kernel/adapters/plugin/db-integration_test.ts` covering
  **dependency-mode merge where a plugin fragment and the base schema both declare the same model
  with different bodies** -> named `ScaffoldValidationError` naming plugin, fragment and the
  existing declaring file.
- A companion test for the **identical-body** case -> written once, no error, no duplicate file.
- **Prove RED first.** Before applying Part B, run both new tests against the unmodified merge and
  record the failing output in the worklog. A regression test that has never failed is not
  evidence. Paste both the RED and the GREEN output.
- A test asserting the auth fragment no longer declares `User`/`Session`/`Account`/`Verification`
  at top level, so Part A cannot silently regress.

### Part D — the diagnostics ask on #1058 (the premise is wrong; here is what is actually true)

The issue claims `print-failed-report-steps.ts` output "does not reach the job log". The
supervisor checked the real failed run: `gh run view 30743141553 --repo rickylabs/netscript --log`
shows the `Report production E2E failure` step running and printing 77 lines, including
`FAILED GATE: database.init` and, ~60 lines in, the full
`[prisma-init-postgres] Error code: P1012 … The model "User" cannot be defined…`. **#1057 works.**

So do **not** re-plumb the step. The genuine defect is that the error is buried mid-`stdoutTail`
behind ~55 lines of `Download https://registry.npmjs.org/...` noise, and the only GitHub
**annotation** says "Production CLI E2E failed" without the gate's own error text. Fix that:

- In `.llm/tools/e2e/print-failed-report-steps.ts`, emit the failing gate's decisive error lines
  up front — before the raw tails — and filter the obvious registry/download noise out of the tail
  it prints (keep the raw tail available, just not first).
- Emit a GitHub annotation (`::error::`) and a `$GITHUB_STEP_SUMMARY` entry carrying the failing
  gate id and its decisive error text, from `.github/workflows/e2e-cli-prod.yml`.
- Cover the new formatting in `.llm/tools/e2e/print-failed-report-steps_test.ts`.
- **Verify against a real failed run's log, not the workflow file.** Use the saved report from run
  30743141553 (`gh run download 30743141553 --repo rickylabs/netscript`) as the fixture input and
  show the new output in the worklog.

## Gates (all must be green before you push)

- `deno task check` / the repo's standard gate set. Run `.llm/tools/run-deno-check.ts`
  **without** `--unstable-kv`.
- `deno test -A packages/cli/src/kernel/adapters/plugin/db-integration_test.ts
  packages/cli/src/public/features/plugins/install/install-plugin_test.ts` — all green, with the
  two #1043 tests untouched.
- `deno test -A .llm/tools/e2e/print-failed-report-steps_test.ts`.
- Re-run the manual dependency-mode reproduction from findings 1-3 **against your branch's CLI**
  (`packages/cli/bin/netscript.ts`) plus the workspace auth plugin via `--local-path`, and paste
  `grep -rn '^model ' database/<engine>/schema/` showing every model declared exactly once.
- `deno fmt` / `deno lint` clean.

## PR

- Title: `fix(cli): resolve plugin/base Prisma model collisions on dependency-mode install`
- Body: colon labels, exactly **one** `status:` label, milestone **0.0.3**.
- **`Refs #1058`, NOT `Closes`** — acceptance criterion 1 ("`database.init` passes in
  `e2e-cli-prod.yml` against a published canary CLI") requires a published canary that cannot
  exist until after merge. Include a **Remaining scope** section saying exactly that.
- Include the refutation of both stated hypotheses, with the reproduction commands and the
  `grep -rn '^model '` evidence. The record needs to show what the cause actually was.
- Always `--repo rickylabs/netscript`.
- Push explicitly and confirm local HEAD == remote HEAD sha.

## Stop-lines (HARD)

1. **Do not dispatch any canary or release workflow.** The orchestrator dispatches
   `e2e-cli-prod.yml` after merge. No `release:cut`, no JSR publish, no tag push.
2. **Do not merge.** Push the branch, open the PR, report back.
3. **Never weaken or delete an assertion, gate, or E2E argument to reach green.** This train has
   already caught that twice. If a gate is red, fix the code or stop and report.
4. Never edit files outside the worktree. Stop any AppHost you start; never kill
   `aspire mcp start`; never blanket-remove containers.
5. If better-auth cannot express the `modelName` mapping (Part A), STOP and report — do not
   invent a shim.
