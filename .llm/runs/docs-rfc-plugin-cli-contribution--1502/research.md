# Research — docs-rfc-plugin-cli-contribution--1502

## Re-baseline

- Carried-in source: issue #1502, its owner brief, deploy proposals #904–#908, accepted RFCs 0001,
  0002, 0003, and 0005, and the accepted frontend design merged through PR #890.
- Re-derived against live `origin/main` at `01e0960494c95ce56eb35892c211a095eb13e6ed` on 2026-08-13.
- Branch reconciliation: local `HEAD`, merge base, and `origin/main` are the required SHA; worktree
  was clean; branch is `docs/rfc-plugin-cli-contribution`; no upstream is configured.
- Live GitHub reconciliation: #1502 is open with zero comments and milestone `0.0.7`; no existing PR
  references #1502 and no PR exists from this head branch.
- Baseline drift: no branch/base/issue/PR drift. Architectural implementation drift is recorded in
  `drift.md`: accepted consumer RFCs are design authority but their contribution machinery is not
  shipped.

## Required-source inventory

| Source                                                             | Status | Binding input for the plan                                                                                                                                                  |
| ------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                        | read   | Doctrine first; contract first; native Deno tooling; no lock/cache churn; docs-only scoped gates.                                                                           |
| Harness activation/run-loop/lane policy/plan gate/plan protocol    | read   | Tracked run artifacts, separate PLAN-EVAL, explicit routes, design checkpoint, reviewable slices.                                                                           |
| Archetype decision tree + Archetype 4 + `SCOPE-docs` + gate matrix | read   | Public DSL/builder is the approved described implementation; this leaf changes only docs/run artifacts.                                                                     |
| Doctrine chapters 01, 02, 04–11                                    | read   | Registration over inheritance; deterministic explicit discovery; immutable public definitions; errors at the edge; thin plugins; no hidden globals or load-time I/O.        |
| `rfcs/README.md`                                                   | read   | Draft path must retain `0000`; status remains Draft until acceptance.                                                                                                       |
| RFC 0001                                                           | read   | Explicit static pointers, `{family, major}` compatibility, duplicate rejection, order independence, lazy preparation, stable errors, generated imports.                     |
| RFC 0002                                                           | read   | Runtime contribution families and management CLI are consumers, not the CLI extension contract owner.                                                                       |
| RFC 0003                                                           | read   | Transactional business commands are distinct; its generators and preview semantics are precedents, not the plugin CLI seam.                                                 |
| RFC 0005                                                           | read   | DevTools is a separate host; family-neutral envelopes, replace-set generation, doctor/quarantine, manifest evolution, and one-generator/two-callers are compatibility laws. |
| Frontend canonical design from PR #890                             | read   | Pure manifest pointer, static family payload, deterministic generate-time registry, staged check/swap/rollback, empty replace-set, doctor lifecycle.                        |
| Live #1502 + comments                                              | read   | Five acceptance boxes; zero comments; 0.0.7 foundation; deploy and DevTools must share one seam.                                                                            |
| Live #904–#908 + comments                                          | read   | Deploy-specific contract/bootstrap/doctor/plugin/router proposals; #904 and #908 explicitly defer the general seam to #1502.                                                |

## Findings

| ID  | Finding                                                                                                                                                                                                                                                                 | How to verify                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | The root CLI tree is a static Cliffy registry. Top-level `deploy`, `generate`, and `plugin` groups are registered directly; no generic contributed-child mount exists.                                                                                                  | `packages/cli/src/public/features/root/public-command-tree.ts:47-124`; live `netscript --help`.                                                       |
| R2  | `@netscript/plugin` already exports `./cli`, so the RFC must evolve a public surface rather than invent an unowned new package.                                                                                                                                         | `packages/plugin/deno.json:6-17`; `deno doc packages/plugin/src/cli/mod.ts`.                                                                          |
| R3  | The current CLI contract is too shallow: command name, description, flags/values, `run`, and a result code/message/data only. It has no route tree, completion, capability, version, loader, ownership, or stable error vocabulary.                                     | `packages/plugin/src/cli/types.ts:1-29`.                                                                                                              |
| R4  | Current composition is inheritance plus flat name-prefixing (`group:command`), contrary to the approved compositional Archetype-4 builder direction.                                                                                                                    | `packages/plugin/src/cli/base/plugin-cli.ts`; `packages/plugin/src/cli/composition/mount-plugin-cli.ts:4-11`.                                         |
| R5  | Plugin commands remain hardcoded in the host (`plugin ai`, `plugin auth`); framework verbs dispatch an entire package `./cli` subprocess with `-A`. This is neither least-privilege bootstrap nor a generic mount contract.                                             | `packages/cli/src/public/features/plugins/plugins-group.ts:29-151`; `dispatch/dispatch-plugin-verb.ts:14-130`.                                        |
| R6  | Runtime plugin contributions already contain a `cli` object, but it hardcodes only the `auth-backend` doctor check, and `mergeContributions` drops `cli` entirely.                                                                                                      | `packages/plugin/src/config/domain/plugin-contributions.ts:11-17`; `config/application/contribution-merger.ts:3-26`.                                  |
| R7  | Installer metadata already owns one scaffolder pointer plus static permissions and dry-run, but execution passes broad permission flags to a subprocess and may run post-scripts after the scaffold. A partial post-script failure is not a workspace transaction.      | `packages/plugin/src/protocol/manifest.ts:6-41,138-163`; `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:140-188,203-247`. |
| R8  | `ScaffolderContext` exposes an absolute workspace root and a boolean `dryRun`; `ScaffoldResult` reports file names but does not carry a host-validated mutation plan or rollback contract.                                                                              | `packages/plugin/src/protocol/scaffolder.ts:3-32`.                                                                                                    |
| R9  | The installer manifest is strict and pins schema version 1. Unknown top-level pointers fail old CLIs; accepted RFC 0005 already ratifies `.passthrough()` as the prerequisite, but issue #1474 is not delivered.                                                        | `packages/plugin/src/protocol/manifest.ts:275-302`; RFC 0005 §6 and W1-d; issue #1474.                                                                |
| R10 | Runtime manifest discovery is explicit from configured plugin specs, but manifest resolution currently uses `Promise.all`; contribution merging does not carry owner provenance or collision checks.                                                                    | `packages/cli/src/public/features/plugins/host/plugin-loader.ts:78-99`; `resolve-plugin-manifest.ts`; `load-plugin-contributions.ts`.                 |
| R11 | CLI error presentation has a useful host-owned boundary (`CliExitError` categories and context), but plugin subprocess failures are collapsed to `RemoteError` and raw stderr context.                                                                                  | `packages/cli/src/kernel/domain/errors/cli-exit-error.ts`; `run-public-cli.ts:18-37`; `dispatch-plugin-verb.ts:121-127`.                              |
| R12 | `plugin doctor` is a host-owned aggregate command and already emits diagnostic evidence. It is the correct lifecycle integration point, not a plugin-owned parallel doctor CLI.                                                                                         | `packages/cli/src/public/features/plugins/doctor/doctor-plugin-command.ts:48-115`.                                                                    |
| R13 | `generate` currently exposes only `aspire`, `runtime-schemas`, and `plugins`; a contribution generator must compose with the authoritative `generate plugins` lifecycle instead of creating another discovery path.                                                     | `packages/cli/src/public/features/generate/generate-group.ts:9-31`; live help.                                                                        |
| R14 | Frontend/RFC 0005 establish the compatibility pattern: parse-only pointer → generated static registry → staged check → atomic swap; deterministic empty emissions remove stale imports. The CLI RFC should reuse the law, not the frontend payload or DevTools package. | frontend canonical `03-discovery-and-registry.md`; RFC 0005 §§6, 13–14.                                                                               |
| R15 | RFC 0001 requires explicit selection, static module/export refs, family-major handshakes, duplicate rejection, and order-independent composition. CLI contribution success must obey the same laws without importing SDK client types.                                  | `rfcs/0001-sdk-client-contributions.md`.                                                                                                              |
| R16 | RFC 0002's automation management surface and RFC 0003's business command definitions are consumers behind handlers. Neither may become the plugin CLI descriptor or transaction owner.                                                                                  | RFC 0002 §§5, 8–9; RFC 0003 command/CLI/generation sections.                                                                                          |
| R17 | Live issue searches find no second general RFC beyond #1502. Known adjacent work is concrete consumer or generator scope: deploy #904–#908, DevTools #1477 (successor to closed #424), frontend generator #946, and resource-slice generator #1354.                     | GitHub searches for `CLI command contribution`, `plugin CLI`, `mount-children`, `scaffolder contribution`, and `generation seam`.                     |

## Live consumer-proposal inventory

| Proposal                                        | Current state                                                     | What survives under the shared RFC                                                                   | Duplicate/supersession disposition to propose later                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #904 — deploy host mount-children contract      | open, `status:plan`, 0.0.11; comment says #1502 owns general seam | Deploy is a real first consumer; reserved mount and duplicate-owner tests remain acceptance.         | Supersede its general contract/builder/merger scope with the future #1502 core-contract child; amend #904 to a deploy conformance consumer only.          |
| #905 — async bootstrap/isolation/absent UX      | open, `status:plan`, 0.0.11                                       | Startup budget, one-broken-plugin isolation, install hint remain cross-seam conformance cases.       | Fold general host bootstrap into a future host-integration child; retain only deploy fixture coverage.                                                    |
| #906 — doctor/tooling/contribution axes         | open, `status:plan`, 0.0.11                                       | Data-driven doctor, manifest capability declaration, and v1 compatibility are shared prerequisites.  | Split generic protocol/doctor work into the future epic; retain deploy-specific manifest/tooling acceptance only after duplicate audit.                   |
| #907 — deploy manifest triad/composition root   | open, `status:plan`, 0.0.11                                       | Thin plugin and generated registry ownership remain deploy consumer proof.                           | Keep as deploy plugin implementation; replace dependencies on deploy-only host abstractions with the accepted shared seam.                                |
| #908 — deploy command children/router           | open, `status:plan`, 0.0.11; comment says it must consume #1502   | Target-specific grammar and behavior remain entirely deploy-owned.                                   | Keep; it supplies commands through the shared descriptor/generator seam and does not define host APIs.                                                    |
| #1477 — DevTools generated host + command group | open, `status:triage`, 0.0.15                                     | `devtools generate                                                                                   | start` is a concrete command/generator consumer; generated host remains userland.                                                                         |
| #424 — old dashboard CLI/auto-launch            | closed `not_planned`                                              | Only historical CLI discoverability/auto-launch intent.                                              | Already superseded by #1472/#1477; do not revive or duplicate.                                                                                            |
| #946 — frontend convention generator            | open, 0.0.15                                                      | Explicit manifest remains contract; convention generation is optional sugar.                         | Keep separate payload generator; it may invoke the shared generation transaction but does not own CLI discovery.                                          |
| #1354 — typed resource-slice generator          | open                                                              | Dry-run, idempotency, negative no-write, and one generator/two callers are compatible consumer laws. | Keep independent; optional plugin-contribution inclusion is a downstream consumer, not the shared seam.                                                   |
| #1474 — manifest `.passthrough()` prerequisite  | open, 0.0.15                                                      | General forward-compatible manifest parsing is required before any new top-level pointer.            | Duplicate audit must decide whether the 0.0.7 generic protocol child delivers it and #1474 becomes DevTools verification only. Do not file or mutate now. |

The later RFC proposes an implementation epic and this mapping, but this leaf files no epic/child
and changes no existing issue.

## Public-surface and ownership assessment

| Concern                                                                                                 | Planned owner                               | Boundary                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Static command/generator descriptor types, builder, error/capability vocabulary                         | `@netscript/plugin/cli` (Archetype 4)       | Framework-neutral, immutable, no Cliffy/Deno filesystem/process types.                                           |
| Runtime manifest `cli` contribution axis and installer parse-only pointer                               | `@netscript/plugin` config/protocol         | Pointer and declared capabilities only; no handler import while parsing.                                         |
| Discovery, generated registry, route/collision validation, lazy bootstrap, Cliffy adaptation, rendering | `@netscript/cli` internal A6 implementation | No new root export unless a concrete external consumer proves it; use `./testing` only for conformance fixtures. |
| Plugin command handlers and generator planners                                                          | each plugin                                 | Depend on `@netscript/plugin/cli`; receive narrow host capabilities; never import host internals.                |
| Workspace mutation transaction                                                                          | host CLI                                    | Plugin returns a typed plan; host validates containment/capabilities, stages, checks, commits or rolls back.     |
| Doctor aggregation and stale-pointer diagnostics                                                        | host CLI over plugin-owned descriptor data  | One doctor command; plugin failures are isolated and attributed.                                                 |

## JSR audit surface scan (planned package/plugin waves)

This docs leaf does not change publishable code and does not run publication or publish dry-runs.
The audit below applies the rubric to every planned public surface so the later epic cannot hide
packaging work.

| Planned publishable surface                                                  | Current audit                                                                                                                                                            | Required implementation bar / risk                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/plugin/cli`                                                      | Existing export is included by `src/**/*.ts`. Full package doc-lint has 15 private-type errors; this subpath has one (`applyScaffoldPlan` → private `ScaffoldArtifact`). | Zero diagnostics for the touched subpath and no increase package-wide; explicit annotations on builder callbacks/results to avoid slow types; module/symbol docs and runnable example; ESM only; no upstream Cliffy re-export; export map unchanged unless justified.           |
| `@netscript/plugin/protocol` + `@netscript/plugin/config`                    | Both existing subpaths are exported and included. Installer schema is strict; runtime contribution payload is broadly `unknown`.                                         | Forward-compat fixture, malformed-pointer validation at the correct phase, documented family/major and error vocabulary; schema change must not silently drop typo protection without focused validation.                                                                       |
| `@netscript/cli`                                                             | Three export-map entrypoints; current full doc-lint is clean. `isolatedDeclarations` is false; published include carries `src/**/*.ts` and templates/assets.             | Keep registry/Cliffy/transaction adapters internal. If a testing helper is public, annotate every exposed return/callback type; ensure asset templates are included or embedded, never runtime-read from an omitted file; full export-map doc lint and clean dry-run file list. |
| Future first-party consumer plugin subpaths (`./cli`, generator entrypoints) | Existing scaffold templates publish `src/**/*.ts`; plugin-specific status varies and must be audited per child.                                                          | Each plugin child must verify `deno.json` exports/include, README permissions and examples, no load-time I/O, no self-import through JSR, no JSX or missing assets, zero slow-type warnings, and consumer install/import proof.                                                 |

JSR/package risks that must be named in the RFC implementation roadmap:

1. Recursive generic route builders and inferred async handler factories can produce slow types;
   public returns and callback boundaries need explicit annotations.
2. The current `./cli` private-type reference is a measured baseline, not permission to add more.
3. Generated descriptor/registry assets must be embedded TypeScript or intentionally included;
   runtime file reads/import attributes are not publish-equivalent.
4. Internal self-imports such as `@netscript/plugin/cli` from inside the same package can bind to
   the latest published package during publish; implementation must use relative internal imports.
5. A CLI-internal Cliffy type in a public descriptor would leak upstream types and make completion,
   errors, and slow-type behavior dependent on Cliffy.
6. Plugin manifest pointer exports must be present in each package export map and verified from a
   consumer-shaped JSR install, not only a local dry-run.

## Design constraints derived from doctrine

- Registration and a literal-preserving builder replace inheritance as the primary authoring form.
- Plugin discovery is explicit from project configuration and generated registries; never scan
  `node_modules` and never make plugin load order semantic.
- Static descriptors are data. Loading a descriptor or asking for help/completion must not execute a
  command handler or perform I/O.
- The host owns lifecycle, capabilities, output/mutation transaction, cancellation, and error
  presentation. Plugins own domain error codes/messages within the bounded public vocabulary.
- Duplicate mount/route ownership fails deterministically before argument parsing and names both
  owners; no last-wins merge.
- Thin plugins declare commands and planners; shared routing/generation laws live in the framework.
- No framework package source may change in this leaf. Any need to do so before the RFC is accepted
  is architectural drift and requires topic-orchestrator direction.

## Open questions resolved into the plan

- Exact draft path: `rfcs/0000-plugin-cli-contribution.md` (available in the live RFC index).
- V1 mount model: plugins contribute nested children only to a host-declared extensible mount; no
  arbitrary plugin-created top-level command and no top-level shadowing.
- Help/completion: both derive from static descriptors; dynamic completion providers are deferred.
- Bootstrap: descriptor registry is generated at install/update/remove/sync; only the selected
  handler factory boots asynchronously at execution.
- Generation: plugin code returns a host-neutral mutation plan; host owns preview, validation,
  staging, checks, swap, rollback, and deterministic output.
- Manifest evolution: reuse the accepted `.passthrough()` prerequisite and validate the new pointer
  explicitly at generation/doctor time; duplicate-audit #1474 before filing children.

No implementation-forcing question remains open for PLAN-EVAL; `plan.md` records the remaining
policy/FCP choices that are safe to defer.
