# Drift

- 2026-06-28 S1: implemented Decision 2 with a shared exported protocol helper
  `stripPluginManifestSchemaKey()` and used it at both CLI call sites
  (`fetch-jsr-plugin-validator.ts` and local-path `add-plugin.ts`). `parsePluginManifest()` itself
  remains unchanged and `PluginInstallerManifestSchema` remains `.strict()`, matching the passed
  plan plus evaluator watcher recommendation (b).
- 2026-06-28 S4: adopted the primary version-coherence path. Plugin scaffold emitters import their
  own `deno.json` version via JSON import, so `release:cut`/`coordinateVersionBump` remains the only
  version source and `.llm/tools/release/cut.ts` was not changed. Full `scaffold.runtime` e2e passed
  48/48 and retained generated artifacts under
  `.llm/tmp/cli-e2e/plugin-smoke-20260628-174019`; those artifacts pin the current branch version
  `0.0.1-alpha.12`. The branch has not been bumped to alpha.13, so the alpha.13 train proof is the
  same single-source mechanism rather than a literal alpha.13 string in this pre-release branch.
- 2026-06-28 adversarial fix: replaced the generated schema `$id` with the stable HTTPS docs-site
  URL `https://rickylabs.github.io/netscript/schemas/scaffold.plugin.schema.json`. The docs site is
  configured for GitHub Pages at `https://rickylabs.github.io/netscript/`; keeping `$id` unversioned
  avoids release-bump churn in the committed schema and `plugins:check` byte-stability gate. Editors
  fetch the instance `$schema`, not `$id`, so emitted userland manifests now use the version-pinned
  JSR raw asset URL
  `https://jsr.io/@netscript/plugin/${NETSCRIPT_VERSION}/schema/scaffold.plugin.schema.json`.

## Drift — scope expansion: scaffolding-primitives centralization (architectural)

- Date: 2026-06-28. Severity: **architectural** (user-initiated).
- Trigger: user reviewed `plugins/workers/src/scaffold/artifacts.ts` (+ siblings) and ruled the
  per-plugin reinvention of scaffolding primitives a **real pre-release blocker** — "the scaffolding
  primitives, base class, adapters … should be in core (packages/plugin, packages/cli); in plugins
  lives only the per-plugin specifics."
- Effect on PR #170: its own PLAN-EVAL + IMPL-EVAL **PASS** (schema/CI/dead-code infra is sound and
  retained). Merge is **held** so the duplicated `$schema`/version consts it added never reach `main`;
  the centralization folds onto the same branch `chore/plugin-167-harden`. Final adversarial-review +
  IMPL-EVAL re-run on the whole branch before merge; alpha.13 cut follows the single merge.
- New authoritative plan: `plan-scaffold-core.md` (this run dir). Gate: a fresh PLAN-EVAL
  (OpenHands minimax-M3, separate session) — no Codex implementation before `PASS_PLAN`.
- Deferred to arch-debt (not dropped): `SCAFFOLD-CASING-CLI-DUP` (dedupe the `packages/cli`
  template-adapter casing vs the new core `naming.ts`), `SCAFFOLD-DENOJSON-ENVELOPE` (optional common
  `deno.json` envelope extraction, only if byte-stable).
