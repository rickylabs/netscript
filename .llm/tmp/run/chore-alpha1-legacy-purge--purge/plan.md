# PR-C Plan — project-wide alpha-1 legacy/deprecated purge + folded hygiene

- Run id: `chore-alpha1-legacy-purge--purge`
- Branch: `chore/alpha1-legacy-purge` off merged main `abb6e9a4`
- Baseline re-verified vs `abb6e9a4` (see `research.md`). PR-B set excluded (already gone);
  `packagesAsWorkspaceMembers` excluded (live seam); workers `schedule?` deferred (cron-unification).

## Archetype + scope
- ARCHETYPE-2 (aspire), ARCHETYPE-3 (cli/fresh), ARCHETYPE-5 (plugins/workers).
- Overlay: SCOPE-service (scaffold + runtime paths in aspire/workers change).
- Public-surface impact: aspire `DependsOn` and the 3 Tier-1 symbols are exported/option surface →
  this is a BREAKING change at the alpha-1 pre-1.0 line. No per-package version bump (DEBT-1: the
  repo-wide lockstep breaking bump lands once at JSR-publish prep; hold `0.0.1-alpha.0`).

## Locked decisions
1. **Scope = 3 Tier-1 removals + 1 Tier-2 removal + 4 hygiene slices + arch-debt folding.** No
   net-new behavior. `packagesAsWorkspaceMembers` and workers `schedule?` are explicitly OUT.
2. **Version policy:** hold lockstep `0.0.1-alpha.0`; record DEBT-1. Per-package bump would break the
   single-version scheme.
3. **Canonical `ServiceConfig.dependsOn` completeness is a hard precondition for the Tier-2 removal.**
   (PLAN-EVAL clarified the replacement surface is the LIVE canonical `dependsOn`, not a separate
   `ServiceReferences` type.) Before deleting the aspire legacy `DependsOn` alias, prove canonical
   `dependsOn` covers every merge case (ordering, transitive refs, deploy-config resolvers). If any
   case is uncovered → leave that case, record arch-debt, do NOT silently drop behavior.
4. **H3 is wording-only.** The fresh query hooks + `FreshAppTelemetryOptions` are canonical API;
   removal is a TRAP. Fix only the misleading "Backward-compatible alias" docstrings.
5. **No `deno.lock` churn; zero-cast** (only the 2 accepted casts).

## Commit slices (each: commit + push + PR comment + append commits.md)

- **S1 — Tier-1 removals (cli + fresh + plugins/workers).** [PLAN-EVAL corrections folded]
  - `updatePluginRegistry` stub in `cli/.../adapters/plugin/workspace-mutator.ts` → drop stub + the
    test call (1 consumer: `.../workspace-mutator_test.ts:270`); confirm the test still asserts the
    config-driven plugin path.
  - `safeExtend` alias in `fresh/src/application/builders/define-page/...` → remove it; **PLAN-EVAL
    correction: there is 1 in-class caller at
    `packages/fresh/src/application/builders/define-page/search-params.ts:76` (not 0)** — rewrite that
    call to `this.extend(shape)`, then remove the alias; refresh `docs/site/web-layer/route.md` ref (H4).
  - `startWorkersStreamMirror` in `plugins/workers/streams/producer.ts` → **PLAN-EVAL correction:
    this IS the canonical name; there is no separate alias.** S1 action is **delete + inline** (or move
    `createStreamMutationHook` into the consumer), NOT "rename to canonical". 1 consumer
    (`plugins/workers/services/src/main.ts`); refresh `docs/site/reference/workers/index.md` ref (H4).
  - Gates: scoped check/lint/fmt on cli+fresh+plugins/workers roots; `deno doc --lint` each; pre-delete
    grep gate over templates/docs/scaffold; per-package `deno task test`.

- **S2 — Tier-2 aspire `DependsOn` removal (the substantive slice).**
  - **PLAN-EVAL correction: `dependsOn` lives on TWO surfaces.** Remove ONLY the aspire legacy alias
    `DependsOn` (`packages/aspire/src/domain/raw-config.ts`); the canonical `ServiceConfig.dependsOn`
    (`packages/config/src/domain/schemas/service-schema.ts:17`, `config-section-types.ts:127`) is LIVE
    and STAYS. The cascade `deploy-config-resolvers.ts:133` (`dependsOn: appSvc?.DependsOn ??
    nsSvc.dependsOn`) must be rewritten to drop the legacy `DependsOn` arm while preserving the
    canonical `dependsOn`.
  - Confirm canonical `dependsOn` (was: ServiceReferences) completeness (decision #3). Remove the
    legacy `DependsOn` alias + back-compat merge branch; migrate any scaffold/template emission;
    update tests + deploy-config resolvers.
  - Gates: scoped check/lint/fmt on aspire root; `deno doc --lint`; `deno task test` aspire;
    `deno task arch:check`.

- **S3 — Hygiene H1/H2 (non-framework-source).**
  - H1: `git rm -r --cached .llm/tmp/init-json-smoke/` (109 files) + add `.llm/tmp/init-json-smoke/`
    to `.gitignore`; verify `init-json_test.ts` regenerates it.
  - H2: remove the 4 zero-ref scratch files (re-confirm 0 refs first).

- **S4 — Hygiene H3 (fresh docstring wording) + arch-debt folding.**
  - H3: fix the misleading "Backward-compatible alias" docstrings on the 5 query hooks +
    `FreshAppTelemetryOptions` (WORDING ONLY — keep the symbols).
  - Fold into `.llm/harness/debt/arch-debt.md`: RUN-ARTIFACT-ARCHIVAL-POLICY,
    PAGEBUILDER-LEGACY-COMPAT-TREE, FORMPAGEPROPS-PLAYGROUND-MIGRATION, REDIS-LEGACY-VALUE-FALLBACK,
    DEBT-1 (version timing), DEBT-2 (db-init flake).

## Gates (full set at IMPL-EVAL)
Scoped `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts` (src ts/tsx, affected roots);
`deno doc --lint` per affected package; per-package `deno task test`; named pre-delete grep gate;
`deno task arch:check`; `deno task publish:dry-run`; `deno task e2e:cli run scaffold.runtime
--cleanup --format pretty` (aspire+workers+scaffold paths change). No `deno.lock` churn. Zero-cast.

## Debt implications
- DEBT-1 (version timing) + DEBT-2 (db-init flake) folded now.
- 4 needs-user arch-debt entries recorded (not implemented).
- CRON-SUBSYSTEM-DUP unchanged (workers `schedule?` stays deferred).

## Design checkpoint
Contract-first: the only contract changes are SUBTRACTIVE (remove `DependsOn` field, 3 Tier-1
symbols). Replacement surfaces (`ServiceReferences`, `extend`, canonical mirror-start name, config-
driven plugin path) already exist and are proven present on `abb6e9a4`. Risk concentrated in S2
(`ServiceReferences` completeness) → gated by decision #3 + `scaffold.runtime` E2E.

## Rollback
Each slice is an independent revert. S2 is the only behavior-affecting slice; if `scaffold.runtime`
regresses, revert S2 alone and record `ServiceReferences` gap as arch-debt.
