**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**

# PLAN-EVAL cycle 5 — orchestrator-1443-plugin-ai-next-canary--supervisor

- Plan evaluator session: `019fec5f-4805-7bc1-8e58-bcb6e048646f` (resumed cycle-1–4 evaluator) / 2026-08-10
- Generator: native Claude Opus 5 session; generator != evaluator
- Run: `orchestrator-1443-plugin-ai-next-canary--supervisor`
- Evaluated head: `289c0c1b2`
- Surface / archetype: `plugins/*` / ARCHETYPE-5; `packages/cli` / ARCHETYPE-6 + F-CLI-1…31; `packages/plugin` / ARCHETYPE-4
- Scope overlays: `SCOPE-frontend` N/A for the deliberately unmounted generated route; targeted generated-namespace checks remain in scope
- Pre-flight: `rtk git log --oneline -3` returned `289c0c1b2`, `fd3476a9d`, `a6febcdc6`; `rtk git status --short --branch` returned branch `orchestrator/1443-plugin-ai-next-canary` and the pre-existing untracked `.llm/issue-1443-orchestrator-brief.md` only.

## A. Cycle-4 findings disposition

| # | Cycle-4 finding | Disposition | V6 answer and independent source verification |
| --- | --- | --- | --- |
| 1 | Research was not current for the #1445/all-six rescope. | **ANSWERED** | `research.md:180-253` adds A-1…A-5. A-1 records the real default-then-sole-named loader and empirical sibling-metadata rejection (`:185-205`); A-2 inventories all six existing package manifest exports (`:207-223`); A-3 records workers→`zod` and both import modes (`:225-239`); A-4 records the full maintainer chain (`:241-246`); A-5 covers the widened JSR surface (`:248-253`). Source confirms `loadRegisteredPluginMetadata` avoids import while `loadRegisteredPlugins` reaches `resolvePluginManifest` (`plugin-registry.ts:123-184,363-390`). |
| 2 | The service-less maintainer representation stopped before the public sync result. | **ANSWERED** | D1 now owns `sync-plugin.ts:32-52` and `official-plugin-copier.ts:11-25` (`plan.md:95-112`); S1 lists both files and maintainer-sync tests (`:345`). Current source confirms required service fields flow from `official-plugin-source.ts:12-65,93-107,219-251` through `copy-official-plugin.ts:159-181`, the copier adapter (`official-plugin-copier.ts:11-25`), and `SyncPluginCopyResult` (`sync-plugin.ts:32-52`). V6 therefore schedules every type/mapping that must change. |
| 3 | D6 confused 13 registry dependencies with final output and omitted citation-chip CSS. | **ANSWERED** | D6 locks 5 items, 11 files, 13 registry dependencies, 14 final imports including unconditional `preact`, and 3 CSS imports (`plan.md:192-214`); risk 4 and S6 repeat the same contract (`:331,350`). An evaluator `deno eval` over `resolveRegistryItems(freshUiRegistryManifest, ['markdown'])` returned `items=[cn,public-types,theme-seed,citation-chip,markdown]`, `files=11`, `registryDeps=13`, `finalImports=14`, and CSS imports for citation-chip, markdown, and KaTeX. This matches `registry.manifest.ts:451-470,633-678` and `registry-deno-json.ts:6-8,26`. |
| 4 | D7 contradicted runtime resolver semantics and lacked recoverable execution. | **ANSWERED** | D7 check 2 now requires the shared resolver, default-then-sole-named parity, subprocess isolation, a bounded timeout, and distinct timeout/non-zero/import errors (`plan.md:219-244`); S8 owns the shared resolver/composition point and parity tests (`:352`). Source confirms the runtime behavior: default returns first; otherwise exactly one named manifest resolves (`plugin-registry.ts:378-390`). A subprocess is implementable at the CLI adapter edge; the current `ProcessPort.exec`/`DenoProcess.exec` lacks cancellation (`process-port.ts:18-24`; `deno-process.ts:8-29`), so S8 must extend that existing seam or add a kill-capable edge adapter rather than use a leaking `Promise.race`. That file-level choice can be made while S8 lands without changing D7's locked result. |

## B. Checklist results — Plan v6

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **PASS** | `research.md:3-15` re-baselines #1443 against `2256a67bf`; addendum A-1…A-5 explicitly supersedes the incorrect workers comparison and re-baselines the owner-authorized #1445 scope (`research.md:180-253`). The load-bearing loader, six-package, import-mode, maintainer, and publish facts were independently confirmed above. |
| Decisions locked | **PASS** | D1–D9 state mechanisms and rationale (`plan.md:83-267`). The four cycle-4 defects are corrected: complete maintainer shape (`:95-112`), exact registry output (`:192-214`), shared runtime resolver plus recoverable subprocess (`:219-244`), and all-six data-driven generation (`:254-267`). No decision would build a different result from either issue's acceptance contract. |
| Open-decision sweep | **PASS** | `plan.md:269-281` marks the service shape, configured-module contract, identity, doctor rule, registry closure, and overlay decision resolved; route mounting is explicitly safe to defer. Evaluator sweep found no unresolved choice that would alter the requested result. The exact kill-capable process-adapter shape is an S8 implementation choice constrained by the locked bounded-timeout behavior, not an open product/architecture outcome. |
| Commit slices (<30, gate + files each) | **PASS** | Thirteen ordered slices are listed at `plan.md:337-357`; each names what it proves, a gate, and file ownership. S1 owns the full maintainer chain (`:345`), S6 owns the exact registry output (`:350`), S8 owns resolver parity and subprocess error behavior (`:352`), S9 owns the assertive consumer gate (`:353`), and S12/S13 own the six-kind canonical proof (`:356-357`). |
| Risk register | **PASS** | Eight risks and mitigations cover Aspire omission, atomic-schema compatibility, cross-plugin identity, the exact registry closure, lock hygiene, late E2E failure, atomic published-type/consumer landing, and local-source versus JSR packaging (`plan.md:324-335`). D7's in-process-import hazard is resolved in the decision itself by mandatory subprocess isolation and timeout (`:237-241`). |
| Gate set selected | **PASS** | Doctrine assigns `plugins/*` to A5, `plugin` to A4, and `cli` to A6 (`docs/architecture/doctrine/06-archetypes.md:348-380`). V6 selects applicable F-1…19, F-CLI-1…31, scoped wrappers/tests for every touched package, `quality:scan`, `arch:check`, doc lint, JSR audit, assertive consumer verification, `scaffold.runtime`, leak check, and exact-canary production E2E (`plan.md:283-304`). `SCOPE-frontend` N/A is sound because the overlay's route/browser/state gates require a mounted workflow (`SCOPE-frontend.md:20-28`), which this PR does not create. |
| Deferred scope explicit | **PASS** | `plan.md:389-395` defers only route mounting, gateway topology, R-0 node-module friction, and doctor checks beyond the three issue invariants. Neither issue requires the deferred route to be mounted; generated TSX compilation remains gated. |
| jsr-audit surface scan (pkg/plugin) | **PASS** | `plan.md:306-322` covers the published type change, CLI behavior, all six plugins, slow-type prohibition, docs, dry-run, `publish.include`, local/JSR modes, and AI's absent `./services`. `deno doc --filter PluginManifestProvider packages/plugin/mod.ts` confirms the current required published field; `jq` confirms every affected plugin includes `src/**/*.ts`, which covers planned stub sources. |

## Acceptance coverage — issue #1443

| # | Acceptance box | Owning slice(s) | Verdict and evidence |
| --- | --- | --- | --- |
| 1 | Default AI installation emits no gateway/service/AppHost resource. | S1-S3; S12/S13 | **COVERED** — atomic absence, all three synthesis sites, AI manifest truth, appsettings assertion, and full E2E are assigned (`plan.md:345-347,356-357,363`). |
| 2 | Every configured plugin path exists and exports a valid manifest. | S4, S10 | **COVERED** — AI then all six use the real loader; all six packages already export a `PluginManifest` value (`research.md:207-223`; `plan.md:348,354,364`). |
| 3 | `generate runtime-schemas` succeeds immediately after clean AI installation. | S4, S5, S10; S12/S13 | **COVERED** — module validity/identity precede the registered runtime-schema gate and full proof (`plan.md:348-349,354,356-357,365`). |
| 4 | Generated AI files pass targeted Deno check, including Markdown and Preact. | S6, S7; S12/S13 | **COVERED** — exact five-row registry contract lands before the workspace/JSX check; canonical E2E selects `ai/**` (`plan.md:350-351,356-357,366`). |
| 5 | Doctor reports missing modules and invalid executable entrypoints. | S5, S8, S9 | **COVERED** — valid identity plus missing/unresolvable module and entrypoint negatives, with recoverable execution (`plan.md:349,352-353,367`). |
| 6 | Regression tests cover absent `/services`, configured modules, and generated UI imports. | S1, S3, S4, S7, S10 | **COVERED** — each required assertion has a targeted test owner (`plan.md:345,347-348,351,354,368`). |
| 7 | Canonical `scaffold.runtime` installs AI and checks `ai/**`. | S12, S13 | **COVERED** — suite registration and the full cleanup proof are separate slices (`plan.md:356-357,369`). |

## Acceptance coverage — issue #1445

| # | Acceptance box | Owning slice(s) | Verdict and evidence |
| --- | --- | --- | --- |
| 1 | Every first-party plugin emits a configured module exporting a valid `PluginManifest`. | S4, S10 | **COVERED** — all six existing manifest values and additive barrel feasibility are inventoried (`research.md:207-223`; `plan.md:348,354,375`). |
| 2 | `generate runtime-schemas` succeeds after clean install of each first-party plugin. | S10, S11; S12/S13 | **COVERED** — contract emission and complete import surfaces precede six-kind runtime-schema E2E (`plan.md:354-357,376`). |
| 3 | Each generated plugin namespace type-checks with all imports declared. | S7, S11 | **COVERED** — AI and generalized local/JSR import-map checks are explicit (`plan.md:351,355,377`). |
| 4 | Doctor fails for a configured module that does not resolve or export a manifest. | S8 | **COVERED** — shared-resolver parity, missing/zero/multiple-named/import/timeout failure behavior, and non-zero reporting are locked (`plan.md:223-244,352,378`). |
| 5 | Regression tests assert the loader contract per first-party plugin. | S10 | **COVERED** — one six-kind table-driven test plus per-package resource tests avoids fixture-only production behavior (`plan.md:254-267,354,379`). |
| 6 | `scaffold.runtime` proves the contract for every plugin it installs. | S12, S13 | **COVERED** — both slices name the complete six-kind set (`plan.md:356-357,380`). |

## Open-decision sweep (evaluator-run)

None that would produce a wrong result or leave an acceptance box uncovered.

## Findings — implementation instructions under PASS

1. **Make the S8 timeout terminate the child.** `ProcessPort.exec` currently exposes only `cwd` and `env`, and `DenoProcess.exec` calls `Deno.Command.output()` without a signal (`process-port.ts:18-24`; `deno-process.ts:8-29`). Extend that existing edge seam with cancellation/timeout forwarding, or add a dedicated kill-capable subprocess adapter. Add the actual adapter, port, and `public-command-dependencies.ts` composition files to S8's landed file record. Do not implement the bounded timeout as `Promise.race`; returning while the child keeps running does not satisfy D7.
2. **Use five assertions in S6.** The Proves column and D6 correctly name five rows, while S6's Gate cell still says “four-row emitted-set assertion” (`plan.md:350`). The test must assert items, files, CSS imports, 13 registry dependencies, and 14 final imports.
3. **Synchronize the resumability and PR surfaces before S1 sign-off.** `context-pack.md:17-20` still says seven decisions/nine slices; `worklog.md:14-17,27-32,51` still says two doctor checks and plan v5; `phase-registry.md:6,12` still says v5/cycles 1–3; the live PR body still labels the plan v5 and its JSR validation list names only plugin/CLI/AI; no live `[PHASE: PLAN] [REVISION: v6]` comment exists. Update those artifacts to v6, thirteen slices, three doctor checks, all six JSR packages, and cycle-5 `PASS`. This is run/PR synchronization, not a defect in the implementable plan.
4. **Treat D7 as authoritative where root-cause shorthand says “exactly one.”** RC-2 line 58 and D4a lines 152-156 use abbreviated “exactly one/ambiguous” wording. The implementation and parity tests must preserve the explicit D7/runtime rule: accept a manifest-shaped default first; only without a default require a sole named manifest (`plan.md:225-235`; `plugin-registry.ts:378-390`).

## Verdict

`PASS`

VERDICT: PASS
