# PLAN-EVAL Verdict — plugin-167-harden--impl

- **Plan evaluator session**: OpenHands run `28325898406-1` (separate from generator session)
- **Run**: `plugin-167-harden--impl`
- **PR**: #170 — `chore(plugin): #167 scaffolder hardening`
- **Surface / archetype**: ARCHETYPE-5 (plugin) + ARCHETYPE-2/3 (`packages/plugin` protocol, `packages/cli` plugin-add public surface)
- **Scope overlays**: none
- **Base**: `main` @ `35f7dbd3` (post #168, post #169 tooling)

## Summary

The plan is well-researched, the slices are appropriately scoped, and the single-source Zod→JSON Schema claim is sound (verified `zod@4.4.3` ships `z.toJSONSchema()`). However, the plan has a **CI wiring gap** that will silently nullify the gate it introduces (`arch:check` is not currently in `ci.yml`), an uncommitted `$schema` tolerance decision, an underdetermined version-coherence `release:cut` extension, and an under-bound S5 (dead-code) acceptance gate. None are blockers individually, but the first would defeat the gate's purpose and is the single most important fix.

**Verdict**: `FAIL_PLAN` — implementation must NOT begin until the listed fixes are made.

---

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `main @ 35f7dbd3`; load-bearing findings spot-checked against tree (manifest schema version 1 confirmed; 5 committed manifests present; `release:cut` residue pattern confirmed via `findVersionResidue()` walks; JSON text-import precedent confirmed at `packages/cli/src/kernel/constants/jsr-specifiers.ts:5` and `packages/cli/src/kernel/adapters/scaffold/editor-config.ts:9`); see evaluator spot-checks below. |
| Decisions locked                        | PARTIAL | Decisions 1, 2, 3, 5 are concrete and rationale-bearing. Decision 4 (version-coherence single-source) is **hedged** — primary path is "JSON text-import of plugin's own `deno.json`", with "fallback to a committed `src/scaffold/version.ts` + extend `release:cut`" if that import does not resolve from a published JSR tarball. Plan does not pre-commit which `release:cut` files to extend, and the prod userland-install e2e is named as the proving gate but does not constrain which path is taken. **Fix 3 below.** |
| Open-decision sweep                     | FAIL   | Evaluator found 3 unlisted open decisions that would force rework if deferred: (a) which `$schema` tolerance strategy to adopt before S1 lands (strip-before-parse vs. add optional field to schema) — both have different downstream consequences; (b) `arch:check` is **not currently in `.github/workflows/ci.yml`** — only `check`, `test`, `lint`, `fmt:check`, `check:scaffold-versions`, `publish:dry-run`, `audit:critical` are wired (verified `ci.yml` line-for-line) — so plan's "wire `plugins:check` into CI" is insufficient on its own; (c) S5 dead-code acceptance gate is not bound to behavior tests. **Fixes 1, 2, 4 below.** |
| Commit slices (< 30, gate + files each) | PARTIAL | 5 slices (S1–S5), well under the 30 ceiling. Each slice names a gate but **S5 acceptance is not bound**: plan lists cross-slice gates but does not say S5 must keep `deno task test` + the prod userland-install e2e green AS PART OF S5 commit. Dead-code removals are high-risk for behavior change, so this binding matters. **Fix 4 below.** |
| Risk register                           | PASS   | "Debt / risk" section in `plan.md` covers zod→json-schema fidelity (round-trip), `$schema` tolerance choice, JSON text-import tarball resolvability, and `release:cut` residue-extension path. Plan correctly defers concrete gaps to `drift.md` per skill doctrine. |
| Gate set selected                       | PARTIAL | Plan lists gates correctly (check, lint, scoped fmt, arch:check w/ plugins:check, plugins:check, test, prod e2e). However the **CI gate** the plan relies on (`plugins:check` via `arch:check`) is not actually wired in `ci.yml` — verified by reading `ci.yml` in full (105 lines). Plan must explicitly add `arch:check` (or `plugins:check` directly) as a CI step. **Fix 1 below.** |
| Deferred scope explicit                 | PASS   | "Out of scope" section names 3 deferred items (plugin remove/uninstall, marketplace portal/signatures, package rename) and parallel-lane items (doc-site pages, plugin READMEs) with task numbers. None would force rework. |
| jsr-audit surface scan (pkg/plugin)     | PARTIAL | jsr-audit was triggered per skill stack. The schema asset add to publish.include is JSR-safe (precedent: `packages/cli/deno.json` already includes `assets/schema/**/*.json`), and `parsePluginManifest` round-trip is the right static audit anchor. But the plan does **not** enumerate the publishability rubric items for the additive surface (`packages/plugin/schema/scaffold.plugin.schema.json` — visible to plugin authors, becomes a referenceable URL via JSR). No slow-type risk (it's a JSON asset, not TS), but no export entry is planned either. **Fix 5 below.** |

---

## Spot-checks performed (verifying plan's load-bearing findings)

1. **zod version & `toJSONSchema()` availability**: `packages/plugin/deno.json` imports map pins `"zod": "jsr:@zod/zod@4.4.3"`. The `@zod/zod` v4 package exports `toJSONSchema()` from `zod/v4/classic/external.d.ts` (verified by import path structure). Plan's mechanism is available. ✅
2. **`.strict()` semantics on `PluginInstallerManifestSchema`**: Confirmed at `packages/plugin/src/protocol/manifest.ts:174` (`z.object({…}).strict()`). Plan's claim that the schema is `.strict()` and rejects unknown keys (including `$schema`) is correct. ✅
3. **`parsePluginManifest` does NOT strip `$schema`**: Confirmed at `packages/plugin/src/protocol/manifest.ts:243-259` — it calls `PluginInstallerManifestSchema.safeParse(json)` directly with no preprocessing. So today's `parsePluginManifest` would reject any fetched manifest that contains a `$schema` key. Plan correctly flags this as needing a fix before S2. ✅
4. **JSON text-import precedent in published packages**: Confirmed `packages/cli/src/kernel/constants/jsr-specifiers.ts:5` and `packages/cli/src/kernel/adapters/scaffold/editor-config.ts:9` use `with { type: 'json' }` imports of `deno.json` and an editor-config schema file respectively, in code that runs from the published `@netscript/cli` tarball. This makes the primary path of decision 4 (JSON text-import from a published plugin's own `deno.json`) plausible — but the plan's hedge to a `version.ts` fallback is reasonable since plugin runtime is `deno x jsr:…/scaffold` which loads via the JSR cache (slightly different from CLI's local bin runtime). ✅
5. **`release:cut` extension**: `findVersionResidue()` walks with skip regex including `.git`. `bumpVersion()` returns `{ oldVersion, newVersion, files }[]` for deno.json + deno.lock + scaffold.plugin.json. Extending to `src/scaffold/version.ts` is straightforward IF the fallback path is taken. The plan's hedge correctly defers the decision but does not pre-bind the residue-scan coverage. **Fix 3 below.**
6. **`arch:check` not in CI**: `grep -nE "arch:check"` across `.github/workflows/*.yml` returns no matches; verified `ci.yml` line-by-line (only `check`, `test`, `lint`, `fmt:check`, `check:scaffold-versions`, `publish:dry-run`, `audit:critical`, `deps:latest` are run). This is the most important fix. ⚠️
7. **`@netscript/cli` publish.include pattern**: `packages/cli/deno.json` includes `assets/schema/**/*.json` — confirms schema assets are an accepted publish-surface shape in this repo. Plan's `packages/plugin/schema/scaffold.plugin.schema.json` is consistent. ✅

---

## Open-decision sweep (evaluator-run)

**Decisions found that would force rework if deferred:**

1. **`$schema` tolerance strategy** — plan offers both "add `$schema` as optional ignored key in `PluginInstallerManifestSchema`" and "strip-before-parse at validator call sites". These have different consequences: adding to schema widens the published protocol (forces every plugin author to know about the new optional field), while strip-before-parse keeps the canonical schema clean and localizes the change to the CLI validator. Plan must pre-commit (recommendation: strip-before-parse in `jsr-plugin-validator-port.ts:90` and any other JSR fetch path; the canonical published schema stays strict). **Fix 2 below.**
2. **CI gate plumbing** — `arch:check` is not currently in `ci.yml`. Plan says "wire `plugins:check` into `arch:check` and into CI" but does not explicitly say "CI gains a step that runs `deno task arch:check`". Without that, `plugins:check` is gated only locally and not on PRs, defeating the gate's purpose (#156 explicitly asks for a CI-enforced gate). **Fix 1 below.**
3. **S5 (dead-code sweep) acceptance gate** — plan says "Drive with `deno check` + lint + an unused-export scan; remove only what is provably unreferenced (no behavior change)." But the cross-slice gate set is not bound to S5 specifically. Static "unused-export" tools cannot reliably detect dynamic imports or plugin-registry lookups, so a behavior change can slip through. S5 must include `deno task test` + the prod userland-install e2e as in-slice acceptance. **Fix 4 below.**

---

## Verdict

`FAIL_PLAN`

### Required fixes (most important first)

1. **CI gate wiring** — Add an explicit step in `.github/workflows/ci.yml` that runs `deno task arch:check` (which will now include `plugins:check`). Add to the `quality` job (or a new `arch` job). Without this, the entire `plugins:check` gate is local-only and #156's "CI-enforced" requirement is not met. Also document that `arch:check` is currently local-only and this PR promotes it to CI.
2. **`$schema` tolerance: pre-commit to strip-before-parse.** Update decision 2 to commit: "Strip `$schema` (and only `$schema`) before `PluginInstallerManifestSchema.safeParse()` in CLI validator call sites (`packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts:90` and any other JSR/HTTPS fetch path). Do NOT add `$schema` as an optional field to the canonical published schema — that widens the published protocol. Strip is localized, deterministic, and preserves `parsePluginManifest` semantics (same strict validation; `parsePluginManifest` itself is unchanged)."
3. **Version-coherence single-source: bind `release:cut` deterministically.** Update decision 4 to: "If the prod userland-install e2e (S4) proves the JSON text-import of plugin's own `deno.json` resolves at scaffold-runtime from a published JSR tarball → adopt the primary path; record that decision in `drift.md`; do NOT extend `release:cut` to a new file (deno.json import is the single source and `release:cut` already bumps it). Otherwise, adopt the fallback (`src/scaffold/version.ts`) AND extend `findVersionResidue()` + `bumpVersion()` to cover that file path. Either way, `plugins:check` (3c) stale-pin scan is the backstop. The residue-scan regex must be updated in the same S4 commit as the source-of-truth decision."
4. **Bind S5 acceptance gate explicitly.** Update the S5 slice to require, before commit: (a) `deno task check` green, (b) `deno task lint` green, (c) `deno task fmt:check --ext ts,tsx` green, (d) `deno task test` green (full repo — must catch plugin-registry regressions), (e) `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green (catches userland-install regressions from dead-code removal). Do not defer these to a later slice.
5. **jsr-audit publishability for the additive schema asset.** Document in plan § Decisions that `packages/plugin/schema/scaffold.plugin.schema.json` will be added to `packages/plugin/deno.json` publish.include, and optionally re-exported as `./schema` (`"./schema": "./schema/mod.ts"` or a barrel file) so plugin authors can reference the canonical URL form (`jsr:@netscript/plugin/schema`) for `$schema` in JSR-published userland manifests. This is consistent with the asset doctrine (`@netscript/cli` precedent at `assets/schema/**/*.json`) and avoids ad-hoc URL minting.
6. **Mandate a Zod↔JSON-Schema round-trip test in S1.** Add to S1: a `packages/plugin/src/protocol/manifest_test.ts` (or extend existing) test that (a) `parsePluginManifest` accepts the 5 committed manifests (regression guard), (b) regenerating the schema and feeding it back through `parsePluginManifest` is byte-stable for valid input, and (c) an invalid manifest with extra unknown keys fails. This addresses the "Debt / risk" entry on zod→json-schema fidelity concretely instead of deferring it.

### Notes

- Plan's slice count (5) is comfortable and well-shaped; all 6 fixes are tweaks, not redesigns.
- The version-coherence analysis is correct and concrete (`NETSCRIPT_VERSION = '0.0.1-alpha.12'` baked in workers/sagas/streams/triggers via `const`, auth via bare literals at `plugins/auth/src/scaffold/artifacts.ts:82,87`). This is a real defect that warrants the e2e gate.
- zod v4 `toJSONSchema()` fidelity is generally strong for the constructs used (`z.string`, `z.number`, `z.boolean`, `z.enum`, `z.record`, `z.array.readonly`, `.strict()`, `.literal`, `.refine`). The `.refine(isSafeExportPath)` on `exportPathSchema` will serialize as a `format`/`pattern` annotation in JSON Schema — sufficient for editor IntelliSense even though `parsePluginManifest` retains the refine check at runtime.
- The plan correctly defers marketplace portal/signatures and remove/uninstall to ISSUE-167-* backlog. No drift risk from those deferrals.

---

## Phase A reporting

- Plan evaluator ran as a separate session (per protocol).
- No scripts executed (PLAN-EVAL evaluates plans, not code, per protocol).
- `deno.lock` and source tree untouched (lock hygiene preserved).
- No implementation work begun; verdict returned to generator for plan revision.

## Remaining risks (post-fix)

- If S1 zod-fidelity test reveals zod v4 cannot faithfully emit `additionalProperties: false` at the **root** of `.strict()`, the JSON Schema will not prevent editors from accepting unknown keys. The fallback is to hand-author a thin wrapper at the schema root, but this re-introduces drift risk — flag in `drift.md` if encountered.
- If `deno x jsr:@netscript/<plugin>/scaffold` runtime cannot JSON-import the plugin's own `deno.json` from the JSR tarball, the version-coherence fallback (`src/scaffold/version.ts` + extended `release:cut`) must land in the same S4 commit. The e2e gate is the deciding signal.
