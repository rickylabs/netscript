# Plan — #167 scaffolder hardening (pre-alpha.13)

Run-id: `plugin-167-harden--impl` • Branch: `chore/plugin-167-harden` • Base: `main`
Archetype: ARCHETYPE-5 (plugin) + ARCHETYPE-2/3 (packages/plugin protocol, packages/cli) • Scope: SCOPE-service N/A; framework source.
Skill stack: `netscript-harness`, `netscript-doctrine`, `netscript-deno-toolchain`, `netscript-tools`, `netscript-cli`.

> **PLAN-EVAL cycle 2 revision.** Cycle-1 verdict (OpenHands minimax-m3, run `28325898406-1`) returned
> `FAIL_PLAN` with 6 required fixes — all tweaks, not redesigns. This revision pre-commits every
> hedged decision and binds every gate. Fixes are folded into Decisions 2/3/4, the new Decision 6,
> the Gates section, and the per-slice acceptance gates below; a `## Cycle-1 fix map` cross-references
> each.

## Research summary (re-baselined against `main` @ 35f7dbd3)

The #167 marketplace-foundation PR (#168) introduced **plugin-owned dx scaffolders** and a per-plugin
root manifest `scaffold.plugin.json`. Ground truth:

- **Canonical manifest contract already exists**: `packages/plugin/src/protocol/manifest.ts` exports
  `PluginInstallerManifest` (TS interface) + `PluginInstallerManifestSchema` (Zod, `.strict()` at
  `manifest.ts:174`) + `parsePluginManifest()` (`manifest.ts:243-259`, calls `safeParse` with no
  preprocessing). `PLUGIN_MANIFEST_SCHEMA_VERSION = 1`. This Zod schema is the single source of truth
  and is the **only** correct origin for a JSON Schema (hand-authoring would drift).
- **zod is v4**: `packages/plugin/deno.json` pins `"zod": "jsr:@zod/zod@4.4.3"`, which ships native
  `z.toJSONSchema()`. The generator uses it directly (no `zod-to-json-schema` dependency needed).
- **5 committed manifests**: `plugins/{workers,sagas,streams,triggers,auth}/scaffold.plugin.json`,
  shape = `schemaVersion,name,version,displayName,description,peerDependencies,capabilities,
  scaffolder{export,requiredPermissions},provider{…},officialSource{…}`. None has a `$schema` key today,
  and because the schema is `.strict()`, today's `parsePluginManifest` would **reject** any manifest
  carrying a `$schema` key — so `$schema` tolerance must be handled before any manifest gains the key.
- **Installer already validates**: `packages/cli/src/public/features/plugins/add/jsr-plugin-validator-port.ts`
  + `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts` parse the fetched manifest through
  `parsePluginManifest`. So *runtime* validation exists; what is missing is **(a) editor
  IntelliSense/validation via `$schema`** and **(b) a static CI gate** asserting every committed
  manifest validates + the schema is fresh.
- **Version-coherence defect**: scaffolder emitters hardcode `0.0.1-alpha.12`. workers/sagas/streams/
  triggers via `const NETSCRIPT_VERSION = '0.0.1-alpha.12'`; auth via bare literals at
  `plugins/auth/src/scaffold/artifacts.ts:82,87` + `plugins/auth/src/scaffold/templates/root/deno-json.ts`.
  `release:cut` bumps `deno.json`/`scaffold.plugin.json`/`deno.lock` only, NOT these `.ts` emitters, and
  `findVersionResidue()` does not scan `.ts` → alpha.13 CLI would scaffold alpha.12 userland projects (a
  coherence/zero-legacy violation). The deps resolve (alpha.12 is published), so it is not a hard publish
  blocker, but it must be fixed for "prod CLI scaffold must FULLY work" + zero-legacy.
- **`arch:check` is local-only and is NOT in CI**: `.github/workflows/ci.yml` (verified line-by-line)
  runs only `check`, `test`, `lint`, `fmt:check`, `check:scaffold-versions`, `publish:dry-run`,
  `audit:critical`, `deps:latest`. `arch:check` (today just `check-doctrine.ts` on the auth surface)
  is **not** wired into any workflow. So adding `plugins:check` to `arch:check` alone does NOT make it
  CI-enforced — this PR must also add an explicit `arch:check` step to `ci.yml`.

## Locked decisions

1. **JSON Schema is generated from Zod, never hand-authored.** Add a generator
   (`.llm/tools/plugin/generate-manifest-schema.ts` exposed as `deno task plugins:schema:gen`) that emits
   `packages/plugin/schema/scaffold.plugin.schema.json` from `PluginInstallerManifestSchema` using zod v4
   native `z.toJSONSchema()` (wrap, do not reinvent). The schema file ships with `@netscript/plugin`
   (see Decision 5 for publish.include + `./schema` export).

2. **`$schema` tolerance = strip-before-parse (canonical schema stays strict).** Do **NOT** add `$schema`
   as an optional field to `PluginInstallerManifestSchema` — that would widen the published protocol and
   force every plugin author to learn a new optional key. Instead, strip the `$schema` key (and only
   `$schema`) from the parsed JSON object immediately before `PluginInstallerManifestSchema.safeParse()`
   at the CLI validator call sites — primarily
   `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts` (the JSR/HTTPS fetch path the
   evaluator flagged ~line 90) and any other path that feeds a fetched manifest into
   `parsePluginManifest`/the schema. `parsePluginManifest` itself stays unchanged (same strict
   validation; same byte-stable semantics). Each committed `plugins/*/scaffold.plugin.json` then gains a
   `$schema` key (relative path to the canonical schema) for in-repo IntelliSense, and any
   scaffolder-emitted userland manifest points `$schema` at the published URL form (Decision 5). The
   strip is localized, deterministic, and the round-trip test (Decision 6) proves a `$schema`-bearing
   manifest both passes the strip path and the canonical schema rejects unknown keys.

3. **Plugins-arch validation gate (#156) — CI-enforced.** Add `deno task plugins:check` that, for all 5
   plugins: (a) parses each `scaffold.plugin.json` via `parsePluginManifest` (after the `$schema` strip)
   — must be ok; (b) asserts the JSON Schema is fresh (regenerate to a temp + byte-diff; fail on drift);
   (c) asserts no stale version pin in scaffolder source (`plugins/*/src/scaffold/**/*.ts` contains no
   `0.0.1-alpha.*` / version literal other than the current workspace version — backstops Decision 4).
   Wire `plugins:check` into `arch:check`, **and add an explicit `deno task arch:check` step to the
   `quality` job in `.github/workflows/ci.yml`** so the gate runs on every PR (this is the load-bearing
   half of the fix — `arch:check` is local-only today). Record in the slice commit that this PR promotes
   `arch:check` from local-only to CI-enforced. This single gate satisfies #156 and is the permanent
   guard for #153 + the version-coherence fix.

4. **Version-coherence (single-source) — release:cut bound deterministically.** Make scaffolder emitters
   derive the pin from a single committed source so no stale pins can recur. The S4 prod userland-install
   e2e (`scaffold.runtime`) is the deciding signal:
   - **If** the e2e proves a JSON text-import of the plugin's own `deno.json` `version`
     (`with { type: 'json' }`, JSR-safe) resolves at scaffold-runtime from the **published tarball** and
     the scaffolded project pins the bumped version end-to-end → **adopt the primary path**; record the
     decision + evidence in `drift.md`; do **NOT** extend `release:cut` (the plugin `deno.json` is already
     bumped by `coordinateVersionBump`, so it is genuinely the single source).
   - **Otherwise** → adopt the fallback: a committed `plugins/<p>/src/scaffold/version.ts` constant, AND
     in the **same S4 commit** extend `findVersionResidue()` + `bumpVersion()` in `.llm/tools/release/`
     to scan/bump that file path (update the residue-scan regex to include `src/scaffold/version.ts`).
   - Either way: normalize auth to the same single-source pattern (kill the bare literals at
     `artifacts.ts:82,87`), and the `plugins:check` stale-pin assertion (3c) is the permanent backstop.

5. **Publishable schema asset (jsr-audit).** Add `packages/plugin/schema/scaffold.plugin.schema.json` to
   `packages/plugin/deno.json` `publish.include`, and re-export it as a named export so plugin authors
   can reference the canonical URL form for `$schema` in JSR-published userland manifests:
   `"./schema": "./schema/scaffold.plugin.schema.json"` (JSON export) — or a thin `./schema/mod.ts`
   barrel if a TS surface is preferred. This is consistent with the asset doctrine (`@netscript/cli`
   already ships `assets/schema/**/*.json` via publish.include) and avoids ad-hoc URL minting. The asset
   is JSON (no slow-type risk). Emitted userland manifests set `$schema` to the
   `jsr:@netscript/plugin/schema`-derived URL.

6. **Zod↔JSON-Schema round-trip + manifest regression test (S1).** Add/extend
   `packages/plugin/src/protocol/manifest_test.ts` to assert: (a) `parsePluginManifest` accepts all 5
   committed `scaffold.plugin.json` manifests (regression guard against the strip path + schema drift);
   (b) regenerating the JSON Schema is byte-stable for the committed schema file (drift guard — same
   check `plugins:check` runs, pinned as a unit test); (c) a manifest with an extra unknown key fails
   `parsePluginManifest` (proves `.strict()` still rejects), and a manifest carrying only `$schema`
   passes the strip path. This concretely discharges the zod→json-schema fidelity risk instead of
   deferring it. If zod v4 cannot emit root `additionalProperties:false` for `.strict()`, record in
   `drift.md` and hand-wrap only the schema root (no contract change).

## Out of scope (record, do not do here)
- Plugin remove/uninstall, marketplace portal/signatures, package rename (ISSUE-167-* backlog).
- Doc-site plugin pages + tutorials (post-publish task #152).
- Plugin READMEs (parallel docs lane, task #154 — MERGED as PR #171).

## Gates
`deno task check` (+`--unstable-kv` for workspace check wrappers), `deno task lint`, scoped fmt
(`--ext ts,tsx`), `deno task arch:check` (now incl. `plugins:check`, **and newly wired into `ci.yml`**),
`deno task plugins:check`, `deno task test` (plugin protocol incl. the new `manifest_test.ts` + cli
plugin-registry suites), and the prod userland-install e2e
(`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`) to prove version-coherence end to
end. Publish surface unaffected except the additive `./schema` asset (Decision 5).

## Commit slices (one branch, sequential commits — each commits, pushes, PR-comments)
- **S1**: schema generator (`plugins:schema:gen`) + generated `scaffold.plugin.schema.json` + publish.include
  + `./schema` export (Decision 5) + Zod `$schema` strip-before-parse at CLI validator call sites
  (Decision 2) + `manifest_test.ts` round-trip/regression test (Decision 6).
  *Acceptance:* `deno task check`, `deno task lint`, scoped fmt, `deno task test` (manifest suite) green;
  `deno task publish:dry-run` for `@netscript/plugin` clean (schema asset publishable).
- **S2**: `$schema` wiring into the 5 committed manifests (relative path) + emitted-manifest `$schema`
  (published URL form).
  *Acceptance:* all 5 manifests still parse via `parsePluginManifest` (strip path); fmt green.
- **S3**: `plugins:check` task + `arch:check` inclusion + **explicit `arch:check` step added to
  `.github/workflows/ci.yml` `quality` job** (Decision 3).
  *Acceptance:* `deno task plugins:check` green locally; `deno task arch:check` green; ci.yml yaml-valid.
- **S4**: version-coherence single-source (+ auth normalization), **decided by the e2e** (Decision 4); if
  fallback, `release:cut` residue+bump extension lands in this same commit.
  *Acceptance:* `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green AND the
  scaffolded userland project pins the bumped (alpha.13-train) version, not alpha.12;
  `deno task plugins:check` stale-pin assertion green; path taken recorded in `drift.md`.
- **S5**: dead-code sweep (#155) — remove code orphaned by #168 (CLI-embedded plugin scaffold templates
  superseded by plugin-owned `./scaffold`, unused exports/symbols, dead branches). Remove only what is
  provably unreferenced; record anything ambiguous as arch-debt rather than guessing.
  *Acceptance (bound explicitly):* before commit — (a) `deno task check` green, (b) `deno task lint`
  green, (c) scoped fmt `--ext ts,tsx` green, (d) `deno task test` green (full repo — catches
  plugin-registry/dynamic-import regressions static scans miss), (e)
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green (catches userland-install
  regressions). None deferred to a later slice.

## Cycle-1 fix map (evaluator FAIL_PLAN → resolution)
1. **CI gate wiring** → Decision 3 + S3 acceptance: explicit `deno task arch:check` step added to
   `ci.yml` `quality` job; PR documents the local-only→CI promotion.
2. **`$schema` tolerance** → Decision 2: pre-committed to strip-before-parse at CLI validator call sites;
   canonical schema stays `.strict()` (not widened).
3. **Version-coherence binding** → Decision 4 + S4 acceptance: e2e is the deciding signal; primary path
   does not touch `release:cut`; fallback extends `findVersionResidue()`/`bumpVersion()` in the same S4
   commit; path recorded in `drift.md`.
4. **S5 acceptance gate** → S5 acceptance: bound to check + lint + scoped fmt + full `test` + scaffold.runtime e2e, in-slice.
5. **jsr-audit schema asset** → Decision 5: publish.include + `./schema` export documented; CLI asset precedent cited.
6. **S1 round-trip test** → Decision 6: `manifest_test.ts` proves parse-accepts-5, schema byte-stable, extra-keys-fails, `$schema`-strip-passes.

## Debt / risk
- zod v4 `toJSONSchema()` fidelity for `.strict()` root `additionalProperties:false`, `z.record`, enums,
  and `.refine(isSafeExportPath)` (serializes as pattern/format annotation; runtime refine retained):
  Decision 6 test is the guard; record any unsupported-construct gap in `drift.md` and hand-wrap only the
  schema root if needed.
- If the `deno.json` json-import single-source is not tarball-resolvable, Decision 4 fallback applies in
  the same S4 commit; record which path was taken in `drift.md`.
