# Worklog: typed plugin CLI contribution RFC

## Run Metadata

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`       |
| Branch         | `docs/rfc-plugin-cli-contribution`             |
| Archetype      | 4 — public DSL/builder (future implementation) |
| Scope overlays | `SCOPE-docs`                                   |

## Design

This checkpoint was locked before RFC authoring and cleared by cycle-2 PLAN-EVAL `PASS`. It does not
authorize package implementation.

### Public Surface

- `@netscript/plugin/cli` — compositional definition/builder, immutable descriptor/result/error,
  handler/generator pointers, and capability vocabulary.
- `PluginContributions.cli` plus installer `PluginCliManifestPointer` — matching static references,
  not duplicated payloads.
- `@netscript/cli` — private generated-registry/Cliffy/bootstrap/generation/doctor adapters; no new
  public host internals.
- Draft document path: `rfcs/0000-plugin-cli-contribution.md`.

### Domain Vocabulary

- `PluginCliContributionDefinition` — one plugin, family/major, one host-declared mount, nested
  static command definitions.
- `PluginCliCommandDefinition` — path, arguments/options, help/examples/aliases/output modes,
  capabilities, stable ID, and lazy handler/generator references.
- `PluginCliHandlerRef` — safe package-relative module/export pointer imported only after route
  selection and capability approval.
- `PluginCliGenerationPlan` — deterministic workspace-relative create/modify/delete/skip plan with
  diagnostics, never a raw filesystem operation.
- `PluginCliFailure` — serializable stable code/details/cause-classification boundary; host renders
  and redacts.
- `PluginCliInvocationResult` — new discriminated success/failure boundary. The incompatible live
  `PluginCliResult` export retains its legacy meaning until an explicit major-version removal.
- `PluginCliCapabilityGrant` — intersection of static request and host policy, checked before
  bootstrap or planning.
- `PluginCliManifestPointer` — parse-only installer/runtime pointer cross-checked by generation and
  doctor.

### Ports

- `PluginCliInvocationContext` — cancellation/deadline, output mode, read-only project metadata, and
  explicitly granted operations.
- `PluginCliGenerationPlanner` — returns a plan; no raw filesystem/process/Cliffy access.
- Host-internal registry/bootstrap/mutation ports remain in `@netscript/cli`; their exact names are
  not public RFC surface.

### Constants

- `PLUGIN_CLI_CONTRACT_FAMILY` — `'plugin-cli'`.
- `PLUGIN_CLI_CONTRACT_MAJOR` — `1`.
- Finite mount/route/argument/capability/error/output/plan-operation values are exported as literal
  tuples with derived unions; no parallel handwritten union.

### Commit Slices

| #   | Slice                                                                           | Gate                                                                             | Files                |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| S0  | Bootstrap/research/plan/design and evaluator placeholders                       | structured scoped fmt; durable docs accuracy; docs links; raw scope/lock checks  | run directory only   |
| S0R | Cycle-1 plan repair, contract resolution, JSR audit, and proving-gate evidence  | all six contracted gates plus JSR JSON/specifier/asset/import-meta evidence      | run directory only   |
| S1  | RFC public contract and ownership                                               | docs format/accuracy/terminology/links; structured check; live API/help sampling | RFC + run artifacts  |
| S2  | RFC lifecycle, security, and generation transaction                             | docs gates; focused structured test; `arch-check`; decision completeness         | RFC + run artifacts  |
| S3  | RFC compatibility, migration, duplicate audit, and implementation epic proposal | docs gates; publish dry-run/JSR; issue/RFC audit                                 | RFC + run artifacts  |
| S4  | Final six-gate reconciliation and IMPL-EVAL handoff                             | six final-head receipts; raw Git/lock/review-thread checks                       | run/PR metadata only |

### Deferred Scope

- Product implementation — later epic after RFC acceptance.
- Dynamic completion providers — v1 completion is descriptor-only.
- Arbitrary plugin-created top-level CLI mounts — v1 uses host-declared extensible mounts.
- Exact exit numbers, size/time default limits, help visibility copy — FCP/product policy within
  fixed contracts.
- Issue/epic filing, milestone changes, #904–#908/#1474/#1477 amendments — maintainer action after
  the RFC's duplicate audit is accepted.
- Package/plugin source changes, publication, global E2E, merge/readiness — outside this leaf.

PR #1651 correctly retains `Closes #1502`: this leaf completes the dispatched RFC tracking issue.
The proposed later implementation epic is separate, is not #1502, and is not filed or scheduled in
this leaf.

### Contributor Path

After the later epic lands, a plugin author will:

1. export an immutable CLI definition from a declared package subpath;
2. attach its pointer with the plugin builder and matching installer manifest block;
3. define nested children only under a host-declared extensible mount;
4. declare handler/generator capabilities and return typed results/plans;
5. run the shared plugin CLI conformance/testing kit and `plugin doctor`;
6. let install/update/remove/sync generate and transactionally replace the registry.

No author imports `@netscript/cli` internals, Cliffy, deploy, DevTools, or another plugin.

## Progress Log

| Time                  | Slice  | Step      | Notes                                                                                                                                    |
| --------------------- | ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 21:45 CEST | S0     | activate  | Read all nine selected skills completely; activated harness/docs A4 workflow.                                                            |
| 2026-08-13 21:55 CEST | S0     | reconcile | Fetched live `origin/main`; clean exact base, no upstream; #1502 open/zero comments; no existing PR.                                     |
| 2026-08-13 22:05 CEST | S0     | research  | Read required harness/archetype/doctrine/RFC sources and live CLI/plugin public surfaces with `deno doc` before focused source.          |
| 2026-08-13 22:20 CEST | S0     | consumers | Fetched #904–#908/comments and adjacent #424/#946/#1477; searched for duplicate general proposals.                                       |
| 2026-08-13 22:25 CEST | S0     | JSR audit | Measured plugin/CLI export-map doc lint and recorded public-surface, slow-type, export, and asset risks.                                 |
| 2026-08-13 22:30 CEST | S0     | design    | Locked ownership, lifecycle, security, compatibility, epic shape, and no-global-expensive-gate contract.                                 |
| 2026-08-13 22:34 CEST | S0     | gates     | Scoped structured Markdown format, durable docs accuracy, and internal-link checks passed; no code/global expensive gate run.            |
| 2026-08-13 22:48 CEST | S0R    | eval-read | Preserved evaluator-only commit `d71b78c3`; read all 145 lines of cycle-1 `FAIL_PLAN` before repair.                                     |
| 2026-08-13 22:55 CEST | S0R    | contract  | Read coordinator key `rfc-plugin-cli-contribution`; recorded authoritative RFC-only mutation resolution as significant drift.            |
| 2026-08-13 22:59 CEST | S0R    | JSR audit | Measured CLI/plugin exports, docs, exact internal pins, isolated-declaration posture, publish assets, and `import.meta` preflight.       |
| 2026-08-13 23:00 CEST | S0R    | gates     | Structured check and focused tests, per-member publish dry-runs, and root architecture gate passed at evaluator head.                    |
| 2026-08-13 23:08 CEST | S0R    | docs      | Structured run Markdown, docs-source-format, docs-accuracy, links, and live-glossary terminology review passed.                          |
| 2026-08-15 01:20 CEST | S1     | eval-read | Read all 246 lines of cycle-2 `PASS`; evaluator-only head `3e0c8858b4a2552926d2965b62cbcc97a15c2935`.                                    |
| 2026-08-15 01:25 CEST | S1     | reconcile | Clean local/remote evaluator head, no upstream; main advanced one non-overlapping tooling commit, recorded as minor drift.               |
| 2026-08-15 01:32 CEST | S1     | contract  | Authored ownership, immutable descriptors/builder, nested router/collisions/order, static help/completion, and result/error contract.    |
| 2026-08-15 01:35 CEST | S1     | notes     | Closed N-1 durable citation, N-2 Opus route, N-3 published symbol collision; retained N-4 for mandatory S4 final-head rerun.             |
| 2026-08-15 01:37 CEST | S1     | gates     | Structured check, docs format/accuracy, owned Markdown, links, terminology, and live API/help sampling passed.                           |
| 2026-08-15 01:48 CEST | S1-fix | review    | Read full Tier-A `CHANGES_REQUESTED` at topic commit `b774998f0`; F1–F3 are bounded S1 contract defects.                                 |
| 2026-08-15 01:49 CEST | S1-fix | contract  | Declared diagnostic tuple/union, made deep readonly type/runtime guarantees explicit, and made handler path validation normative.        |
| 2026-08-15 01:51 CEST | S1-fix | gates     | Docs source format/accuracy, structured owned Markdown format, and internal links passed; no code or expensive gate ran.                 |
| 2026-08-15 01:58 CEST | S2     | release   | Reconciled Tier-A S1 PASS at `bd8b29bf3`; accepted F1–F3 and parent-head evidence convention; S2 released, S3 withheld.                  |
| 2026-08-15 02:00 CEST | S2     | inspect   | Verified live `generate plugins --dry-run` and `plugin doctor` flags/help plus current manifest and published CLI contribution shapes.   |
| 2026-08-15 02:06 CEST | S2     | contract  | Authored explicit registry freshness, selected bootstrap, capabilities, isolation, transaction, doctor, and pointer ownership.           |
| 2026-08-15 02:08 CEST | S2     | gates     | Focused structured tests, architecture, docs format/accuracy/links, owned Markdown, terminology, and decision sweep passed.              |
| 2026-08-15 02:24 CEST | S3     | release   | Reconciled Tier-A S2 PASS at `7a5eb580a`; all six S2 sections and parent-head evidence accepted; S3 released, S4 withheld.               |
| 2026-08-15 02:27 CEST | S3     | research  | Refreshed accepted RFC laws, #904–#908 and adjacent issue ownership, JSR baseline, and exact host-side plugin coupling occurrences.      |
| 2026-08-15 02:30 CEST | S3     | contract  | Authored compatibility, deploy supersession, coupling/duplicate audits, JSR obligations, and the unfiled PR-sized implementation epic.   |
| 2026-08-15 02:36 CEST | S3     | gates     | Docs format/accuracy/links, per-member publish dry-runs, JSR audits, and the repository coupling scan completed with baseline labels.    |
| 2026-08-15 02:47 CEST | S4     | release   | Reconciled Tier-A S3 PASS at `171e4e62e`; no findings, no issue filing, S4 evidence-only scope released, S4 evaluator dispatch withheld. |
| 2026-08-15 02:50 CEST | S4     | reconcile | Local/remote/PR heads match on a clean no-upstream branch; PR remains draft with sole `status:impl`; refreshed live `origin/main`.       |
| 2026-08-15 03:03 CEST | S4     | content   | Committed all remaining journal/handoff content at `120859d5c`; the tree was clean before any final proving gate ran.                    |
| 2026-08-15 03:12 CEST | S4     | gates     | All six contracted gates passed durably with both recorded heads equal to content head `120859d5c` and no mismatch override.             |
| 2026-08-15 03:18 CEST | S4     | audit     | Final JSR, export-map doc-lint, exact-pin, asset, import-meta, scanner, formatting, link, scope, and lock checks reconciled.             |
| 2026-08-15 03:08 CEST | S4-F1  | evidence  | Chose remedy (b); recorded the exact six-file evaluator command and reproduced `SUFFICIENT` without changing any receipt.                |

## Decisions

| Decision                                                                | Reason                                                                                                                         | Source                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Existing `@netscript/plugin/cli` owns the public DSL.                   | It is already published; new package would duplicate ownership.                                                                | `deno.json`, doctrine, `plan.md` D1.       |
| Host-declared extensible mount, nested children only.                   | Deploy needs `deploy` children; arbitrary top-level capture is unsafe.                                                         | #904/#908, doctrine, D3.                   |
| Static help/completion; selected-handler lazy bootstrap.                | Startup, determinism, and isolation.                                                                                           | #905, RFC 0001/frontend law, D6–D8.        |
| Host-neutral mutation plan, host-owned transaction.                     | Preview/no-write, path containment, rollback, and one-generator/two-callers.                                                   | current scaffolder gap, RFC 0005, D11–D13. |
| Installer/runtime pointers cross-check; `.passthrough()` prerequisite.  | Current `.strict()` rejects future top-level blocks; payload duplication drifts.                                               | live schema, RFC 0005 F-3, D14–D15.        |
| No evaluator dispatch.                                                  | User requires separate-session handoff only.                                                                                   | brief, supervisor identity.                |
| Contract surfaces are inspection-only; all six gates still bind.        | Authoritative cycle-1 dispatch resolves FP-3 without waiving FP-1/FP-2 evidence.                                               | contract key, `drift.md`, D22.             |
| `Closes #1502` stays; future implementation is separate and unfiled.    | #1502 is completed by this RFC leaf, not used as the proposed implementation epic.                                             | cycle-1 dispatch, D23.                     |
| Live `PluginCliResult` is not redefined.                                | It is already JSR-published with an incompatible shape; v1 uses `PluginCliInvocationResult`.                                   | cycle-2 N-3; `deno doc`; RFC S1.           |
| Plugin executable code runs in a terminable denied-permission boundary. | Dynamic import has no `AbortSignal`; a promise race alone cannot stop module evaluation.                                       | doctrine A13; D8; RFC S2.                  |
| Generator commands can request only `workspace:read`.                   | Preview stays effect-free and workspace mutation remains entirely host-owned.                                                  | D11–D13; RFC S2.                           |
| Installer pointer is discovery authority; runtime pointer cross-checks. | Static audit needs both phases without duplicating descriptors or treating either as registry.                                 | D14–D15; RFC S2.                           |
| Capability grants use S2-N1 resolution (a).                             | A denied grant is visible only in redacted host diagnostics; successful plugin contexts retain the same stable decision shape. | Tier-A S2-N1; RFC S2/S3.                   |
| Contract major 1 generation is UTF-8 text only.                         | The existing plan type is honest and previewable; binary output needs a separately bounded future operation.                   | Tier-A S2-N2; RFC Drawbacks.               |
| Amend or fold existing issues before proposing a new child.             | #904–#908, #1093, and #1473–#1477 already own substantial implementation scope.                                                | live S3 issue audit; RFC roadmap.          |
| The implementation epic is proposed but not filed.                      | This leaf closes only the RFC tracking issue; an epic never carries a closing keyword and later filers own lifecycle metadata. | `netscript-pr`; RFC roadmap.               |

## Drift

| Drift                                                                                     | Severity    | Logged in drift.md |
| ----------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Canonical docs route differs from attached Codex author.                                  | minor       | yes                |
| Accepted consumer RFC seams are not shipped.                                              | significant | yes                |
| Existing `./cli` is a shallow/inheritance surface, not the proposed seam.                 | significant | yes                |
| Existing plugin public doc-lint baseline includes a `./cli` private type.                 | significant | yes                |
| Coordinator contract shape conflicts with the authoritative RFC-only mutation boundary.   | significant | yes                |
| `SCOPE-docs` points to a retired glossary path; live glossary is `docs/site/glossary.md`. | minor       | yes                |
| #1474's live body lags accepted RFC 0005's ratified `.passthrough()` decision.            | significant | yes                |
| `quality:scan:repo` misses direct plugin factory imports/registrations.                   | significant | yes                |
| Live main advanced inside the inspected hardcoded `plugin auth` command surface.          | minor       | yes                |

## Gate Results

### Static Gates

| Gate                                             | Command or check                                                                             | Result             | Notes                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| Live public-surface inspection                   | `deno doc packages/cli/mod.ts`; `deno doc packages/plugin/mod.ts`; focused `deno doc`/source | PASS               | Research only; exact exports and commands inventoried.                                               |
| JSR doc-lint baseline (`@netscript/plugin`)      | structured full export-map runner                                                            | BASELINE_FAIL      | 15 private-type refs package-wide; one on `./cli`; `receipts/doc-lint-plugin-cycle1.json`.           |
| JSR doc-lint baseline (`@netscript/cli`)         | structured full export-map runner                                                            | PASS               | 0 diagnostics across three entrypoints; `receipts/doc-lint-cli-cycle1.json`.                         |
| Initial S0 scoped Markdown format                | `run-deno-fmt.ts --root <run-dir> --ext md --output ...`                                     | PASS               | 8 files, 1 batch, 0 findings; `receipts/source-format.json`.                                         |
| Initial S0 durable docs accuracy                 | `run-gate.ts --gate docs-accuracy --id ...-s0-accuracy`                                      | PASS               | Exit 0; `receipts/docs-accuracy.json`; pre-existing peer warning only.                               |
| Cycle-1 scoped Markdown format                   | structured `run-deno-fmt.ts` report                                                          | PASS               | 8 files, 1 batch, 0 findings; `receipts/source-format-cycle1.json`.                                  |
| Contracted docs source format                    | durable `docs-source-format` gate from `docs/site`                                           | PASS               | `Docs source format: OK`; `receipts/docs-source-format-cycle1.json`.                                 |
| Contracted docs accuracy                         | durable root `docs-accuracy` gate                                                            | PASS               | Current command/export corpus green; `receipts/docs-accuracy-cycle1.json`; existing peer warning.    |
| Internal docs links                              | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors, 0 orphans.                                                         |
| Docs terminology (live glossary)                 | focused comparison with `docs/site/glossary.md`                                              | PASS_PLAN          | Existing capability/contribution/manifest/plugin/registry meanings preserved; final RFC reruns.      |
| Contracted structured check                      | durable `check` gate with CLI/plugin include                                                 | PASS               | 1,033 files, 9 batches, 0 failed; `receipts/check-cli-plugin-cycle1.json`.                           |
| Contracted structured test                       | durable focused `test` gate over 16 CLI/plugin files                                         | PASS               | 88 passed, 0 failed; `receipts/test-cli-plugin-cycle1.json`.                                         |
| Contracted publish dry-run (`@netscript/cli`)    | canonical per-member wrapper through durable gate                                            | PASS               | Static dry-run only; `receipts/publish-dry-run-cli-cycle1.json`.                                     |
| Contracted publish dry-run (`@netscript/plugin`) | canonical per-member wrapper through durable gate                                            | PASS               | Static dry-run only; `receipts/publish-dry-run-plugin-cycle1.json`.                                  |
| Contracted architecture check                    | durable root `arch-check` gate                                                               | PASS               | 0 failures; existing warnings retained in receipt; `receipts/arch-check-cycle1.json`.                |
| Exact internal `@netscript/*` pins               | durable `netscript-jsr-specifiers` gate                                                      | PASS               | 2,360 scanned, 1 documented allowance, 0 ranges/failures.                                            |
| Publish-asset freshness                          | durable `publish-assets` gate                                                                | PASS               | Generated publish assets current; `receipts/publish-assets-cycle1.json`.                             |
| Runtime asset / `import.meta` preflight          | `deno task release:preflight`                                                                | PASS               | 0 text-import, import-attribute, file-URL, and self-import findings; JSON audit receipt retained.    |
| JSR package audit (`@netscript/cli`)             | `audit-jsr-package.ts --root packages/cli --out ...`                                         | PASS_WITH_WARNINGS | Dry-run succeeds; existing helper/cardinality warnings and parser banner recorded.                   |
| JSR package audit (`@netscript/plugin`)          | `audit-jsr-package.ts --root packages/plugin --out ...`                                      | BASELINE_FAIL      | Dry-run succeeds; four existing missing `@module` tags make audit exit 1.                            |
| S1 structured check                              | durable `check` gate with CLI/plugin include                                                 | PASS_PARENT_HEAD   | Receipt attests parent `3e0c8858b`, not S1 head `86d0110a5`; S4 final-head rerun binds.              |
| S1 docs source format                            | durable `docs-source-format` gate                                                            | PASS_PARENT_HEAD   | Receipt attests parent `3e0c8858b`, not S1 head `86d0110a5`; `receipts/docs-source-format-s1.json`.  |
| S1 docs accuracy                                 | durable `docs-accuracy` gate                                                                 | PASS_PARENT_HEAD   | Receipt attests parent `3e0c8858b`, not S1 head `86d0110a5`; `receipts/docs-accuracy-s1.json`.       |
| S1 owned Markdown format                         | structured `run-deno-fmt.ts` wrapper report                                                  | PASS               | 10 files, 0 findings; not a durable receipt and carries no outcome, exit code, or Git head.          |
| S1 owned Markdown format write                   | structured `run-deno-fmt.ts --write` wrapper report                                          | PASS               | `source-format-s1-write.json`; not a durable receipt and is excluded from the S4 receipt set.        |
| S1 docs links                                    | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors/orphans.                                                            |
| S1 terminology                                   | comparison with `docs/site/glossary.md`                                                      | PASS               | Capability, contribution, manifest, plugin, and registry retain glossary meanings.                   |
| S1 live surface/help sampling                    | `deno doc --filter` plus `netscript-dev --help`                                              | PASS               | Confirms legacy result/command shapes and current top-level tree.                                    |
| S1 fix-up docs source format                     | durable `docs-source-format` gate                                                            | PASS_PARENT_HEAD   | Attests `86d0110a5`, not the fix-up commit; `receipts/docs-source-format-s1-fixup.json`.             |
| S1 fix-up docs accuracy                          | durable `docs-accuracy` gate                                                                 | PASS_PARENT_HEAD   | Attests `86d0110a5`, not the fix-up commit; `receipts/docs-accuracy-s1-fixup.json`.                  |
| S1 fix-up owned Markdown format                  | structured `run-deno-fmt.ts` wrapper report                                                  | PASS               | 10 files, 0 findings; not a durable receipt and has no outcome, exit code, or Git head.              |
| S1 fix-up owned Markdown format write            | structured `run-deno-fmt.ts --write` wrapper report                                          | PASS               | Kept as wrapper output; excluded from the durable receipt set.                                       |
| S1 fix-up docs links                             | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors/orphans.                                                            |
| S2 focused CLI/plugin test                       | durable structured test over the approved 16 files                                           | PASS_PARENT_HEAD   | 88 passed, 0 failed; attests parent `bd8b29bf3`; `receipts/test-cli-plugin-s2.json`.                 |
| S2 architecture check                            | durable root `arch-check` gate                                                               | PASS_PARENT_HEAD   | 0 failures; existing warnings retained; attests `bd8b29bf3`; `receipts/arch-check-s2.json`.          |
| S2 docs source format                            | durable `docs-source-format` gate                                                            | PASS_PARENT_HEAD   | `Docs source format: OK`; attests `bd8b29bf3`; `receipts/docs-source-format-s2.json`.                |
| S2 docs accuracy                                 | durable root `docs-accuracy` gate                                                            | PASS_PARENT_HEAD   | 91/91; pre-existing peer warning only; attests `bd8b29bf3`; `receipts/docs-accuracy-s2.json`.        |
| S2 owned Markdown format                         | structured `run-deno-fmt.ts` wrapper report                                                  | PASS               | 10 files, 0 findings; no outcome, exit code, or Git head; not a durable receipt.                     |
| S2 owned Markdown format write                   | structured `run-deno-fmt.ts --write` wrapper report                                          | PASS               | Kept as wrapper output; excluded from the durable receipt set.                                       |
| S2 docs links                                    | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors/orphans.                                                            |
| S2 terminology                                   | comparison with `docs/site/glossary.md`                                                      | PASS               | Permission-token meaning is explicitly distinguished from product-area capability vocabulary.        |
| S2 live surface/help sampling                    | `deno doc --filter` plus focused `netscript-dev generate/plugin --help`                      | PASS               | Registry and doctor flags plus current manifest/runtime ownership are accurately described.          |
| S2 decision completeness                         | focused normative-section and vocabulary sweep                                               | PASS               | All six dispatched S2 sections are normative; compatibility/migration/roadmap remain explicit S3.    |
| S3 hardcoded-host scanner                        | durable `quality-scan-repo` gate                                                             | PASS_PARENT_HEAD   | Zero scanner findings and 7 allowances at `7a5eb580a`; manual audit found a rule-shape blind spot.   |
| S3 docs source format                            | durable `docs-source-format` gate                                                            | PASS_PARENT_HEAD   | `Docs source format: OK`; attests `7a5eb580a`; `receipts/docs-source-format-s3.json`.                |
| S3 docs accuracy                                 | durable root `docs-accuracy` gate                                                            | PASS_PARENT_HEAD   | 91/91; existing peer warning only; attests `7a5eb580a`; `receipts/docs-accuracy-s3.json`.            |
| S3 publish dry-run (`@netscript/cli`)            | canonical per-member wrapper through durable gate                                            | PASS_PARENT_HEAD   | Static simulation passed at `7a5eb580a`; `receipts/publish-dry-run-cli-s3.json`.                     |
| S3 publish dry-run (`@netscript/plugin`)         | canonical per-member wrapper through durable gate                                            | PASS_PARENT_HEAD   | Static simulation passed at `7a5eb580a`; `receipts/publish-dry-run-plugin-s3.json`.                  |
| S3 JSR package audit (`@netscript/cli`)          | structured `audit-jsr-package.ts` report                                                     | PASS_WITH_WARNINGS | Three exports; dry-run passes; 19 existing helper/cardinality/parser-banner warnings.                |
| S3 JSR package audit (`@netscript/plugin`)       | structured `audit-jsr-package.ts` report                                                     | BASELINE_FAIL      | Thirteen exports; dry-run passes; four existing missing-module-tag failures and two warnings.        |
| S3 owned Markdown format                         | structured `run-deno-fmt.ts` wrapper report                                                  | PASS               | 10 files, 0 findings; no outcome, exit code, or Git head; not a durable receipt.                     |
| S3 owned Markdown format write                   | structured `run-deno-fmt.ts --write` wrapper report                                          | PASS               | Kept as wrapper output and excluded from the S4 durable-receipt set.                                 |
| S3 docs links                                    | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors/orphans.                                                            |
| S3 issue/RFC reference audit                     | live `gh` state plus accepted RFC/source comparison                                          | PASS_RESEARCH      | No second general RFC; existing owners and exact hardcoded occurrences are mapped.                   |
| S3 terminology                                   | comparison with `docs/site/glossary.md`                                                      | PASS               | Contribution, plugin, capability, registry, manifest, transaction, and doctor keep canonical senses. |
| `quality:gate`                                   | docs-only policy                                                                             | N/A                | Actual diff does not touch `packages/**` or `plugins/**`.                                            |

### S4 binding evidence

S4-F1 uses remedy **(b)**: the contracted evidence set is exactly the six filenames in the table
below, not a glob over `receipts/*final*.json`. Every binding receipt was created by `run-gate.ts`
from a clean tree and records
`gitHead == actualGitHead == 120859d5c762706702cd45a3f2be19664e335e22`; none enables
`allowGitHeadMismatch`. These rows are therefore `PASS`, not `PASS_PARENT_HEAD`.

| Contracted gate    | Result | Durable receipt                          | Content attested |
| ------------------ | ------ | ---------------------------------------- | ---------------- |
| `check`            | PASS   | `receipts/check-final.json`              | `120859d5c`      |
| `test`             | PASS   | `receipts/test-final.json`               | `120859d5c`      |
| `publish-dry-run`  | PASS   | `receipts/publish-dry-run-final.json`    | `120859d5c`      |
| `arch-check`       | PASS   | `receipts/arch-check-final.json`         | `120859d5c`      |
| docs source format | PASS   | `receipts/docs-source-format-final.json` | `120859d5c`      |
| docs accuracy      | PASS   | `receipts/docs-accuracy-final.json`      | `120859d5c`      |

The following is the exact evaluator invocation used for this six-file set and is the reproduction
command for IMPL-EVAL:

```bash
deno eval '
import { evaluateEvidenceSet } from "./.llm/tools/gates/evidence-set.ts";
const directory = ".llm/runs/docs-rfc-plugin-cli-contribution--1502/receipts";
const filenames = [
  "check-final.json",
  "test-final.json",
  "publish-dry-run-final.json",
  "arch-check-final.json",
  "docs-source-format-final.json",
  "docs-accuracy-final.json",
];
const receipts = await Promise.all(
  filenames.map(async (filename) => JSON.parse(await Deno.readTextFile(`${directory}/${filename}`))),
);
console.log(JSON.stringify(evaluateEvidenceSet({
  immutableHead: "120859d5c762706702cd45a3f2be19664e335e22",
  surface: "docs-rfc-plugin-cli-contribution--1502",
  expectedGateIds: [
    "check",
    "test",
    "publish-dry-run",
    "arch-check",
    "docs-source-format",
    "docs-accuracy",
  ],
  receipts,
}), null, 2));
'
```

The rerun returned `sufficiency: "SUFFICIENT"` and `reasons: []`. Its six receipt IDs were
`ns1502-s4-final-check`, `ns1502-s4-final-test`, `ns1502-s4-final-publish-workspace`,
`ns1502-s4-final-arch-check`, `ns1502-s4-final-docs-source-format`, and
`ns1502-s4-final-docs-accuracy`.

The canonical workspace publish simulation is the one `publish-dry-run` member of the binding set.
`publish-dry-run-cli-final.json` and `publish-dry-run-plugin-final.json` are supplemental durable
surface receipts at the same content head; keeping duplicate gate IDs outside the singular evidence
set preserves the receipt-set law. A naive `receipts/*final*.json` glob is intentionally not the
contracted set because it includes all three `publish-dry-run` receipts and therefore reports a
duplicate gate ID. No receipt metadata was changed for this remedy.
`netscript-jsr-specifiers-final.json`, `publish-assets-final.json`, and
`quality-scan-repo-final.json` are also supplemental durable PASS receipts at that head. The quality
scan retains its documented direct-registration blind spot.

Final structured JSR reports preserve the measured baseline rather than relabeling it as introduced:
`jsr-audit-cli-final.json` has three export-map entries and passes with existing warnings;
`jsr-audit-plugin-final.json` has thirteen entries and the known four missing-`@module` failures,
while its embedded isolated-declaration publish dry-run passes. Full export-map doc lint remains
zero errors for CLI (`doc-lint-cli-final.json`) and the known 15 private-type references for plugin
(`doc-lint-plugin-final.json`). `release:preflight` passed with zero text-import, import-attribute,
file-URL/`import.meta`, or self-import findings. These reports supplement, and do not replace, the
binding six receipts.

The final owned-Markdown `run-deno-fmt.ts` write/check outputs are structured wrapper reports. They
have no durable receipt `outcome`, `exitCode`, or `gitHead` fields and are excluded from the six-
receipt count. The only delta after content head `120859d5c` is receipt and run-journal evidence
under `.llm/runs/docs-rfc-plugin-cli-contribution--1502/`; there is no RFC, package, plugin,
contract, or lock-file content delta. This closes PLAN-EVAL note N-4 for the author handoff.

The three durable receipts from the original S1 turn—`check-cli-plugin-s1.json`,
`docs-source-format-s1.json`, and `docs-accuracy-s1.json`—attest parent commit `3e0c8858b`, not S1
commit `86d0110a5`; the gates ran on the working tree before that tree was committed. Likewise, the
two durable S1 fix-up receipts attest parent `86d0110a5`, not the fix-up commit. This intermediate
evidence is intentionally non-binding: S4 reruns the contracted set at the final author head.

The four durable S2 receipts—`test-cli-plugin-s2.json`, `arch-check-s2.json`,
`docs-source-format-s2.json`, and `docs-accuracy-s2.json`—attest accepted S1 parent commit
`bd8b29bf3`, not the eventual S2 commit: the gates ran over the S2 working tree before it was
committed. They are labelled `PASS_PARENT_HEAD` under the accepted leaf convention. S4's final-head
rerun remains the binding IMPL-EVAL evidence.

`source-format-s1.json`, `source-format-s1-write.json`, and their `-fixup` counterparts are
structured wrapper reports. They carry no `outcome`, `exitCode`, or `gitHead` and are not counted as
`run-gate.ts` durable receipts.

`source-format-s2.json` and `source-format-s2-write.json` are likewise structured wrapper reports,
not durable `run-gate.ts` receipts. They carry no `outcome`, `exitCode`, or `gitHead` and are
excluded from the S4 durable-receipt set.

The durable `quality-scan-repo-s3.json` receipt attests accepted S2 parent `7a5eb580a`, not the
eventual S3 commit. Its `PASS_PARENT_HEAD` means the scanner command passed over the S3 working
tree; it does not erase the separately documented direct-import rule gap. S4's final-head contracted
receipts remain the binding IMPL-EVAL evidence.

The other four durable S3 receipts—`docs-source-format-s3.json`, `docs-accuracy-s3.json`,
`publish-dry-run-cli-s3.json`, and `publish-dry-run-plugin-s3.json`—also attest accepted S2 parent
`7a5eb580a`, not the eventual S3 commit. The two `jsr-audit-*-s3.json` files are structured audit
reports, not `run-gate.ts` receipts; the plugin report's exit 1 is the measured four-module-tag
baseline from the audit invocation, while both embedded dry-runs succeed. `source-format-s3.json`
and `source-format-s3-write.json` are structured formatter reports with no `outcome`, `exitCode`, or
`gitHead` and are excluded from the S4 durable-receipt set.

### Fitness Gates

| Gate               | Result                    | Evidence                          | Notes                                              |
| ------------------ | ------------------------- | --------------------------------- | -------------------------------------------------- |
| F-3 layering       | PASS_DESIGN               | `plan.md` ownership table         | Executable `arch:check` later.                     |
| F-5 public surface | PASS_RESEARCH             | `research.md` + `deno doc`        | Existing surface and planned delta explicit.       |
| F-6 JSR            | PASS_DESIGN_WITH_BASELINE | `research.md` JSR table           | Current plugin baseline failure honestly recorded. |
| F-7 docs           | PASS                      | S0 gate receipts + link output    | Scoped format, accuracy, and links are green.      |
| F-9 permissions    | PASS_DESIGN               | D4, D8, D11–D12                   | Denied/default fixtures later.                     |
| F-10 test shape    | PASS_DESIGN               | plan lifecycle/risk/epic matrices | Concrete future conformance cases named.           |

The repaired `plan.md` Fitness Gates and Later Implementation Epic Shape enumerate all 18
Archetype-4 gates (F-1–F-12, F-14–F-19); this summary does not replace that acceptance manifest.

### Runtime Gates

| Gate               | Result  | Evidence           | Notes                                           |
| ------------------ | ------- | ------------------ | ----------------------------------------------- |
| Product runtime    | N/A     | docs-only boundary | No CLI seam implementation or runtime mutation. |
| `scaffold.runtime` | NOT_RUN | user/gate contract | Global expensive slot is not part of this leaf. |

### Consumer Gates

| Consumer                               | Result        | Evidence                           | Notes                                                |
| -------------------------------------- | ------------- | ---------------------------------- | ---------------------------------------------------- |
| Deploy #904–#908                       | PASS_RESEARCH | live issue/comment inventory       | General versus deploy-owned scope mapped.            |
| DevTools #1477 / RFC 0005              | PASS_RESEARCH | live issue + accepted RFC          | Shared dependency without cross-import fixed.        |
| Frontend/SDK/runtime/business commands | PASS_RESEARCH | accepted RFCs and canonical design | Compatibility laws separated from payload ownership. |

## Handoff Notes

- Cycle-1 `FAIL_PLAN` evaluated `a02f9690154b7384ca8e6503ea91d644b397368a`; evaluator-only commit
  `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f` is preserved. Cycle 2 passed repaired plan head
  `12276e6d86403ed1340ef79a963e87d401d643e9` in evaluator-only commit `3e0c8858b`.
- FP-1 is repaired by the six-gate plan and cycle-1 receipts; FP-2 by measured CLI/plugin exports,
  exact pins, publish dry-runs, isolated-declaration posture, assets, and `import.meta` evidence;
  FP-3 by the authoritative RFC-only scope resolution and significant drift record.
- N-1 through N-4 are closed. The six binding receipts record
  `gitHead == actualGitHead == 120859d5c762706702cd45a3f2be19664e335e22`, with no mismatch override;
  the receipt/journal-only follow-up does not change RFC or contract content.
- The evaluator should inspect `plan.md` D3 (mount restriction), D6–D9 (static registry/lazy
  bootstrap/absent UX), D11–D15 (generation transaction and manifest evolution), and the
  duplicate-audit/epic shape first.
- Verify that the public contract stays in `@netscript/plugin/cli`, host internals stay private, and
  the existing CLI helper migration is explicit.
- Verify all five #1502 acceptance entries point to openable final-head artifacts and leave the
  issue mutation to the later close-gate mirror/coordinator.
- Content head `120859d5c762706702cd45a3f2be19664e335e22` is the immutable gate target. The
  follow-up contains only receipts and run journals; independently verify the final-head diff has no
  change to `rfcs/0000-plugin-cli-contribution.md`, `packages/**`, `plugins/**`, or `deno.lock`.
- The evaluator must independently rerun the exact six-filename command under **S4 binding
  evidence**; do not glob `receipts/*final*.json`, because the two per-member publish receipts are
  supplemental and intentionally excluded from contracted sufficiency. Then re-check RFC ownership
  and declared vocabulary, all five #1502 mappings, measured JSR baselines, open drift, draft/label
  state, and the absence of issue filing or source mutation.
- Final IMPL-EVAL remains a fresh opposite-family session; this author does not dispatch it, write
  `evaluate.md`, flip the draft PR ready, or self-certify.

## 2026-08-15 — Owner KEEP AND NARROW amendment

- **Checkpoint:** The owner released the PR #1651 hold and selected option 1, KEEP AND NARROW, in
  the bounded brief
  `/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/impl-1502-amendment.md`.
  Start-state reconciliation proved local HEAD, the explicit remote branch, and live PR head all
  equal `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019`, with a clean tree and no upstream.
- **Resolution:** The descriptor/router/registry/capability/bootstrap/isolation core is unchanged.
  C6 is narrowed to generic CLI text-plan validation, preview/apply execution,
  stage/check/commit/rollback, and generic registry/plan/journal doctor states. RFC 0003 and #1490
  under #1363 exclusively retain command-store provider, Prisma, migration, generated bridge,
  database-validation, and business-command semantics.
- **Preview closure:** Planner output is now normatively preview-invariant. The planner returns the
  same canonical plan for preview and apply; `invocation.preview` cannot alter construction, and
  only the host execution mode controls mutation.
- **Compatibility correction:** RFC 0003 execution is described as `@netscript/service/commands`
  with consumer-owned composition. Non-assignability applies to domain-bearing
  envelopes/definitions/results, while structurally identical JSON value aliases remain
  intentionally assignable without branding.
- **Scope discipline:** This is a refinement of locked D11–D18, not a new D-series decision or code
  scope. No PLAN-EVAL is authorized. RFC 0003, package/plugin source, issues, evaluator artifacts,
  and `deno.lock` remain untouched. The four expressly forbidden cross-domain mappings were not
  added.
- **Evidence sequence:** Commit the RFC and these content journals first. From that clean content
  head, rerun the six contracted gates with fresh `ns1502-amend-*` invocation IDs; then record the
  exact six-file evidence-set invocation and result in a receipt/journal-only follow-up.

### Owner-amendment binding evidence

Content head `67e12f02165089ec7431b72d1294147477906282` was clean before every gate. All six
receipts record `gitHead == actualGitHead` at that content head, omit `allowGitHeadMismatch`, and
passed with exit code 0.

| Contracted gate    | Result | Invocation ID                     | Durable receipt                          |
| ------------------ | ------ | --------------------------------- | ---------------------------------------- |
| `check`            | PASS   | `ns1502-amend-check`              | `receipts/check-amend.json`              |
| `test`             | PASS   | `ns1502-amend-test`               | `receipts/test-amend.json`               |
| `publish-dry-run`  | PASS   | `ns1502-amend-publish-workspace`  | `receipts/publish-dry-run-amend.json`    |
| `arch-check`       | PASS   | `ns1502-amend-arch-check`         | `receipts/arch-check-amend.json`         |
| docs source format | PASS   | `ns1502-amend-docs-source-format` | `receipts/docs-source-format-amend.json` |
| docs accuracy      | PASS   | `ns1502-amend-docs-accuracy`      | `receipts/docs-accuracy-amend.json`      |

The scoped check was a valid cached re-check: it completed in 64 ms, returned exit code 0, emitted
no stdout, and reported the cached/inputs-unchanged fact on stderr. It does not carry the cycle-1
`1,033 files, 9 batches, 0 failed` figures. Those figures belong only to
`check-cli-plugin-cycle1.json` at `d71b78c3`, not to this binding evidence.

The following is the exact evidence-set invocation used. It consumes only the six named amendment
receipts; no `receipts/*final*.json` or other glob is part of the contracted set.

```bash
deno eval '
import { evaluateEvidenceSet } from "./.llm/tools/gates/evidence-set.ts";
const directory = ".llm/runs/docs-rfc-plugin-cli-contribution--1502/receipts";
const filenames = [
  "check-amend.json",
  "test-amend.json",
  "publish-dry-run-amend.json",
  "arch-check-amend.json",
  "docs-source-format-amend.json",
  "docs-accuracy-amend.json",
];
const receipts = await Promise.all(
  filenames.map(async (filename) => JSON.parse(await Deno.readTextFile(`${directory}/${filename}`))),
);
console.log(JSON.stringify(evaluateEvidenceSet({
  immutableHead: "67e12f02165089ec7431b72d1294147477906282",
  surface: "docs-rfc-plugin-cli-contribution--1502-owner-amendment",
  expectedGateIds: [
    "check",
    "test",
    "publish-dry-run",
    "arch-check",
    "docs-source-format",
    "docs-accuracy",
  ],
  receipts,
}), null, 2));
'
```

Result: `SUFFICIENT`, with `reasons: []`, the six expected gate IDs, and exactly the six
`ns1502-amend-*` receipt IDs above. The receipt/journal follow-up changes no RFC, contract,
package/plugin source, or lock content. Tier-A review and the final fresh opposite-family IMPL-EVAL
remain coordinator-owned and are not launched by this author.
