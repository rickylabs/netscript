# Grounding — Deno-native plugin-install feasibility (issue #167)

Source: read-only feasibility/grounding agent (ac1ed46e6eb2f9b57), run against `netscript-wave5-apps`
@ alpha.12, Deno 2.9.0 stable. No files edited. This is research stream (a) of two feeding the #167
plan; stream (b) is the OpenHands + Gemini 3.5 Flash marketplace competitive deep-search posted to
issue #167 comments.

## FEASIBILITY VERDICT: IMPLEMENTABLE — one corrected primitive + one open naming fork

The design is implementable on Deno 2.9 + JSR essentially as imagined. Each pipeline step maps to a
confirmed Deno-native mechanism, and the repo already has the load-bearing primitive
(`dispatchPluginVerb` runs `deno x -A jsr:<pkg>/cli`).

1. **"`deno x` / `dx jsr:…`" is CORRECT and exists in 2.9** — not hypothetical. `deno x --help` →
   "Execute a binary from npm or jsr, like npx." `dx` is the optional installed alias
   (`deno x --install-alias`). Terminology in the design is accurate.
2. **Step 5 ("run the plugin's OWN scaffolder via dx") has a real gap**: today the plugin `./cli`
   exports dispatch *operational* verbs only; NO plugin ships a `scaffold`/`add` verb that emits
   project artifacts. Artifact emission lives exclusively in CLI-embedded `generatePlugin*`
   generators (`scaffolder.ts`). The dx-runner exists; the dx-runnable *scaffolder* does not yet.
   This is the core new work — buildable, but net-new per plugin, not a wiring change.
3. **The bare-name resolver example `@netscript/workers` does not match reality** — published
   packages all carry the `plugin-` prefix (`@netscript/plugin-workers`). Genuine open decision.
4. Everything else (resolve, JSR validation, metadata for confirmation, integrity, `deno add`
   runtime wiring, permission scoping) maps cleanly to confirmed APIs.

## DENO-NATIVE MECHANICS (all CLI-verified on Deno 2.9.0)

**Run a JSR-published bin (`deno x`):**
- `deno x jsr:@scope/pkg` (default export) or `deno x jsr:@scope/pkg/cli` (named subpath). Args
  after the spec pass straight through.
- `-p/--package` selects package vs binary independently (`deno x -p typescript tsc`).
- A JSR package becomes runnable by exposing an export whose top-level side effects are guarded by
  `import.meta.main` (library import stays inert). npm-style `bin` also works for npm specs.
- `deno x` passes through all permission flags (`--help=full`): `-A`, `-R/--allow-read[=PATH]`,
  `-W/--allow-write[=PATH]`, `-N/--allow-net`, `-E/--allow-env`, `--allow-run`, plus `--deny-*`.
  Also `--allow-scripts[=PKG]` (post-install lifecycle, node_modules-dir only), `-y/--yes`, and
  `--minimum-dependency-age <0|...>` (needed to install fresh alpha packages past the age guard).
- Doc: https://docs.deno.com/runtime/reference/cli/x/

**Permission scoping (path confinement is real):** `--allow-write="/abs/project/path"` confines
writes to that subtree; same for `--allow-read`, `--allow-net="jsr.io:443"`. `-A` turns the sandbox
off entirely — reserve for trusted first-party only.
Doc: https://docs.deno.com/runtime/fundamentals/security/

**JSR validation + metadata (verified, `Accept: application/json`):**
- Package metadata — `GET https://jsr.io/@<scope>/<pkg>/meta.json` → `{ scope, name, latest,
  versions: { <ver>: { createdAt?, yanked? } } }`. Existence + latest + yank for steps 2–3. 404 ⇒
  not a real JSR package.
- Version metadata — `GET https://jsr.io/@<scope>/<pkg>/<version>_meta.json` → `{ manifest:
  { "/path": {size,checksum:"sha256-…"} }, moduleGraph1, exports: {".":"./mod.ts", …} }`. The
  `exports` map lets us verify a `./cli`/scaffolder subpath exists (step 3 protocol check); the
  per-file sha256 checksums back integrity verification (step 6).
- Rich details for step-4 confirmation — `GET https://api.jsr.io/scopes/<scope>/packages/<pkg>` →
  `{ scope, name, description, githubRepository:{owner,name,…}, runtimeCompat:{deno,node,…}, score,
  latestVersion, versionCount, isArchived, readmeSource, … }`. Exactly the metadata to render in the
  "confirm external package" prompt.
- Required header: `Accept` must NOT include `text/html`, no `Sec-Fetch-Dest: document` (why WebFetch
  403s; `curl`/Deno `fetch` with `Accept: application/json` works).
- `deno info jsr:@scope/pkg` gives resolved graph but NOT description/author — use HTTP APIs for the
  confirmation payload.
- Docs: https://jsr.io/docs/api , https://github.com/jsr-io/jsr/blob/main/frontend/docs/api.md

**`deno add` (runtime wiring, thin, no copy):** `deno add jsr:@scope/pkg` writes to the `imports`
map in `deno.json` with a caret range (`--save-exact` to pin). Correct primitive for the plugin's
*runtime* dependency — thin import, zero source copy, no userland source leak.
Doc: https://docs.deno.com/runtime/reference/cli/add/

## PLUGIN PROTOCOL (proposed, grounded in existing `scaffold.plugin.json`)

The seed already exists and already ships to JSR (`scaffold.plugin.json` is in every plugin's publish
`include`). Proposed published protocol = formalize the existing manifest + add a runnable scaffolder
export:
- **Manifest** (`scaffold.plugin.json`, `schemaVersion:1`): keep the two existing blocks — `provider`
  (full `PluginKindProvider`: kind, category `plugin|background-processor`, portRangeKey,
  defaultPermissions[], entrypoints, db/kv requirements, concurrency, telemetry,
  `infrastructureRequires[]`) and `officialSource` (canonicalName, dirs, ports, `dependencies[]`,
  `pluginReferences[]`). Today typed only by local TS interfaces (`ScaffoldPluginManifest`/
  `OfficialSourceManifest` in `maintainer/adapters/official-plugin-source.ts:88,94`, `provider` as
  `PluginKindProvider` in `kernel/domain/plugin-kind.ts:53`), parsed untyped (`JSON.parse(...) as …`
  at `official-plugin-source.ts:252`). NEW WORK: promote to a versioned, published, zod-validated
  contract (none today) so third parties can author against it and the validator (step 3) can verify.
- **dx-runnable scaffolder export**: each plugin adds a runnable entrypoint — either a `bin` field
  (the convention `@netscript/cli` already uses at `packages/cli/deno.json:11`) or an `./scaffold`
  export — guarded by `if (import.meta.main)`, invoked as
  `deno x jsr:@netscript/plugin-<kind>/scaffold`. Must emit the prisma/service/routes/Aspire
  artifacts currently produced by the CLI's `generatePlugin*`. Today `./scaffolding` is only a static
  descriptor (`plugins/streams/src/scaffolding/mod.ts` exports `streamsScaffolder =
  {pluginName, files, itemTemplates:false}` — metadata, emits nothing). Prior art for the runnable
  shape: operational CLIs (`plugins/streams/src/cli/composition/main.ts:12-29`, documented
  `deno x -A jsr:@netscript/plugin-streams/cli`).
- **auth is the outlier**: no `./cli`, no `./scaffolding` export — needs both added from scratch.

## REPO REUSE MAP (file:line)

**Reuse:**
- `PluginKindProvider` shape (`kernel/domain/plugin-kind.ts:53`) + `provider` block — seed of the
  published protocol.
- `PluginKindRegistry` (`kernel/application/registries/plugin-kind-registry.ts:20`) kind→provider map
  — keep, but seed from JSR-fetched manifests instead of a checkout walk.
- `dispatchPluginVerb` (`public/features/plugins/dispatch/dispatch-plugin-verb.ts:42`) — runs
  `deno x -A jsr:<pkg>/cli <verb>` via a `ProcessPort`, with `resolvePluginCliSpecifier()` (`:36`)
  prepending `jsr:`/appending `/cli`. THIS is the dx-runner the new installer calls — extend it to a
  `scaffold` verb.
- Workspace mutators (appsettings/netscript.config/imports/Aspire helper regen)
  `add-plugin.ts:107-148` — keep, fed by manifest+dx output.
- `bin` convention from `packages/cli/deno.json:11-13` (`"bin":{"netscript":"./bin/netscript.ts"}`).

**Replace:**
- CLI-embedded `renderPlugin`/`PluginScaffolder.scaffold` (`scaffolder.ts:52`) + `generatePlugin*`
  (`kernel/templates/plugins/plugin-generators.ts`, imported `scaffolder.ts:22-31`) — moves into
  plugin-owned dx scaffolders (design's "no CLI-embedded templates").
- `findOfficialPluginSourceRoot`/`hasOfficialPluginSources`
  (`maintainer/adapters/official-plugin-source.ts:157,267`) + `copyOfficialPlugin` +
  `official-plugin-copier.ts:12` — the checkout-walk + source-copy path is incompatible with userland
  JSR install and the "no source copy" rule.

**New components:** (1) Resolver bare-kind→JSR spec + scoped-name passthrough; (2) JSR validator
(meta.json existence + version_meta.json `exports`/checksums); (3) protocol validator (manifest
contract = "is a real NetScript plugin"); (4) confirmation gate from `api.jsr.io` metadata, with
`--skip-confirmation`/`--ci`; (5) dx-runner for the `scaffold` verb (extend `dispatchPluginVerb`);
(6) integrity verify against version_meta sha256 + declared post-install scripts; (7) flag surface
symmetry: maintainer defaults `--local-path` / accepts `--jsr-url`; prod defaults JSR / accepts
`--local-path`.

## SECURITY MODEL

- **Minimal scaffolder permission set** (path-confined, NOT `-A`): `--allow-write="<absProjectRoot>"`,
  `--allow-read="<absProjectRoot>,<denoCache>"`, `--allow-net="jsr.io:443,api.jsr.io:443"` (fetch own
  deps), `--allow-env` scoped, `--allow-run` ONLY if the plugin declares post-install commands (scope
  to those program names). `--deny-write` userland secrets/`.git` as defense-in-depth.
- **First-party (`@netscript/*`) trusted** → may run `-A` (matches current `dispatchPluginVerb`).
  **Third-party untrusted** → path-confined set + the step-4 confirmation gate rendering
  `api.jsr.io` description/githubRepository/score/runtimeCompat before any execution;
  `--skip-confirmation`/`--ci` bypass only.
- `--minimum-dependency-age=0` required for fresh alpha installs but widens supply-chain exposure —
  keep default-off for third-party, opt-in.
- Integrity: verify fetched files against `version_meta.json` sha256 before running; run declared
  post-install scripts only under the confined permission set / `--allow-scripts=<pkg>`.

## e2e PLAN (true userland install)

Current `scaffold.runtime`/`plugin-add-gates.ts` is a blind spot: `create-default-runner.ts:49` sets
`repoRoot=resolve('.')` (monorepo cwd), `:54` puts the project at `<repoRoot>/.llm/tmp/cli-e2e`
inside the checkout, `:53`→`defaultCliEntrypoint` runs `packages/cli/bin/netscript-dev.ts` (local dev
CLI). So the upward walk always finds `packages/cli/bin/netscript.ts` + manifests → copier path
engages; the "JSR" axis never touches the registry. A true userland e2e needs: (1) project root in
`Deno.makeTempDir()` OUTSIDE any checkout; (2) install/run the published CLI
(`deno x jsr:@netscript/cli@<ver>` or `deno install`), not `netscript-dev.ts`; (3) real JSR install
of `@netscript/plugin-*` with `--minimum-dependency-age=0`; (4) assert the dx scaffolder wrote
artifacts AND no plugin source was copied into userland.

## OPEN DECISIONS FOR PLAN/USER (not decided)

1. **Kind→package naming convention.** Published names all carry `plugin-`
   (`@netscript/plugin-workers`); the issue example `@netscript/workers` matches nothing.
   - (A) keep prefix + resolver maps bare kind→`@netscript/plugin-<kind>s` (needs a
     pluralization/alias map; zero republish), vs
   - (B) rename to `@netscript/<kind>` (cleaner marketplace identity; re-publish all 5, rewrite
     cross-imports, break alpha.12 consumers, orphan old names).
   - Also resolve singular kind vs plural package/dir (`worker`→`workers`; `auth` singular both).
2. **Trust tier for `-A` vs confined permissions** — is first-party `@netscript/*` auto-trusted with
   `-A`, or does everything run confined? (Affects scaffolder authoring ergonomics.)
3. **Whether to formalize the manifest as a separately-published `@netscript/plugin-protocol`
   contract package** (third-party authoring target) vs keep it inline in each plugin's
   `scaffold.plugin.json`.

**Sources:** deno x (https://docs.deno.com/runtime/reference/cli/x/), deno add
(https://docs.deno.com/runtime/reference/cli/add/), Deno security
(https://docs.deno.com/runtime/fundamentals/security/), JSR API
(https://github.com/jsr-io/jsr/blob/main/frontend/docs/api.md). All Deno CLI flags, `deno --version`
(2.9.0), and JSR JSON shapes verified live in WSL.
