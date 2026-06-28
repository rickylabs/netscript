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

## Drift — PLAN-EVAL cycle-3 PASS_PLAN + consolidated-plan promotion (no re-gate)

- Date: 2026-06-28. Severity: significant (plan tightening, no architecture change).
- PLAN-EVAL cycle-3 (OpenHands minimax-M3, run `28329181305`, separate session) returned
  **PASS_PLAN** — all 8 Plan-Gate criteria `OK`. Trace committed to branch at
  `.llm/tmp/run/openhands/pr-170/run-28329181305-1/plan-eval-verdict.md`.
- The eval read the prior 145-line plan (its criterion 5 names a core `naming.ts`). The plan was then
  consolidated to the SOTA layered shape the user directed ("base class, adapter, port, abstract
  public surface; @std/text; jsr-audit doc bar"). The consolidated `plan-scaffold-core.md` (this
  promotion) is the authoritative version Codex implements.
- Deltas vs the PASSed plan, and why no cycle-4 re-gate:
  - Watcher-note 1 (delete per-plugin local `ScaffolderContext`/`ScaffoldResult` re-decls → import
    from `@netscript/plugin/protocol`) — folded in.
  - Watcher-note 2 (real `PluginScaffolder` abstract base over a `defineScaffold` factory) — locked.
  - Watcher-note 3 (`deno doc` of the new export in C6) — added as `deno doc --lint` over the full
    export map.
  - Watcher-note 4 (`buildArtifacts(context: ScaffolderContext)`, not custom `TInput`) — specified.
  - Doctrine Rule #3: hand-rolled casing → `@std/text` (delete `naming.ts`); a strict reduction of
    core surface in the direction the eval flagged casing as "reinvented" (criterion 1).
  - `SCAFFOLD-DENOJSON-ENVELOPE` elevated from approved-debt to in-scope **when byte-stable** (C5b),
    guarded by the same byte-identical invariant the eval blessed; stays debt if not byte-stable.
  - Rationale: deltas (1)–(4) + the std swap are tightenings the evaluator itself recommended or that
    strictly shrink the public surface; re-gating them re-evaluates the evaluator's own notes. C5b is
    invariant-guarded. The whole branch still faces adversarial impl review + IMPL-EVAL
    (OpenHands qwen3.7-max) before merge — the real net for the broadened scope.
- Implementation: WSL Codex daemon-attached session on `chore/plugin-167-harden`
  (`/home/codex/repos/netscript-wave5-apps`, daemon 0.142.3 managed). C1→C6 + C5b, slice-by-slice
  commit→push→PR-comment→append commits.md.

## Drift — C5b byte-stable skeleton extraction boundary

- Date: 2026-06-28. Severity: low (documented byte-stability boundary, no behavior drift).
- Extracted to core: `buildPluginDenoJson(spec, version)` for the generated-plugin `deno.json`
  envelope (`name`, fixed generated version `0.1.0`, exports/tasks/imports, default
  Deno/DOM compiler options) and `buildStandardScaffoldArtifacts(...)` for the standard first
  artifact trio (`scaffold.plugin.json`, `deno.json`, `mod.ts`).
- Applied to: workers, streams, sagas, and triggers scaffolders. These scaffolders still supply the
  plugin-specific exports, tasks, imports, and file-template bodies.
- Left per-plugin by byte-stability guard: auth `deno.json` remains in
  `plugins/auth/src/scaffold/templates/root/deno-json.ts` because it is a published-package template
  (`name: @netscript/plugin-auth`, branch package version, description/license, `publish` include /
  exclude, `doc-lint`/`publish:dry-run`/`verify` tasks, and strict/noImplicitAny/strictNullChecks
  compiler options). Forcing it through the generated-plugin envelope would change those fields and
  violate the byte-identical scaffold-output invariant.
