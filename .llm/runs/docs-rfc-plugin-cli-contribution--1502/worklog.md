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

| #  | Slice                                                                           | Gate                                                                            | Files                |
| -- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| S0 | Bootstrap/research/plan/design and evaluator placeholders                       | structured scoped fmt; durable docs accuracy; docs links; raw scope/lock checks | run directory only   |
| S1 | RFC public contract and ownership                                               | scoped fmt; docs links/accuracy; live API/help sampling                         | RFC + run artifacts  |
| S2 | RFC lifecycle, security, and generation transaction                             | scoped fmt; docs links/accuracy; decision completeness                          | RFC + run artifacts  |
| S3 | RFC compatibility, migration, duplicate audit, and implementation epic proposal | scoped fmt; docs links/accuracy; issue/RFC audit                                | RFC + run artifacts  |
| S4 | Gate/evidence reconciliation and IMPL-EVAL handoff                              | receipt/raw Git/review-thread checks                                            | run/PR metadata only |

### Deferred Scope

- Product implementation — later epic after RFC acceptance.
- Dynamic completion providers — v1 completion is descriptor-only.
- Arbitrary plugin-created top-level CLI mounts — v1 uses host-declared extensible mounts.
- Exact exit numbers, size/time default limits, help visibility copy — FCP/product policy within
  fixed contracts.
- Issue/epic filing, milestone changes, #904–#908/#1474/#1477 amendments — maintainer action after
  the RFC's duplicate audit is accepted.
- Package/plugin source changes, publication, global E2E, merge/readiness — outside this leaf.

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

| Time                  | Slice | Step      | Notes                                                                                                                           |
| --------------------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 21:45 CEST | S0    | activate  | Read all nine selected skills completely; activated harness/docs A4 workflow.                                                   |
| 2026-08-13 21:55 CEST | S0    | reconcile | Fetched live `origin/main`; clean exact base, no upstream; #1502 open/zero comments; no existing PR.                            |
| 2026-08-13 22:05 CEST | S0    | research  | Read required harness/archetype/doctrine/RFC sources and live CLI/plugin public surfaces with `deno doc` before focused source. |
| 2026-08-13 22:20 CEST | S0    | consumers | Fetched #904–#908/comments and adjacent #424/#946/#1477; searched for duplicate general proposals.                              |
| 2026-08-13 22:25 CEST | S0    | JSR audit | Measured plugin/CLI export-map doc lint and recorded public-surface, slow-type, export, and asset risks.                        |
| 2026-08-13 22:30 CEST | S0    | design    | Locked ownership, lifecycle, security, compatibility, epic shape, and no-global-expensive-gate contract.                        |
| 2026-08-13 22:34 CEST | S0    | gates     | Scoped structured Markdown format, durable docs accuracy, and internal-link checks passed; no code/global expensive gate run.   |

## Decisions

| Decision                                                               | Reason                                                                           | Source                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| Existing `@netscript/plugin/cli` owns the public DSL.                  | It is already published; new package would duplicate ownership.                  | `deno.json`, doctrine, `plan.md` D1.       |
| Host-declared extensible mount, nested children only.                  | Deploy needs `deploy` children; arbitrary top-level capture is unsafe.           | #904/#908, doctrine, D3.                   |
| Static help/completion; selected-handler lazy bootstrap.               | Startup, determinism, and isolation.                                             | #905, RFC 0001/frontend law, D6–D8.        |
| Host-neutral mutation plan, host-owned transaction.                    | Preview/no-write, path containment, rollback, and one-generator/two-callers.     | current scaffolder gap, RFC 0005, D11–D13. |
| Installer/runtime pointers cross-check; `.passthrough()` prerequisite. | Current `.strict()` rejects future top-level blocks; payload duplication drifts. | live schema, RFC 0005 F-3, D14–D15.        |
| No evaluator dispatch.                                                 | User requires separate-session handoff only.                                     | brief, supervisor identity.                |

## Drift

| Drift                                                                     | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------- | ----------- | ------------------ |
| Canonical docs route differs from attached Codex author.                  | minor       | yes                |
| Accepted consumer RFC seams are not shipped.                              | significant | yes                |
| Existing `./cli` is a shallow/inheritance surface, not the proposed seam. | significant | yes                |
| Existing plugin public doc-lint baseline includes a `./cli` private type. | significant | yes                |

## Gate Results

### Static Gates

| Gate                                        | Command or check                                                                             | Result        | Notes                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| Live public-surface inspection              | `deno doc packages/cli/mod.ts`; `deno doc packages/plugin/mod.ts`; focused `deno doc`/source | PASS          | Research only; exact exports and commands inventoried.                            |
| JSR doc-lint baseline (`@netscript/plugin`) | `deno task doc:lint --root packages/plugin`                                                  | BASELINE_FAIL | 15 private-type refs package-wide; one on `./cli`; no package change claimed.     |
| JSR doc-lint baseline (`@netscript/cli`)    | `deno task doc:lint --root packages/cli`                                                     | PASS          | 0 diagnostics across three entrypoints.                                           |
| Structured scoped Markdown format           | `run-deno-fmt.ts --root <run-dir> --ext md --output ...`                                     | PASS          | 8 files, 1 batch, 0 findings; `receipts/source-format.json`.                      |
| Durable docs accuracy                       | `run-gate.ts --gate docs-accuracy --id ...-s0-accuracy`                                      | PASS          | Exit 0; `receipts/docs-accuracy.json`; pre-existing peer warning only.            |
| Internal docs links                         | `deno task docs:links`                                                                       | PASS          | 103 docs, 0 broken links/anchors, 0 orphans.                                      |
| Type-check/test/lint                        | docs-only rationale                                                                          | N/A           | No code or checkable snippet changed in S0.                                       |
| Publish dry-run/arch check                  | docs-only rationale                                                                          | N/A           | Planned for applicable future package/plugin children; no source surface changed. |
| `quality:gate`                              | docs-only policy                                                                             | N/A           | Actual diff does not touch `packages/**` or `plugins/**`.                         |

### Fitness Gates

| Gate               | Result                    | Evidence                          | Notes                                              |
| ------------------ | ------------------------- | --------------------------------- | -------------------------------------------------- |
| F-3 layering       | PASS_DESIGN               | `plan.md` ownership table         | Executable `arch:check` later.                     |
| F-5 public surface | PASS_RESEARCH             | `research.md` + `deno doc`        | Existing surface and planned delta explicit.       |
| F-6 JSR            | PASS_DESIGN_WITH_BASELINE | `research.md` JSR table           | Current plugin baseline failure honestly recorded. |
| F-7 docs           | PASS                      | S0 gate receipts + link output    | Scoped format, accuracy, and links are green.      |
| F-9 permissions    | PASS_DESIGN               | D4, D8, D11–D12                   | Denied/default fixtures later.                     |
| F-10 test shape    | PASS_DESIGN               | plan lifecycle/risk/epic matrices | Concrete future conformance cases named.           |

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

- The evaluator should inspect `plan.md` D3 (mount restriction), D6–D9 (static registry/lazy
  bootstrap/absent UX), D11–D15 (generation transaction and manifest evolution), and the
  duplicate-audit/epic shape first.
- Verify that the public contract stays in `@netscript/plugin/cli`, host internals stay private, and
  the existing CLI helper migration is explicit.
- Verify every issue #1502 decision and all five acceptance boxes have a planned evidence path.
- Record the formal verdict only in `plan-eval.md`; do not author the RFC in the evaluator session.
