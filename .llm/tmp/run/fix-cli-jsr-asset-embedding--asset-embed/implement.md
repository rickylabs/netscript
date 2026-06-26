use harness

# Codex Implementation Brief — CLI bundled-asset access: one import-attribute strategy behind one port

You are the daemon-attached WSL Codex implementation agent for run
`fix-cli-jsr-asset-embedding--asset-embed`, branch `fix/cli-jsr-asset-embedding`
(off `origin/main` @ alpha.4). The supervisor (Claude) authored `research.md` and `plan.md` in
`.llm/tmp/run/fix-cli-jsr-asset-embedding--asset-embed/`. PLAN-EVAL is waived by the user for this
slice; the user will self-review the PR. Read `research.md` and `plan.md` first — they are the
contract. Do not restate; implement.

## SKILL

Read and apply, in order, before any code:
- `.agents/skills/netscript-harness/SKILL.md` — run loop, commit-per-slice, artifacts.
- `.agents/skills/netscript-doctrine/SKILL.md` — ports/adapters, archetype, public-surface gates.
  This slice is a doctrine re-convergence (one port owns asset access). Honor it.
- `.agents/skills/netscript-cli/SKILL.md` — CLI/scaffold internals, template registry, scaffolders.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — `deno doc`, `publish:dry-run`, import
  attributes, lock/version hygiene.
- `.agents/skills/jsr-audit/SKILL.md` — full-export-map `deno doc --lint` bar for the new embedded
  exports on `@netscript/plugin` and `@netscript/fresh-ui`.
- `.agents/skills/netscript-tools/SKILL.md` — scoped check/lint/fmt wrappers, raw git verification.
- `.agents/skills/netscript-pr/SKILL.md` — branch/PR/comment conventions.

## Non-negotiables

1. **One strategy.** All bundled assets load via import attributes
   (`with { type: 'text' }` / `with { type: 'json' }`). NO `Deno.readTextFile`, `fromFileUrl`,
   `import.meta.resolve(bare)`, or `fetch()` anywhere on a JSR-prod asset-access path. Precedent:
   `packages/cli/src/kernel/adapters/scaffold/editor-config.ts:9`.
2. **One port, one way in.** Delete the `URL` overload from `readTemplateAsset` /
   `readTemplateAssetSync` (`template-asset.ts:17,30`). The only argument is a `TemplateKey`. This
   forces every consumer through the registry.
3. **Embedded-backed registry.** Construct `TemplateRegistry` from an embedded content map; remove
   `ASSET_ROOT_URL` (`template-registry.ts:10`), the `url` field on `TemplateValue`, and the
   `#hydrate()` fetch loop (`:60-66`). `content` is always present. `hydrate()` → delete if no
   external caller remains, else no-op.
4. **Generated barrel.** Add a codegen that maps `TEMPLATE_KEYS` → one static
   `import … with { type: 'text' }` (or `json`) per asset, exporting `Record<TemplateKey,string>`.
   Content stays in the `.template`/json files. Wire a `gen:assets-barrel` task and a
   `check:assets-barrel` gate (regenerate → `git diff --exit-code` clean). Specifiers MUST be static
   literals — no dynamic-path imports.
5. **Scaffold output bytes unchanged.** This is a transport change only. `scaffold.runtime` output
   must be byte-identical. If any output differs, STOP and log to `drift.md`.
6. **Asset ownership.** `@netscript/plugin` and `@netscript/fresh-ui` own their own embedded content
   (their own barrels + public exports). The CLI consumes data (records/maps), never a `templateRoot`
   path or a registry directory.

## Commit slices (commit + push + PR comment + append commits.md after EACH)

Order chosen so the `--help` crash dies early and fresh-ui (the architectural unit) is last/isolatable.

- **S1 — CLI embedded registry + kill URL overload.** Generated barrel + codegen + gate; rewrite
  `TemplateRegistry` to embedded-backed; delete `URL` overload; thin scaffolders #3–#6
  (`service/scaffolder.ts`, `database/scaffolder.ts`, `plugin/registry-scaffolder.ts`,
  `windows/environment/env-file-writer.ts`) — promote their templates into `TEMPLATE_KEYS` if not
  present, delete the `new URL(...)` constants, call `renderTemplateAssetSync(key, vars)`. Update
  `template-registry_test.ts` / `template-asset_test.ts` to assert embedded content (not fs/url).
- **S2 — plugin skeleton (`--help` crash).** Add embedded skeleton content to `@netscript/plugin`
  via `./templates` (`Record<PluginSkeletonTemplatePath,string>`, import-attribute barrel). In the
  CLI, delete `pluginTemplateRoot` / `import.meta.resolve` (`public-command-dependencies.ts:177-179`)
  and have the plugin scaffold consume the embedded record instead of a `templateRoot` + fs reads.
- **S3 — fresh-ui registry.** Add a public embedded registry export to `@netscript/fresh-ui`
  (manifest + every component file content as a record, import-attribute barrel). Rewrite CLI
  `ui/registry.ts` (`defaultFreshUiRegistryRoot` + `installUiRegistryItems`) to consume embedded
  content + manifest; import-rewriting runs on content strings. Remove `fromFileUrl(new URL(...))`.

## Validation (record evidence in worklog.md per slice; full list in plan.md)

- `run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx`
- `gen:assets-barrel && git diff --exit-code` (no diff)
- scoped lint + fmt (ts,tsx only)
- `deno doc --lint` over the FULL export map of plugin + fresh-ui (not mod.ts alone)
- `deno task publish:dry-run` for cli, plugin, fresh-ui (assets + barrel shipped, no slow-types)
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (output byte-identical)
- `e2e-cli-prod` is the MERGE BAR (run against the published alpha.5; coordinate with release train).

## Boundaries

- Do NOT touch bucket-B reads (maintainer-time/local/runtime-of-scaffolded-project; see plan
  Non-Scope). Do NOT couple in the parallel plugin-copy/userland `plugins/` concern (separate slice).
- Lock hygiene: do not churn root `deno.lock` without need; no `deno cache --reload`.
- Push slice branch via explicit refspec `git push origin HEAD:refs/heads/fix/cli-jsr-asset-embedding`.
- Stage only relevant files by explicit path; never `git add -A`.
- If import attributes need `--unstable-raw-imports` on the CI build (they did NOT in 2.8.3/2.9.0
  spikes) → log to `drift.md` and add the flag to the relevant task.
