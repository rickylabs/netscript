# PLAN-EVAL cycle 2 — `plugin-167-harden--impl`

- Run id: `plugin-167-harden--impl`
- Branch: `chore/plugin-167-harden` @ `4d601e6a` (up to date with origin)
- Plan revision hash: `4d601e6a` — "docs(plugin-167-harden): PLAN-EVAL cycle-2 plan revision (6 fixes)"
- Verdict: **PASS** (implementation may begin)
- Cycle-1 → cycle-2: 6 fixes claimed, 5 fully RESOLVED + 1 RESOLVED under cycle-1 scope (with a non-blocking watcher note).

## Cycle-1 fix map — verification

| # | Cycle-1 fix | Plan location | Verdict | Reason |
| - | ----------- | ------------- | ------- | ------ |
| 1 | CI gate wiring | Decision 3 + S3 acceptance; `plugins:check` into `arch:check` + explicit `arch:check` step in `.github/workflows/ci.yml` `quality` job | RESOLVED | Verified `.github/workflows/ci.yml:58-98` `quality` job lacks `arch:check` (only `check`/`lint`/`fmt:check`/`check:scaffold-versions`/`publish:dry-run`/`audit:critical`); plan's S3 commits to adding the `arch:check` step; Decision 3 explicitly notes this promotion from local-only to CI-enforced is load-bearing. |
| 2 | `$schema` tolerance | Decision 2 — strip-before-parse at CLI validator call sites (`fetch-jsr-plugin-validator.ts` ~L90 + "any other path that feeds a fetched manifest"), canonical `PluginInstallerManifestSchema` stays `.strict()` | RESOLVED (scope) | Plan says canonical schema stays `.strict()` (NOT widened — confirmed in Decision 2); strip is committed at the JSR-fetch call site explicitly; the "any other path" phrasing is broad enough to cover the only other network-fetched parse site. **Watcher note (non-blocking, out of cycle-1 scope):** `packages/cli/src/public/features/plugins/add/add-plugin.ts:237` is a third `parsePluginManifest` call site, but it reads a local user-supplied `scaffold.plugin.json` from disk — not a "fetched" manifest in the JSR-fetch sense cycle-1 called out. The local-path site will eventually carry `$schema` once S2 lands; either S1 strips at the parse boundary inside `parsePluginManifest` itself, or S2/S5 follow-up strips at `add-plugin.ts:237`. No plan rework required; implementer decides. |
| 3 | Version-coherence binding | Decision 4 — S4 e2e (`scaffold.runtime`) is the deciding signal; primary path (json text-import) leaves `release:cut` untouched; fallback extends `findVersionResidue()`+`bumpVersion()` in the **same S4 commit**; path recorded in `drift.md` | RESOLVED | Verified `.llm/tools/release/cut.ts:51` `findVersionResidue()` scans only `.json` files today — fallback is a concrete delta. Plan binds the e2e outcome to the path selection deterministically and requires the residue-scan extension to land in the same S4 commit (no deferred scope). `drift.md` is the receipt. |
| 4 | S5 acceptance gate | S5 acceptance tail (cycle-2 line 161): bound to `check` + `lint` + scoped fmt + full `test` + `scaffold.runtime` e2e, in-slice, nothing deferred | RESOLVED | Plan text is explicit: "check + lint + scoped fmt + full test + scaffold.runtime e2e, in-slice." Adequate to catch dynamic plugin-registry regressions because the e2e exercises the full scaffold-runtime path that produced the original version-coherence defect. |
| 5 | jsr-audit schema asset | Decision 5 — add `packages/plugin/schema/scaffold.plugin.schema.json` to `packages/plugin/deno.json` `publish.include` + re-export as `./schema` | RESOLVED | `jsr-audit` skill confirms JSON export from `deno.json` is valid (no slow-type risk for JSON assets). The asset-doctrine precedent cited (`@netscript/cli` ships `assets/schema/**/*.json`) and existing JSON-export pattern in `@netscript/config` (`./schema/plugins` barrel) align. URL form `jsr:@netscript/plugin/schema` is well-defined by JSR's export→URL mapping. Plan offers two paths (raw JSON export vs thin `./schema/mod.ts` barrel) — implementer picks at S1 time; both are publishable. |
| 6 | S1 round-trip test | Decision 6 — extend `packages/plugin/src/protocol/manifest_test.ts` with: (a) parse accepts all 5 committed manifests, (b) schema regen byte-stable, (c) extra-keys fails, (d) `$schema`-only manifest passes the strip path | RESOLVED | `packages/plugin/tests/protocol/plugin-manifest_test.ts` exists and already covers (a) and the strict-rejection class; plan explicitly enumerates the four cases including the byte-stability assertion and the strip-passes path. Naming the location (`manifest_test.ts`) plus enumerating the four assertions discharges the zod→json-schema fidelity risk at the planning level; the implementation writes the test, the test runs. Cycle-2 added an explicit fallback clause (hand-wrap root `additionalProperties:false` if zod v4 lacks it) — no deferred scope. |

## Plan-Gate checklist walkthrough

Per `.llm/harness/gates/plan-gate.md`:

- [x] **Research present and current.** `research.md` exists at `.llm/tmp/run/plugin-167-harden--impl/research.md`; plan's "Research summary" section re-baselines against `main @ 35f7dbd3` and lists load-bearing ground-truth findings (zod v4 pinned, 5 committed manifests, no `$schema` today, `.strict()` would reject, `arch:check` not in CI, `findVersionResidue()` only scans `.json`). Spot-checks confirmed: `packages/plugin/src/protocol/manifest.ts` exports `parsePluginManifest` + `PluginInstallerManifestSchema`; `packages/plugin/deno.json` pins zod v4; `.github/workflows/ci.yml` lacks `arch:check`.
- [x] **Decisions locked.** Six decisions, each with rationale and (where relevant) a fallback contingency. Decision 4 is the load-bearing one — its e2e-determined branching is bound, not hedged. No "TBD" or "decide later" language.
- [x] **Open-decision sweep.** No decisions deferred. Decision 4's two branches both resolve in the same S4 commit with the path recorded in `drift.md`. Decision 6 carries an explicit "if zod v4 cannot emit root `additionalProperties:false`, hand-wrap only the schema root, no contract change" contingency — also in-slice.
- [x] **Commit slices.** 5 slices (S1–S5), each < 30 commits worth of work, each names its proving gate and files. Order is dependency-correct (S1 schema+strip+test, S2 wire `$schema`, S3 gate+CI, S4 version-coherence, S5 dead-code).
- [x] **Risk register.** Risks embedded inline in Decisions 3, 4, 6 and in the "Debt / risk" section (zod v4 fidelity, json-import tarball-resolvability, e2e flake). Mitigations tied to specific slices/tests. No separate `## Risk register` heading, but the plan-gate item is satisfied by inline documentation.
- [x] **Gate set selected.** Gates section names: `check`, `lint`, scoped `fmt`, `arch:check`, `plugins:check`, `test`, prod userland-install e2e `scaffold.runtime`. Per-slice acceptance is explicit. Publish surface audit included via `publish:dry-run`.
- [x] **Deferred scope explicit.** "Out of scope" section lists plugin remove/uninstall, marketplace portal/signatures, package rename, doc-site pages, plugin READMEs.
- [x] **jsr-audit.** Plugin wave, so required. Decision 5 is the surface scan: additive `./schema` JSON asset, no slow-type risk (JSON), URL form well-defined, consistent with existing `@netscript/cli` `assets/schema` precedent and `@netscript/config` schema-export pattern. No other publish-surface deltas.

## Verdict

**PASS_PLAN.** Implementation may begin.

### Watcher notes for IMPL-EVAL (non-blocking, not required-fix)

1. Decision 2's strip is at the call-site boundary. The local-path parse in `packages/cli/src/public/features/plugins/add/add-plugin.ts:237` is a third `parsePluginManifest` call site. Cycle-1 fix #2 explicitly scoped to "JSR fetch paths," so this is technically outside that scope — but S2 will add `$schema` to the committed manifests, which means add-plugin will start receiving `$schema`-bearing JSON. Either (a) push the strip down into `parsePluginManifest` (changes Decision 2's "parsePluginManifest itself stays unchanged" clause), or (b) apply the strip at `add-plugin.ts:237` as well, or (c) document the gap and defer to a follow-up. Recommend (b) — smallest delta, preserves Decision 2's clause.
2. The `./schema` export shape — raw JSON file vs thin `./schema/mod.ts` barrel — is intentionally left to S1 implementation per Decision 5 ("a thin `./schema/mod.ts` barrel if a TS surface is preferred"). Both are publishable; this is a JSR-publish dry-run verification item, not a plan-level concern.
3. Plan-gate item "Risk register" is satisfied via inline documentation in Decisions 3/4/6 + "Debt / risk" section rather than a separate heading. Strict reading of plan-gate.md says "Risks listed with mitigations" — this is met. If a future cycle wants a separate `## Risk register` heading for clearer audit, that's an optional nit.

## Spot-check evidence

- `.github/workflows/ci.yml` `quality` job (L58-98) — confirmed no `arch:check` step. `grep` for `arch:check\|plugins:check` returns zero hits in `.github/workflows/`.
- `deno.json` — `arch:check` task exists (L89) but `plugins:check` does not. Plan adds `plugins:check` and wires it into `arch:check`.
- `packages/plugin/deno.json` exports — no `./scaffold/version` entry today (Decision 4 fallback adds it; primary json-import path does not need it).
- `.llm/tools/release/cut.ts:51` — `findVersionResidue()` scans `.json` only. Decision 4 fallback extends to `.ts` for `src/scaffold/version.ts`.
- `packages/cli/src/public/features/plugins/add/add-plugin.ts:236-237` — local-path parse call site, feeds raw JSON (with future `$schema` post-S2) into `parsePluginManifest`. Watcher note #1 above.
- `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts:97` — JSR-fetch parse call site, covered by Decision 2's explicit strip.
- `packages/plugin/src/protocol/manifest.ts` — `PluginInstallerManifestSchema` is `.strict()` (Decision 2 keeps it strict, NOT widened).
- `packages/plugin/tests/protocol/plugin-manifest_test.ts` — exists, 114 lines, covers (a) accepts all 5 manifests + (d) strict rejection. Plan's Decision 6 commits to adding (b) byte-stability and (d) `$schema`-strip-passes cases.

## Files touched by this evaluation

- Created: `.llm/tmp/run/plugin-167-harden--impl/eval-cycle2.md` (this file)
- No source edits. Branch unchanged at `4d601e6a`. Lock hygiene preserved.