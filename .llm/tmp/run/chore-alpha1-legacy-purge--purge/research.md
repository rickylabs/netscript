# PR-C Research — project-wide alpha-1 legacy/deprecated purge + folded hygiene

- Run id: `chore-alpha1-legacy-purge--purge`
- Baseline: **PR-B's merged main** @ `abb6e9a4` (post-#113). Every item re-grepped against this tip
  (2026-06-23) — alpha-1 surface shifted as PR-B removed its shims.
- Archetype: multi-package edit across ARCHETYPE-2/3/5 (cli, aspire, fresh, plugins/workers).
  Scope overlay: SCOPE-service where runtime/scaffold paths change.
- Origin of scope: `prc-inventory.md` (Explore sweep of origin/main) + `hygiene-recon.md`, both
  refined post-PR-B and re-verified by direct `git grep` on `abb6e9a4`.

## Re-baseline vs merged main `abb6e9a4` — verified

**PR-B removals confirmed gone** (0 live): `serveStaticFiles`, `trustedConnection`,
`mssqlJsonExtension`, `SagaBusLegacy`, `saga-bus-legacy`; bare `V8_HEAP_MB` folded (all 9 hits are
the canonical `DEFAULT_V8_HEAP_MB`). Expected non-regression residuals: `buildConnectionString`=3
(private mysql/postgres adapter methods), `registerFsRoutes`=2 (internal route-registration fn — the
grep gate must confirm it is the impl fn, not a reintroduced option field).

**Two inventory items re-verified and REMOVED from scope** (this is why re-baselining matters):

- **`packagesAsWorkspaceMembers` → EXCLUDE (false positive).** 22 hits across the cli scaffold
  pipeline prove it is a LIVE, load-bearing seam, not a dead always-true option: computed dynamically
  (`packagesAsWorkspaceMembers: await hasLocalPackageWorkspace(projectRoot, fs)`), dependency-injected
  as `readonly packagesAsWorkspaceMembers: (options: ValidatedInitOptions) => boolean`, consumed as
  `useWorkspacePackages: context.packagesAsWorkspaceMembers(options)` → `plan.useWorkspacePackages`,
  with real conditional branches (`=== true`, `() => false`). Removing it breaks the non-workspace
  scaffold path. The inventory's "always-true / 0 consumers" claim was wrong. Not touched in PR-C.
- **workers `streams/schema.ts:106 schedule?` → DEFER.** Located at
  `packages/plugin-workers-core/src/streams/schema.ts:106-107` (`@deprecated Recurring jobs are
  modelled as scheduled triggers` / `schedule?: unknown`). Its deprecation note points at the
  workers-cron→triggers unification = **CRON-SUBSYSTEM-DUP (already deferred)**. Lines 153/159
  (`schedule: true`) show it is still wired into a projection mask → potentially load-bearing.
  Excluded from PR-C; rides the future cron-unification run.

## Final removal manifest (re-grepped, present on `abb6e9a4`)

### Tier 1 — low-consumer aliases / dead stubs (delete symbol + fold the few consumers)
- `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts` — `updatePluginRegistry(projectRoot,
  pluginName)` no-op stub (config-driven plugin declarations superseded it). ~1 test consumer → drop
  the call + the stub; confirm the test still asserts the real config-driven path. (grep: 2 hits)
- `packages/fresh/application/route/pagination-types.ts` — `safeExtend()` alias → `extend()`
  (Zod-compat). 0 call consumers → remove the alias. (grep: 3 hits — def + re-export + doc)
- `plugins/workers/streams/producer.ts` — `startWorkersStreamMirror()` back-compat wrapper for the
  old `main.ts` import. 1 consumer (`plugins/workers/services/src/main.ts`) → rename the consumer to
  the canonical name, drop the wrapper. (grep: 4 hits)

### Tier 2 — deprecated option field with handling branch (the substantive slice)
- `packages/aspire/config.ts` — `DependsOn?: string[]` on `ServiceEntry`, `@deprecated →
  ServiceReferences`. Back-compat merge logic in `config.ts` + `application/resolve-references.ts`.
  **6 consumers** (config handler, resolve-references, deploy-config-resolvers, tests). Confirm
  `ServiceReferences` is the COMPLETE replacement (every `DependsOn` merge case: ordering, transitive
  refs, deploy-config resolvers), remove the field + merge branch, migrate any scaffold/template
  emission, update tests. (grep: 20 hits incl. tests/docs)

### Excluded / deferred / false-positive (do NOT touch — recorded so it is not re-litigated)
- `packagesAsWorkspaceMembers` (live seam, see above).
- workers `schedule?` (deferred to cron-unification, see above).
- PR-B-owned (already gone on `abb6e9a4`): saga `legacy?`, database
  `buildConnectionString`/`mssqlJsonExtension`/`trustedConnection`, fresh
  `serveStaticFiles`/`registerFsRoutes` option, telemetry `context/job.ts`, sagas
  `saga-bus-legacy.ts`, cli `windows.ts` 8 aliases incl. the `V8_HEAP_MB` fold.
- Term false positives (NOT legacy): aspire "legacy experimental decorators" (TS-config concept), cli
  `compile-bundler.ts` CJS "shim" (bundler term), cli `--legacy-aspire` flag (current feature), cli
  `env.template` "Legacy MYSQLDB_*" comment (doc), fresh `defer/policy.ts` `LegacyStaleStrategy` (live
  strategy option), `queue/parallel-queue.ts` "compatibility", docs that FORBID shims (keep).

## Folded hygiene (PR-D dissolved into PR-C)

- **H1 — untrack accidental test output + close the gitignore gap (root cause).** `git rm -r --cached
  .llm/tmp/init-json-smoke/` (109 tracked files; regenerated by
  `packages/cli/e2e/tests/presentation/init-json_test.ts`, never gitignored) AND add
  `.llm/tmp/init-json-smoke/` to `.gitignore`. Non-framework-source; verify the e2e regenerates it.
- **H2 — remove zero-ref scratch files:** `.llm/tmp/measure-doclint.ts`,
  `.llm/tmp/measure-wave5-rebaseline.ts`, `.llm/tmp/eval-pr97-e2e-runtime.log`, stale
  `.llm/tmp/doc-lint-fresh*.json` (re-confirm 0 refs before deleting).
- **H3 — fresh docstring WORDING fixes (NOT removals — removal TRAP).**
  `useQuery`/`useSuspenseQuery`/`useInfiniteQuery`/`useSuspenseInfiniteQuery`/`useMutation`
  (`fresh/.../query/hooks.ts`) + `FreshAppTelemetryOptions` (`define-fresh-app.ts`) are mislabeled
  "Backward-compatible alias" but are CANONICAL current API (scaffold templates, SDK docstrings,
  `route-templates_test.ts`, ~20 docs refs depend on them). Fix the misleading docstrings only —
  NEVER remove the symbols. Framework source → in the Codex slice.
- **H4 — downstream doc-ref refreshes (do IN the removing slice):**
  `docs/site/reference/workers/index.md` (`startWorkersStreamMirror`) and
  `docs/site/web-layer/route.md` (`safeExtend`) go stale when Tier-1 removes those symbols.

## Needs-USER decisions → arch-debt (record, do NOT implement in PR-C)

Fold 4 drafted entries from `archdebt-hygiene-decisions.md` into `.llm/harness/debt/arch-debt.md` on
the PR-C branch: **RUN-ARTIFACT-ARCHIVAL-POLICY** (~1962 run files / 908 openhands traces — biggest
JSR slim-down lever, needs a retention policy), **PAGEBUILDER-LEGACY-COMPAT-TREE** (8-file public-API
break — product call), **FORMPAGEPROPS-PLAYGROUND-MIGRATION**, **REDIS-LEGACY-VALUE-FALLBACK**
(data-migration concern). Plus the two PR-B-deferred debts: **DEBT-1 version timing** (repo-wide
lockstep bump at JSR-publish prep, NOT per-package; ties task #36) and **DEBT-2 db-init e2e flake**
(pre-existing; GitHub Actions scaffold-runtime green; task #68).

## Open questions for PLAN-EVAL
1. aspire `DependsOn`: is `ServiceReferences` a TOTAL replacement, or does any merge case (ordering,
   transitive refs, deploy-config resolvers) lack a `ServiceReferences` equivalent? If any case is
   uncovered → rescope that case out and record debt rather than silently dropping behavior.
2. Version policy for the PR-C package set: hold lockstep `0.0.1-alpha.0` (do NOT per-package bump),
   consistent with PR-B's ruling; the repo-wide breaking bump lands once at JSR-publish prep (DEBT-1).
3. Scaffold/docs references: do any removed Tier-1/Tier-2 symbols appear in scaffold templates or doc
   code samples beyond H4? (Named pre-delete grep gate over `templates/`/`docs/`/`plugins/*/templates`.)

## Gates (carry PR-B's hardened set)
`run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts` (scoped, src ts/tsx only) on affected
roots; `deno doc --lint` per affected package; per-package `deno task test`; named pre-delete grep
gate over templates/docs/scaffold; `deno task arch:check`; `deno task publish:dry-run`; and — because
aspire + workers + scaffold paths change — `deno task e2e:cli run scaffold.runtime --cleanup` at
IMPL-EVAL. No `deno.lock` churn. Zero-cast (only the 2 accepted casts).
