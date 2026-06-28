# Plan — #167 scaffolder hardening (pre-alpha.13)

Run-id: `plugin-167-harden--impl` • Branch: `chore/plugin-167-harden` • Base: `main`
Archetype: ARCHETYPE-5 (plugin) + ARCHETYPE-2/3 (packages/plugin protocol, packages/cli) • Scope: SCOPE-service N/A; framework source.
Skill stack: `netscript-harness`, `netscript-doctrine`, `netscript-deno-toolchain`, `netscript-tools`, `netscript-cli`.

## Research summary (re-baselined against `main` @ 35f7dbd3)

The #167 marketplace-foundation PR (#168) introduced **plugin-owned dx scaffolders** and a per-plugin
root manifest `scaffold.plugin.json`. Ground truth:

- **Canonical manifest contract already exists**: `packages/plugin/src/protocol/manifest.ts` exports
  `PluginInstallerManifest` (TS interface) + `PluginInstallerManifestSchema` (Zod, `.strict()`) +
  `parsePluginManifest()`. `PLUGIN_MANIFEST_SCHEMA_VERSION = 1`. This Zod schema is the single source
  of truth and is the **only** correct origin for a JSON Schema (hand-authoring would drift).
- **5 committed manifests**: `plugins/{workers,sagas,streams,triggers,auth}/scaffold.plugin.json`,
  shape = `schemaVersion,name,version,displayName,description,peerDependencies,capabilities,
  scaffolder{export,requiredPermissions},provider{…},officialSource{…}`. None has a `$schema` key today.
- **Installer already validates**: `packages/cli/src/public/features/plugins/add/jsr-plugin-validator-port.ts`
  + `infra/jsr/fetch-jsr-plugin-validator.ts` parse the fetched manifest through `parsePluginManifest`.
  So *runtime* validation exists; what is missing is **(a) editor IntelliSense/validation via `$schema`**
  and **(b) a static CI gate** asserting every committed manifest validates + the schema is fresh.
- **Version-coherence defect**: scaffolder emitters hardcode `0.0.1-alpha.12`. workers/sagas/streams/
  triggers via `const NETSCRIPT_VERSION = '0.0.1-alpha.12'`; auth via bare literals at
  `plugins/auth/src/scaffold/artifacts.ts:82,87` + `plugins/auth/src/scaffold/templates/root/deno-json.ts`.
  `release:cut` bumps `deno.json`/`scaffold.plugin.json`/`deno.lock` only, NOT these `.ts` emitters, and
  the residue check does not scan `.ts` → alpha.13 CLI would scaffold alpha.12 userland projects (a
  coherence/zero-legacy violation). The deps resolve (alpha.12 is published), so it is not a hard publish
  blocker, but it must be fixed for "prod CLI scaffold must FULLY work" + zero-legacy.
- **Existing arch gate**: `arch:check` only runs `check-doctrine.ts` on the auth surface; there is no
  plugins-wide manifest gate.

## Locked decisions

1. **JSON Schema is generated from Zod, never hand-authored.** Add a generator
   (`.llm/tools/plugin/generate-manifest-schema.ts` or a `deno task`) that emits
   `packages/plugin/schema/scaffold.plugin.schema.json` from `PluginInstallerManifestSchema`. Verify the
   installed zod version first: zod v4 → native `z.toJSONSchema()`; zod v3 → `zod-to-json-schema`
   (wrap, do not reinvent). The schema file ships with `@netscript/plugin` (add to publish.include).
2. **`$schema` wiring.** Add a `$schema` key to each committed `plugins/*/scaffold.plugin.json` (relative
   path to the canonical schema for in-repo IntelliSense). For any scaffolder-**emitted** userland
   manifest, point `$schema` at the published URL form (jsr/https for `@netscript/plugin`'s schema asset).
   `$schema` must be permitted by the Zod schema (today `.strict()` would reject it) — add `$schema` as an
   optional ignored key in `PluginInstallerManifestSchema` (or strip before parse) so validation still
   passes. Pick one and keep parse semantics intact.
3. **Plugins-arch validation gate (#156).** Add `deno task plugins:check` that, for all 5 plugins:
   (a) parses each `scaffold.plugin.json` via `parsePluginManifest` (must be ok), (b) asserts the JSON
   Schema is fresh (regenerate to a temp + byte-diff; fail on drift), (c) asserts no stale version pin in
   scaffolder source (`plugins/*/src/scaffold/**/*.ts` contains no version string other than the current
   workspace version). Wire `plugins:check` into `arch:check` and into CI (the existing check/lint
   workflow or a dedicated step). This single gate satisfies #156 and is the permanent guard for #153 +
   the version-coherence fix.
4. **Version-coherence (single-source).** Make scaffolder emitters derive the pin from a single
   committed source that `release:cut` already bumps, so no stale pins can recur. Preferred: import the
   plugin's own `deno.json` `version` via a JSON text import (`with { type: 'json' }`, JSR-safe) — but
   **only if** the prod userland-install e2e proves the scaffolded project pins the bumped version end to
   end. If that import does not resolve from the published tarball, fall back to a committed
   `src/scaffold/version.ts` constant and extend `release:cut` residue+bump to that file. The `plugins:check`
   stale-pin assertion (3c) is the backstop either way. Normalize auth to the same single-source pattern
   (kill the bare literals).
5. **Dead-code sweep (#155).** Remove code orphaned by #168: CLI-embedded plugin scaffold templates now
   superseded by plugin-owned `./scaffold`, unused exports/symbols, dead branches. Drive with
   `deno check` + lint + an unused-export scan; remove only what is provably unreferenced (no behavior
   change). Record anything ambiguous as arch-debt rather than guessing.

## Out of scope (record, do not do here)
- Plugin remove/uninstall, marketplace portal/signatures, package rename (ISSUE-167-* backlog).
- Doc-site plugin pages + tutorials (post-publish task #152).
- Plugin READMEs (parallel docs lane, task #154).

## Gates
`deno task check` (+`--unstable-kv` for workspace check wrappers), `deno task lint`, scoped fmt
(`--ext ts,tsx`), `deno task arch:check` (now incl. `plugins:check`), `deno task plugins:check`,
`deno task test` (plugin protocol + cli plugin-registry suites), and the prod userland-install e2e
(`deno task e2e:cli run scaffold.runtime --cleanup` / `true-userland-install-suite`) to prove
version-coherence end to end. Publish surface unaffected except the additive schema asset.

## Commit slices (one branch, sequential commits)
- S1: schema generator + generated `scaffold.plugin.schema.json` + publish.include + Zod `$schema` tolerance.
- S2: `$schema` wiring into the 5 committed manifests (+ emitted manifest if any).
- S3: `plugins:check` gate + `arch:check`/CI wiring.
- S4: version-coherence single-source (+ auth normalization), e2e-proven.
- S5: dead-code sweep.

## Debt / risk
- zod→json-schema fidelity for `.strict()` + `z.record` + enums: verify the generated schema round-trips
  (a sample valid + invalid manifest). Record any unsupported-construct gap as arch-debt.
- If the `deno.json` json-import single-source is not tarball-resolvable, decision 4 fallback applies;
  record which path was taken in `drift.md`.
