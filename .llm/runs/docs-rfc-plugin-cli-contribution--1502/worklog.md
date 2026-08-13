# Worklog: typed plugin CLI contribution RFC

## Run Metadata

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`       |
| Branch         | `docs/rfc-plugin-cli-contribution`             |
| Archetype      | 4 — public DSL/builder (future implementation) |
| Scope overlays | `SCOPE-docs`                                   |

## Design

This checkpoint is locked before the RFC file exists. It describes the public contract the RFC will
specify after separate PLAN-EVAL; it does not authorize package implementation.

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

| Time                  | Slice | Step      | Notes                                                                                                                              |
| --------------------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 21:45 CEST | S0    | activate  | Read all nine selected skills completely; activated harness/docs A4 workflow.                                                      |
| 2026-08-13 21:55 CEST | S0    | reconcile | Fetched live `origin/main`; clean exact base, no upstream; #1502 open/zero comments; no existing PR.                               |
| 2026-08-13 22:05 CEST | S0    | research  | Read required harness/archetype/doctrine/RFC sources and live CLI/plugin public surfaces with `deno doc` before focused source.    |
| 2026-08-13 22:20 CEST | S0    | consumers | Fetched #904–#908/comments and adjacent #424/#946/#1477; searched for duplicate general proposals.                                 |
| 2026-08-13 22:25 CEST | S0    | JSR audit | Measured plugin/CLI export-map doc lint and recorded public-surface, slow-type, export, and asset risks.                           |
| 2026-08-13 22:30 CEST | S0    | design    | Locked ownership, lifecycle, security, compatibility, epic shape, and no-global-expensive-gate contract.                           |
| 2026-08-13 22:34 CEST | S0    | gates     | Scoped structured Markdown format, durable docs accuracy, and internal-link checks passed; no code/global expensive gate run.      |
| 2026-08-13 22:48 CEST | S0R   | eval-read | Preserved evaluator-only commit `d71b78c3`; read all 145 lines of cycle-1 `FAIL_PLAN` before repair.                               |
| 2026-08-13 22:55 CEST | S0R   | contract  | Read coordinator key `rfc-plugin-cli-contribution`; recorded authoritative RFC-only mutation resolution as significant drift.      |
| 2026-08-13 22:59 CEST | S0R   | JSR audit | Measured CLI/plugin exports, docs, exact internal pins, isolated-declaration posture, publish assets, and `import.meta` preflight. |
| 2026-08-13 23:00 CEST | S0R   | gates     | Structured check and focused tests, per-member publish dry-runs, and root architecture gate passed at evaluator head.              |
| 2026-08-13 23:08 CEST | S0R   | docs      | Structured run Markdown, docs-source-format, docs-accuracy, links, and live-glossary terminology review passed.                    |

## Decisions

| Decision                                                               | Reason                                                                             | Source                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| Existing `@netscript/plugin/cli` owns the public DSL.                  | It is already published; new package would duplicate ownership.                    | `deno.json`, doctrine, `plan.md` D1.       |
| Host-declared extensible mount, nested children only.                  | Deploy needs `deploy` children; arbitrary top-level capture is unsafe.             | #904/#908, doctrine, D3.                   |
| Static help/completion; selected-handler lazy bootstrap.               | Startup, determinism, and isolation.                                               | #905, RFC 0001/frontend law, D6–D8.        |
| Host-neutral mutation plan, host-owned transaction.                    | Preview/no-write, path containment, rollback, and one-generator/two-callers.       | current scaffolder gap, RFC 0005, D11–D13. |
| Installer/runtime pointers cross-check; `.passthrough()` prerequisite. | Current `.strict()` rejects future top-level blocks; payload duplication drifts.   | live schema, RFC 0005 F-3, D14–D15.        |
| No evaluator dispatch.                                                 | User requires separate-session handoff only.                                       | brief, supervisor identity.                |
| Contract surfaces are inspection-only; all six gates still bind.       | Authoritative cycle-1 dispatch resolves FP-3 without waiving FP-1/FP-2 evidence.   | contract key, `drift.md`, D22.             |
| `Closes #1502` stays; future implementation is separate and unfiled.   | #1502 is completed by this RFC leaf, not used as the proposed implementation epic. | cycle-1 dispatch, D23.                     |

## Drift

| Drift                                                                                     | Severity    | Logged in drift.md |
| ----------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Canonical docs route differs from attached Codex author.                                  | minor       | yes                |
| Accepted consumer RFC seams are not shipped.                                              | significant | yes                |
| Existing `./cli` is a shallow/inheritance surface, not the proposed seam.                 | significant | yes                |
| Existing plugin public doc-lint baseline includes a `./cli` private type.                 | significant | yes                |
| Coordinator contract shape conflicts with the authoritative RFC-only mutation boundary.   | significant | yes                |
| `SCOPE-docs` points to a retired glossary path; live glossary is `docs/site/glossary.md`. | minor       | yes                |

## Gate Results

### Static Gates

| Gate                                             | Command or check                                                                             | Result             | Notes                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| Live public-surface inspection                   | `deno doc packages/cli/mod.ts`; `deno doc packages/plugin/mod.ts`; focused `deno doc`/source | PASS               | Research only; exact exports and commands inventoried.                                            |
| JSR doc-lint baseline (`@netscript/plugin`)      | structured full export-map runner                                                            | BASELINE_FAIL      | 15 private-type refs package-wide; one on `./cli`; `receipts/doc-lint-plugin-cycle1.json`.        |
| JSR doc-lint baseline (`@netscript/cli`)         | structured full export-map runner                                                            | PASS               | 0 diagnostics across three entrypoints; `receipts/doc-lint-cli-cycle1.json`.                      |
| Initial S0 scoped Markdown format                | `run-deno-fmt.ts --root <run-dir> --ext md --output ...`                                     | PASS               | 8 files, 1 batch, 0 findings; `receipts/source-format.json`.                                      |
| Initial S0 durable docs accuracy                 | `run-gate.ts --gate docs-accuracy --id ...-s0-accuracy`                                      | PASS               | Exit 0; `receipts/docs-accuracy.json`; pre-existing peer warning only.                            |
| Cycle-1 scoped Markdown format                   | structured `run-deno-fmt.ts` report                                                          | PASS               | 8 files, 1 batch, 0 findings; `receipts/source-format-cycle1.json`.                               |
| Contracted docs source format                    | durable `docs-source-format` gate from `docs/site`                                           | PASS               | `Docs source format: OK`; `receipts/docs-source-format-cycle1.json`.                              |
| Contracted docs accuracy                         | durable root `docs-accuracy` gate                                                            | PASS               | Current command/export corpus green; `receipts/docs-accuracy-cycle1.json`; existing peer warning. |
| Internal docs links                              | `deno task docs:links`                                                                       | PASS               | 103 docs, 0 broken links/anchors, 0 orphans.                                                      |
| Docs terminology (live glossary)                 | focused comparison with `docs/site/glossary.md`                                              | PASS_PLAN          | Existing capability/contribution/manifest/plugin/registry meanings preserved; final RFC reruns.   |
| Contracted structured check                      | durable `check` gate with CLI/plugin include                                                 | PASS               | 1,033 files, 9 batches, 0 failed; `receipts/check-cli-plugin-cycle1.json`.                        |
| Contracted structured test                       | durable focused `test` gate over 16 CLI/plugin files                                         | PASS               | 88 passed, 0 failed; `receipts/test-cli-plugin-cycle1.json`.                                      |
| Contracted publish dry-run (`@netscript/cli`)    | canonical per-member wrapper through durable gate                                            | PASS               | Static dry-run only; `receipts/publish-dry-run-cli-cycle1.json`.                                  |
| Contracted publish dry-run (`@netscript/plugin`) | canonical per-member wrapper through durable gate                                            | PASS               | Static dry-run only; `receipts/publish-dry-run-plugin-cycle1.json`.                               |
| Contracted architecture check                    | durable root `arch-check` gate                                                               | PASS               | 0 failures; existing warnings retained in receipt; `receipts/arch-check-cycle1.json`.             |
| Exact internal `@netscript/*` pins               | durable `netscript-jsr-specifiers` gate                                                      | PASS               | 2,360 scanned, 1 documented allowance, 0 ranges/failures.                                         |
| Publish-asset freshness                          | durable `publish-assets` gate                                                                | PASS               | Generated publish assets current; `receipts/publish-assets-cycle1.json`.                          |
| Runtime asset / `import.meta` preflight          | `deno task release:preflight`                                                                | PASS               | 0 text-import, import-attribute, file-URL, and self-import findings; JSON audit receipt retained. |
| JSR package audit (`@netscript/cli`)             | `audit-jsr-package.ts --root packages/cli --out ...`                                         | PASS_WITH_WARNINGS | Dry-run succeeds; existing helper/cardinality warnings and parser banner recorded.                |
| JSR package audit (`@netscript/plugin`)          | `audit-jsr-package.ts --root packages/plugin --out ...`                                      | BASELINE_FAIL      | Dry-run succeeds; four existing missing `@module` tags make audit exit 1.                         |
| `quality:gate`                                   | docs-only policy                                                                             | N/A                | Actual diff does not touch `packages/**` or `plugins/**`.                                         |

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
  `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f` is preserved. Cycle 2 must evaluate the repaired plan
  head recorded in the PR's single PLAN-UPDATE comment.
- FP-1 is repaired by the six-gate plan and cycle-1 receipts; FP-2 by measured CLI/plugin exports,
  exact pins, publish dry-runs, isolated-declaration posture, assets, and `import.meta` evidence;
  FP-3 by the authoritative RFC-only scope resolution and significant drift record.
- N-1 through N-4 are carried: high author effort is corrected, `Closes #1502` is resolved to this
  RFC leaf only, the terminology gate names `docs/site/glossary.md`, and the future roadmap lists
  all 18 applicable Archetype-4 fitness gates.
- The evaluator should inspect `plan.md` D3 (mount restriction), D6–D9 (static registry/lazy
  bootstrap/absent UX), D11–D15 (generation transaction and manifest evolution), and the
  duplicate-audit/epic shape first.
- Verify that the public contract stays in `@netscript/plugin/cli`, host internals stay private, and
  the existing CLI helper migration is explicit.
- Verify every issue #1502 decision and all five acceptance boxes have a planned evidence path.
- Record the formal verdict only in `plan-eval.md`; do not author the RFC in the evaluator session.
- The author has not written `rfcs/0000-plugin-cli-contribution.md`, self-evaluated, dispatched a
  rival evaluator, changed lifecycle state, or expanded into package/plugin source.
