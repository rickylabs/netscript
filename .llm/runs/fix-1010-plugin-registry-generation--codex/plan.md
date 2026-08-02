# Plan: fix public plugin registry generation (#1010)

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-1010-plugin-registry-generation--codex` |
| Branch         | `fix/1010-plugin-registry-generation`        |
| Phase          | `plan`                                       |
| Target         | `packages/cli` public plugin generation/sync |
| Archetype      | `6 - CLI / Tooling`                          |
| Scope overlays | `none`                                       |

## Archetype

Archetype 6 applies because the product surface is the public `netscript` binary and two command
flows. Plugin packages remain generator authorities but their implementation/public surfaces do not
change.

## Current Doctrine Verdict

`@netscript/cli`: **Restructure** — existing CLI debt must not be deepened. Keep the command adapter
thin, use existing `ProcessPort`/`FileSystemPort`, place package/network/process mechanics in an
adapter, and avoid host-side hardcoded plugin identities.

## Axioms in Play

| Axiom | Why it matters                                                                       |
| ----- | ------------------------------------------------------------------------------------ |
| A7    | Reuse Deno subprocess/config behavior and existing ports.                            |
| A8    | Separate command parsing, generation use case, and installed-manifest adapter roles. |
| A10   | Wire adapters at the public composition root.                                        |
| A11   | Installed plugin manifests, not host name switches, are the extension axis.          |
| A13   | Child-process failure and zero-result failure must be explicit.                      |
| A14   | Integration tests must prove non-empty runtime registries.                           |

## Goal

Make `netscript generate plugins` the sole authoritative registry flow, execute every installed
runtime generator under the project's Deno config/cwd, preserve plugin-owned output contracts, fail
on empty runtime results, and make `plugin sync` delegate to it.

## Scope

- Resolve installed package runtime manifests from generic installed metadata.
- Run each declared generator with project cwd and `--config <project>/deno.json`.
- Validate each declared runtime registry is present and non-empty/registrable.
- Make `generate plugins` own output/help and make `plugin sync` delegate.
- Add focused unit/integration coverage plus workers/sagas/triggers clean-install non-empty
  assertions.
- Update user-facing command guidance that still describes sync as a separate generation path.

## Non-Scope

- Plugin generator algorithms or canonical paths/export shapes.
- Stream runtime generation (streams declares no runtime generator).
- Existing CLI restructure debt, plugin uninstall metadata, or general package installation.
- Lockfile/cache regeneration and unrelated published-install dependency defects.

## Hidden Scope

- The public install does not retain `scaffold.runtime.json`; the adapter must resolve the published
  manifest from installed package metadata without a hardcoded official-plugin table.
- `plugin sync` must stop importing project modules in the parent CLI context.
- Dry-run must inspect/describe declared registry outputs without mutating the project.

## Locked Decisions

| ID | Decision                                                                                                                                                                        | Rationale                                                                                                            |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| D1 | `netscript generate plugins` is authoritative.                                                                                                                                  | It is already documented as the registry command and owns generation options.                                        |
| D2 | `plugin sync` calls the same generation use case and does not run the legacy host loader.                                                                                       | Delegation removes duplicate behavior and the parent-process project import defect.                                  |
| D3 | Discover package/version generically from installed runtime metadata, then read that package's published `scaffold.runtime.json`; local package paths use their local manifest. | Honors installed manifests and avoids host-side plugin-name coupling.                                                |
| D4 | Execute the manifest command through existing `ProcessPort` with `cwd=projectRoot` and `deno run --config <projectRoot>/deno.json ...`.                                         | Preserves import map and dependency-age policy in the project context.                                               |
| D5 | Plugin-owned generators remain the sole authority for registry paths and exports.                                                                                               | Runtime loaders already consume those exact outputs.                                                                 |
| D6 | A declared runtime target fails if its registry is missing or contains no registrable imports/entries; the error names the installed plugin.                                    | Satisfies the explicit non-zero acceptance condition without equating plugins with no runtime generator to failures. |
| D7 | Keep the generic walker for item-level commands only; remove it from authoritative generation.                                                                                  | It serves a different SDK discovery contract and cannot reproduce plugin-specific export shapes.                     |

## Open-Decision Sweep

| Decision                        | Status        | Notes                                                                                                                          |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Persistence of install metadata | safe to defer | Existing appsettings/package metadata is sufficient for this scoped fix; a general ownership ledger belongs to uninstall work. |
| AI registry integration         | safe to defer | The generic manifest-driven implementation supports it, but acceptance integration gates workers/sagas/triggers only.          |

## Risk Register

| Risk                                                                 | Mitigation                                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Published file URL/command resolution differs from local packages.   | Model source as a discriminated union and unit-test both; integration-test official public-style descriptors.  |
| Empty validation mistakes header-only output for registrable output. | Validate declared target-specific import/entry content and test empty vs non-empty fixtures.                   |
| `--dry-run` accidentally writes through plugin generators.           | Do not execute generators in dry-run; resolve and report planned target paths only.                            |
| Sync output/backward behavior changes unexpectedly.                  | Parser-level test delegation and help text; retain a concise synchronization completion line after generation. |
| Host hardcodes official plugin names.                                | Quality scanner plus fixture with arbitrary plugin identity.                                                   |

## Anti-Patterns to Resolve or Avoid

| AP    | Status       | Plan                                                                                 |
| ----- | ------------ | ------------------------------------------------------------------------------------ |
| AP-9  | risk         | Do not create a speculative generalized framework; one focused manifest-runner seam. |
| AP-13 | allowed edge | CLI presentation output only.                                                        |
| AP-18 | risk         | Assert parsed/file semantics, not whole generated snapshots.                         |
| AP-23 | risk         | Composition wires dependencies only.                                                 |
| AP-24 | risk         | No switch over worker/saga/trigger identities.                                       |
| AP-25 | risk         | Process/network/filesystem effects stay in adapters or command edge through ports.   |

## Fitness Gates

| Gate                    | Required | Expected evidence                                          |
| ----------------------- | -------- | ---------------------------------------------------------- |
| F-1/F-3/F-10/F-11/F-16  | yes      | `deno task arch:check` and scoped review                   |
| F-5/F-6/F-7             | yes      | JSR audit, doc/check gates, no new export-map surface      |
| F-CLI command structure | yes      | command/parser unit tests and `quality:gate`               |
| Consumer/runtime        | yes      | clean-install integration plus one-pass `scaffold.runtime` |

## Arch-Debt Implications

| Entry                                       | Action | Notes                                                       |
| ------------------------------------------- | ------ | ----------------------------------------------------------- |
| `packages/cli` existing Restructure verdict | none   | Scoped vertical feature edit; no new/deepened debt planned. |

## Commit Slices

| # | Slice                                                                                                                          | Gate                                                                               | Files                                                                                                               |
| - | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | Introduce manifest-driven registry generation use case/adapter and prove project config, canonical targets, and empty failure. | targeted generate tests + scoped check                                             | `packages/cli/src/public/features/generate/plugins/**`, public dependency composition, focused tests, run artifacts |
| 2 | Delegate `plugin sync`, update user-facing help/docs, and prove clean workers/sagas/triggers registries.                       | targeted plugin/generate tests + integration tests                                 | plugin host command/group tests, CLI docs/help assets, integration fixture/tests, run artifacts                     |
| 3 | Final gates and evaluator fixes.                                                                                               | all requested gates, quality/arch, one-pass `scaffold.runtime`, separate IMPL-EVAL | owned fixes and run artifacts only                                                                                  |

## Validation Plan

| Order | Gate             | Command or check                                                                                  | Expected result                               |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1     | Check CLI        | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | exit 0                                        |
| 2     | Check plugin     | same wrapper with `--root packages/plugin`                                                        | exit 0                                        |
| 3     | Lint CLI         | scoped lint wrapper                                                                               | exit 0                                        |
| 4     | Target tests     | `deno test -A packages/cli/src/public/features/generate packages/cli/src/public/features/plugins` | exit 0                                        |
| 5     | Doctrine quality | `deno task quality:gate`                                                                          | exit 0 or attributable pre-existing debt only |
| 6     | Full runtime     | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                | raw exit 0, once                              |
| 7     | IMPL-EVAL        | separate Qwen evaluator session                                                                   | `PASS`                                        |

## Deferred Scope

- General installed-plugin ownership ledger and uninstall support.
- Adjacent dependency/template defects not required for registry generation or project-context sync.

## Drift Watch

- Installed metadata cannot identify package source generically.
- Plugin generator output cannot be validated without plugin-specific knowledge.
- Current source no longer reproduces the parent-process import failure after delegation.

## Follow-up Plan — AI chat-route registry regression (2026-08-02)

### Finding and scope

The previously deferred AI integration decision is reopened because the merge-readiness runtime
suite now reaches and fails `behavior.ai-chat-route`. The affected surface remains Archetype 6:
the CLI's manifest-driven installed-runtime generation and its E2E gate. No public export or
`deno.json` surface change is planned.

### Locked decisions

1. Make the AI behavior gate explicitly capture subprocess output and provide an actionable failure
   hint; do not weaken its route, tool-resolution, or handler-call assertions.
2. Reproduce from an existing scaffold artifact or a minimal local-source project before changing
   generation behavior, and record the exact import/runtime error.
3. Fix the manifest-driven generation path or AI generator contract proven responsible. Plugin
   manifests remain the authority; no host-side AI name switch is allowed.
4. Add executable integration evidence by importing generated AI registries and asserting resolved
   `Map` entries.
5. Keep the change internal. If no export map changes, JSR surface review is `no surface change` and
   publish-shape mutation gates are unnecessary.

### Commit slices

| # | Slice | Proof |
| - | ----- | ----- |
| 1 | Explicit AI gate capture and failure hint | E2E gate-definition test/check |
| 2 | Root-cause generation fix plus imported-registry regression | focused generate/plugins tests |
| 3 | Harness evidence and requested static/quality gates | scoped wrappers + `quality:gate` |

### Evaluator waiver

The owner waived the open-model Plan-Gate on 2026-08-01 and assigned PLAN-EVAL/IMPL-EVAL to the
supervisor. This implementation session proceeds without creating or modifying `plan-eval.md`.

## Follow-up Plan — rebase onto current main (2026-08-02)

1. Preserve the two untracked supervisor briefs and fetch `origin`.
2. Rebase the branch onto `origin/main`. Resolve only generated asset conflicts by taking merged
   sources and running `gen:assets-barrel`; stop on any unexpected non-generated conflict.
3. Verify the AI `skill-loader.ts` exclusion and the adjacent 0.0.3 changes both survived.
4. Run the scoped check, quality, focused registry tests, and one cleanup-enabled
   `scaffold.runtime` pass. Read and record its summary and named behavior gates.
5. Verify no AppHost/container residue, commit the rebase evidence, then force-push with lease and
   prove local/remote SHA equality.

The owner-waived supervisor evaluator route remains in force; no evaluator tool or evaluator
artifact is used by this session.

## Follow-up Plan — scaffold workspace manifest resolution (2026-08-02)

### Evidence and locked direction

The retained scaffold at `.llm/tmp/cli-e2e/plugin-smoke-20260802-005521/deno.json` proves the
resolution asymmetry: its workspace includes `./plugins/*`, while its imports map has local runtime
entries for workers and triggers but no `@netscript/plugin-ai` entry. The current resolver inspects
only imports, so it cannot discover the local `plugins/ai` workspace member and incorrectly falls
back to the published 0.0.2 manifest.

1. Move AI failure capture/hint from durable CLI parity to `behavior.ai-chat-route`, preserving all
   behavior assertions.
2. Extend the existing adapter resolver to inspect declared workspace members as well as local
   imports. Match member `deno.json`/`deno.jsonc` `name` exactly; do not hard-code plugin identities
   and do not introduce filesystem effects outside `FileSystemPort`.
3. Add a scaffold-shaped AI regression with `./plugins/*`, no local AI import, and a local
   `@netscript/plugin-ai` member. Execute the real generator, import the resulting tool registry,
   and assert its resolved `Map` contains the real tool but excludes scaffold glue. Also assert the
   published manifest fetch is never called.
4. Preserve the published fallback for JSR-only projects and the loud invalid-definition throw.

### Commit slices

| # | Slice | Proof |
| - | ----- | ----- |
| 1 | Correct AI gate diagnostic placement | gate-definition test + scoped check |
| 2 | Generic workspace-member resolution and scaffold-shaped AI loading test | focused generate/plugins tests |
| 3 | Harness evidence, required quality/runtime gates, teardown state, and push proof | requested commands and raw logs |

### Surface and JSR review

The change remains internal to the CLI adapter and E2E/test surfaces. No plugin export map,
`deno.json` public surface, or published asset is changed; the existing AI manifest correction is
retained unchanged. The JSR-audit result for this follow-up is therefore `no new public surface`.

The owner-waived supervisor evaluator route remains in force. This session will not launch or
fabricate an evaluator artifact.

## Follow-up Plan — merge current main and push (2026-08-02)

1. Preserve untracked supervisor briefs and fetch `origin`.
2. Merge `origin/main` without rewriting history. Stop on any unexpected non-generated conflict.
3. Resolve the expected generated `skills.generated.ts` conflict exclusively by regenerating from
   the cleanly merged `skills/**` sources with `gen:assets-barrel`, then verify the generated asset.
4. Explicitly check the five carried invariants: Aspire-first safe skill text, emitted-samples add
   coverage, all-box acceptance evidence, forwarded-argument separator stripping, and the AI skill
   loader exclusion.
5. Run the four requested gates, record raw evidence and final Aspire/Docker state, commit harness
   evidence if needed, push normally, and prove local/remote SHA equality.

This merge changes no planned public export or `deno.json` surface, so JSR audit is not activated
unless conflict resolution reveals such a change. The owner-waived evaluator route remains in
force; no evaluator artifact will be created.
