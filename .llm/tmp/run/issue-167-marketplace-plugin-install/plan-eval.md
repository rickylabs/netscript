# PLAN-EVAL — issue-167-marketplace-plugin-install

- Plan evaluator session: OpenHands PLAN-EVAL
- Run: `issue-167-marketplace-plugin-install`
- Branch: `feat/plugin-install-jsr-dx` (off `origin/main`)
- Model: `openrouter/minimax/minimax-m3` (provider: `openrouter`)
- Action run: https://github.com/rickylabs/netscript/actions/runs/28315132546
- Surface / archetype: Archetype-6 (CLI/tooling) for `packages/cli` install pipeline; Archetype-5 (plugin) for the 5 `@netscript/plugin-*` packages
- Scope overlays: service (process spawn + JSR network)

## Inputs reviewed

- `.llm/tmp/run/issue-167-marketplace-plugin-install/research.md` (155 lines, two-stream synthesis; cites Gemini deep-search in #167)
- `.llm/tmp/run/issue-167-marketplace-plugin-install/grounding-deno-native.md` (172 lines, file:line repo reuse map + verified JSR API shapes)
- `.llm/tmp/run/issue-167-marketplace-plugin-install/plan.md` (203 lines, this evaluation's target)
- `.llm/harness/gates/plan-gate.md`, `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/gates/archetype-gate-matrix.md`, `archetypes/ARCHETYPE-5-plugin.md`, `archetypes/ARCHETYPE-6-cli-tooling.md`

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | research.md + grounding-deno-native.md both populated; carry-in material (Gemini deep-search in #167) re-baselined via file:line anchors that hold (see §"Read-only repo verification") |
| Decisions locked                        | PASS              | D1–D8 in plan.md §"Locked Decisions"; each has rationale + tie to research stream + anti-pattern coverage |
| Open-decision sweep                     | PASS (with note)  | Plan's own sweep + my evaluator-run sweep both clean; one implementer-detail left to S4 (see §"Open-decision sweep (evaluator-run)") |
| Commit slices (< 30, gate + files each) | PASS              | 12 slices, ordered, each names what-it-proves + gate + indicative files; S1→S5 ordered CLI core; S6–S10 independent plugin ports; S11 depends on S5+≥1 plugin; S12 closeout |
| Risk register                           | PASS              | 7 risks with mitigations; S5/S11 explicitly owns the readers-vs-copier question with two resolutions + evidence mandate; pre/post-publish split is explicit |
| Gate set selected                       | PASS (PENDING)    | check/lint/fmt/test/arch:check/jsr-audit/publish:dry-run/scaffold.runtime/new userland install suite/e2e-cli-prod all named; F-CLI-* archetype-specific gates not enumerated by ID but covered by lint/fmt/check/test proxies (Phase A reporting rule allows this — see §"Notes") |
| Deferred scope explicit                 | PASS              | 6 items explicitly deferred (rename, standalone protocol pkg, portal, signature, uninstall, tutorial #144) with backlog rationale |
| jsr-audit surface scan (pkg/plugin)     | PASS (light)      | New plugin public surface (`./scaffold` + `./cli` for auth + versioned `scaffold.plugin.json` with schemaVersion bump) named; per-slice `jsr-audit` + `publish:dry-run` wired; only one slow-type risk named in risk register (acceptable given per-slice enforcement; see §"Notes") |

## Open-decision sweep (evaluator-run)

- **Naming alias-map evaluation point (D1)** — plan says "bare-kind→`@netscript/plugin-<kind>` alias map resolves via the resolver before JSR lookup." Today, `PluginKindRegistry.get` (at `plugin-kind-registry.ts:44`) throws "Unknown plugin kind" for unregistered kinds; `DEFAULT_PLUGIN_KIND_PROVIDERS` only seeds `api`. The alias map must be consulted *before* the registry lookup, OR the registry must be seeded from the alias map at the start of `add-plugin`. Plan implicitly assumes the former (resolver returns package → fetch → seed → run). This is implementer-resolvable in S2; not a forcing-rework risk.
- **dispatch extension shape (D4 / S4)** — plan says "extend `dispatchPluginVerb` → `scaffold` verb." Does this mean (a) a new discriminated-union member on the existing dispatch verb enum, or (b) a sibling function `dispatchScaffoldVerb` that wraps a `deno run`/`deno x` call with the permission matrix? The current `dispatchPluginVerb` reads kind and dispatches by kind-string to a registered verb (e.g. `compile`, `tasks`). Adding a `scaffold` verb as a discriminated-union member is the cleaner extension; if the implementer takes (b), the plan's "extend" claim is misleading. Resolvable in S4; recommend the implementer state the chosen shape in the slice's worklog.
- **Readers-vs-copier risk verified differently than the plan states (S5/S11)** — plan's risk register claims "the e2e readers (`runtime-gates.ts`/`database-gates.ts`/`registry-generator-fixture.ts`) currently read copied trees." My grep found no direct import of `official-plugin-copier`/`official-plugin-source`/`copyOfficialPlugin`/`findOfficialPluginSourceRoot` in `packages/cli/e2e/`. The readers likely read emitted artifact paths, not the copier's internal source-root. Risk is real but slightly overstated; S5's "verify in slice with evidence" mandate catches it either way. No change required.
- **First-party trust tier (D2)** — plan says "first-party `@netscript/*` scaffolders run trusted; third-party run under confined permission matrix + confirmation gate." Rationale: "matches today's `dispatchPluginVerb`." Did not verify today's flag set passed to `deno` from `dispatchPluginVerb` (this is an IMPL-EVAL concern, not a plan defect); the plan's stated rationale is coherent.
- **Static protocol validation (D3)** — sound. Reading `meta.json` / `_meta.json` exports / `api.jsr.io` metadata to classify a plugin as `scaffold`-shaped, *without* executing plugin code, is the right shape (VS Code `contributes` precedent). No forcing-rework risk.

## Read-only repo verification (cheap anchors)

All cited file:line anchors in the plan and grounding were spot-checked and hold:

| Anchor (claim) | Verified |
| -------------- | -------- |
| `findOfficialPluginSourceRoot` at `packages/cli/src/kernel/application/registries/plugin-kind-registry.ts:157` | ✅ (also confirmed `hasOfficialPluginSources` at :267) |
| `PluginKindProvider` interface at line 53 of plugin-kind-providers | ✅ |
| `createOfficialPluginCopier` at `packages/cli/src/maintainer/infra/official-plugin-copier.ts:12` | ✅ (imports `copyOfficialPlugin` from `sync/plugin/copy-official-plugin.ts`) |
| `add-plugin.ts` imports `PluginWorkspaceMutator`, `copyPluginSchemasToRootDb`, `PluginKindRegistry` | ✅ |
| `ScaffoldPluginManifest` / `OfficialSourceManifest` at `packages/cli/src/maintainer/adapters/official-plugin-source.ts:88-94` | ✅ |
| Official plugins at `@netscript/plugin-workers`, `@netscript/plugin-auth`, `@netscript/plugin-streams` v0.0.1-alpha.12 | ✅ (and `plugin-sagas`, `plugin-triggers` exist in the same family) |
| `auth` is the outlier (no `./cli`, no `./scaffolding` today) | ✅ (auth/deno.json has neither export; auth has no `bin/`; auth has no `src/scaffolding/`) |
| `workers` has scaffolding templates at `plugins/workers/src/scaffolding/templates` and `bin/combined.ts` | ✅ |
| Plugin generators split: kernel vs public/templates | ✅ |
| e2e gate readers exist (database-gates, runtime-gates) | ✅ |
| `create-default-runner.ts` has no plugin-install path (true-userland install gate is a real gap) | ✅ (top of file is build/runtime reporter wiring only) |

## Fitness gate coverage check

Per `archetype-gate-matrix.md`:

- **Archetype-5 (plugin)** requires F-1, F-3, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-13 (subtype for runtime), F-14, F-15. Plan covers all via the universal F-* proxies (`check`, `lint`, `fmt:check`, `test`, `arch:check`, `jsr-audit`, `publish:dry-run`). F-13 (saga/runtime invariants) is `subtype` and is implicitly covered by the per-plugin slices (each plugin's runtime declarations are touched). ✅
- **Archetype-6 (CLI/tooling)** requires the universal F-* family plus F-CLI-1 … F-CLI-30. Plan does **not** enumerate F-CLI-* by ID but covers them via the same universal proxies (F-CLI-* gates extend, not replace, the universal F-* family). Per `archetype-gate-matrix.md` §"Phase A Reporting": *"Until fitness scripts exist, evaluators report required fitness gates as PASS / PENDING_SCRIPT with manual evidence and no detected violation."* — this is the operative rule; the plan's gate set is compliant. ✅ (PENDING_SCRIPT)
- **Scope overlay: service (process spawn + JSR network)** — plan addresses via D6 confined permission matrix + `--deny-net` (prompt to grant). ✅

## Doctrine / archetype drift check

- **Plugin owns its scaffolding (doctrine "wrap, don't reinvent")** — plan explicitly makes this a locked decision (D4). The five `./scaffold` entrypoints + the versioned manifest align with Archetype-5's "plugin contributes contracts ... to the NetScript host" framing. ✅
- **Public surface owns its contributions** — new `./scaffold`/`./cli` exports + versioned `scaffold.plugin.json` are additive, versioned (`schemaVersion` bump on manifest). Backwards-compatible with alpha.12 consumers. ✅
- **Maintainer source-copy path is being demoted, not deleted** — plan says "retire checkout-walk/copier from the userland path; keep maintainer `--local-path`." This preserves `scaffold.runtime` (maintainer mode) while replacing the userland path. Doctrine-consistent. ✅
- No new doctrine violations introduced or deepened. ✅

## Verdict

`PASS`

All Plan-Gate boxes checked. Decisions are locked, slices are sized and ordered, risks are mitigated with concrete owners (S5/S11 owns the readers question; pre/post-publish split is explicit; first-party trust tier is rationale-tied to existing dispatch behavior), deferred scope is enumerated, and `jsr-audit`/`publish:dry-run` are wired into per-slice validation. No unsound assumptions; no decision deferred that would force rework.

Implementation may begin on S1 → S2 → S3 → S4 → S5 → S6–S10 (parallelizable on the daemon) → S11 → S12.

### Notes (non-blocking)

1. **S4 dispatch extension shape** — the implementer should state in S4's worklog whether `scaffold` becomes a new verb member on the existing dispatch discriminated union or a sibling function. Affects whether `dispatchPluginVerb` is the single point of plugin subprocess control or whether S4 introduces a parallel spawn path.
2. **F-CLI-* enumeration** — for clarity in IMPL-EVAL, name each F-CLI-* gate the slice touches in the slice's worklog (e.g. `F-CLI-12 confirm-prompt-structure` for S3, `F-CLI-19 dry-run-no-side-effects` for S4). Phase A reporting permits PENDING_SCRIPT; naming the gates now cuts IMPL-EVAL drift.
3. **Alias-map evaluation point (S2)** — clarify in code or worklog that the bare-kind alias map is consulted *before* `PluginKindRegistry.get` throws, OR that the registry is pre-seeded at the top of `add-plugin`. Without this, "Unsupported plugin kind" can still fire for bare names.
4. **jsr-audit surface risks for `./scaffold`** — the new plugin export is invoked via `deno x`, so it must be self-contained (no implicit cross-imports to non-exported plugin internals). The implementer should treat this as a per-slice gate when running `publish:dry-run`; flag in the slice's worklog if a plugin's scaffolder requires a sibling non-exported type.
5. **Pre-publish `--local-path` validation (S11)** — when building the userland-install suite, the runner must point at a `deno task` that uses `--local-path <plugin dir>`. The plan implies this but does not show the invocation. Resolvable in S11.

These notes are for the implementation lane (WSL Codex daemon); they do not block this verdict.

