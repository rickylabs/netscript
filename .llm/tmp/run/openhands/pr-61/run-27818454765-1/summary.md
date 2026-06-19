# IMPL-EVAL Verdict: PASS

**Branch**: `fix/cli-no-aspire-postgres-guidance` | **Commit**: `dd03f9e` | **PR #61** → `main`

---

## Verdict: **PASS**

All five adversarial focus areas satisfied. The fix is merge-ready.

---

## Gate Results

| Gate | Exit | Notes |
|------|------|-------|
| `deno task check` | 0 | 1597 files checked, 0 errors |
| Unit tests (`generators_test.ts` + `orchestrate-init_test.ts`) | 0 | 17 passed, 0 failed |
| `e2e:cli` | Skipped | Rationale: that suite exercises the WITH-Aspire path (starts Aspire, wires DBs/plugins) and does not cover `--no-aspire` README/nextSteps text. The targeted repro below plus unit tests are the correct merge gate for this focused messaging fix. |

---

## Repro Outcomes

### Repro 1 — `--no-aspire` path (postgres + service `users`)

**Command**: `deno run -A packages/cli/bin/netscript-dev.ts init no-aspire-app --path .llm/tmp/eval-noaspire --db postgres --service --service-name users --service-port 3001 --no-aspire --ci --yes --no-git --force --json`

- ✅ No `aspire/` directory created
- ✅ No root `appsettings.json` created
- ✅ README Database section: `Primary database: **PostgreSQL**. Self-provision the database and expose its connection string with \`POSTGRES_URI\` or \`DATABASE_URL\`.`
- ✅ No mention of `appsettings.json` anywhere in generated README (0 hits)
- ✅ No mention of "provisioned by Aspire" in README (0 hits)
- ✅ JSON `nextSteps` includes: `"# Provision Postgres yourself and set POSTGRES_URI or DATABASE_URL"`
- ✅ JSON `nextSteps` does NOT include any string mentioning Aspire or `appsettings.json` for Postgres
- ✅ JSON `aspire.enabled: false`, `aspire.resourceCount: 0`

### Repro 2 — WITH Aspire path (postgres + service `users`)

**Command**: Same but without `--no-aspire`

- ✅ `aspire/` directory present at project root
- ✅ `appsettings.json` present at project root
- ✅ README Database section: `Primary database: **PostgreSQL** (key \`postgres\` in \`appsettings.json\`). The Aspire orchestration layer provisions it on \`aspire run\` — no manual container setup required.`
- ✅ README still includes `Persistent: false` container persistence note (3 appsettings.json references total in README)
- ✅ JSON `nextSteps` includes: `"# Postgres provisioned by Aspire (see \"Databases\" in appsettings.json)"`
- ✅ JSON `aspire.enabled: true`, `aspire.resourceCount: 3`
- ✅ No regression to the WITH-Aspire messaging path

---

## Completeness Grep Result

Grep of `packages/cli/src/` (non-test `.ts` files) for `appsettings\.json` found ~45 occurrences. Of those, only 4 are in guidance-text generators reachable on the `--no-aspire` init path:

| File:Line | Fix Applied? |
|-----------|-------------|
| `generate-readme.ts:102` — project tree `appsettings.json` line | ✅ Gated behind `!options.noAspire` |
| `generate-readme.ts:172` — Database section "provisioned by Aspire" | ✅ Gated behind `else` of `options.noAspire` |
| `generate-readme.ts:191` — SQLite persistent note | ✅ Gated behind `!options.noAspire` |
| `generate-readme.ts:196` — container persistent note | ✅ Gated behind `!options.noAspire` |
| `init-orchestrator.ts:128` — nextSteps "Databases in appsettings.json" | ✅ Gated behind `!options.noAspire` (else branch) |

All other references are in:
- Domain types/comment-docs (`resolved-config.ts`, `service-shape.ts`, `plugin-kind.ts`, `errors.ts`) — not user-facing runtime output
- Runtime adapters (`deploy-config.ts`, `workspace-resolver.ts`, `workspace-mutator.ts`, `infrastructure.ts`, etc.) — only invoked when an `appsettings.json` exists (i.e., with-Aspire projects)
- Aspire template generators (`templates/aspire/*`) — only invoked in the Aspire scaffold path
- `init-pipeline.ts:50,52` — log lines printed only when Aspire is being scaffolded
- Public/maintainer flag definitions — not guidance text

**Zero unconditional Aspire/appsettings guidance references remain on the no-Aspire path.**

---

## Test Adequacy

### `orchestrate-init_test.ts`

- ✅ **New test**: `initNextSteps tells no-Aspire Postgres users to self-provision` — asserts exact array ending with `# Provision Postgres yourself and set POSTGRES_URI or DATABASE_URL`
- ✅ **Existing test preserved**: `initNextSteps includes local database preparation steps for maintainer init` — retains assertion for `# Postgres provisioned by Aspire (see "Databases" in appsettings.json)` covering the with-Aspire path

### `generators_test.ts`

- ✅ **New test**: `generateReadme — no aspire postgres asks for self-provisioning` — asserts `Self-provision the database`, `\`POSTGRES_URI\` or \`DATABASE_URL\``, no "Aspire orchestration layer provisions it", no "appsettings.json"
- ✅ **Existing test enhanced**: `generateReadme — no aspire points at app dev task` — now additionally asserts `!md.includes('appsettings.json')` (new line in diff)
- ✅ **Regression test intact**: `generateReadme — sqlite gets non-persistent note` still passes (AppSettings persistence text still generated for with-Aspire SQLite)

Both the README generator AND the `nextSteps` JSON (via `initNextSteps`) are asserted on both paths.

---

## Scope Discipline

Only 4 files changed, all under `packages/cli/src/kernel/`:

| File | Nature |
|------|--------|
| `application/scaffold/init-orchestrator.ts` | Source: added `databaseEnvVar()` helper + noAspire branch in `initNextSteps` |
| `application/scaffold/orchestrate-init_test.ts` | Test: added 1 noAspire test |
| `templates/workspace/generate-readme.ts` | Source: noAspire branches for project tree, database section, persistence notes |
| `templates/workspace/generators_test.ts` | Test: added 1 noAspire test + enhanced 1 existing test assertion |

**Not touched**: `deno.lock`, `deno.json`, `scaffold-versions.ts`, public CLI flags, `init-command.ts`, `plan-init.ts`, `render-init.ts`, `init-pipeline.ts`, any non-CLI package, any dependency catalog.

---

## Summary

The fix is minimal, focused, and correct. It introduces a `databaseEnvVar()` helper for the engine → env-var mapping (consistent with the `ENGINE_ENV_VARS` record in the README generator), properly gates all Aspire/appsettings guidance behind `!options.noAspire`, and preserves the full with-Aspire messaging path. Unit tests cover both the README and nextSteps on both paths. `deno task check` is clean. Scope is disciplined to exactly the claimed files and tests.

**Merge recommendation: Approve.**
