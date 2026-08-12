# W2-H plan — package-backed plugin doctor truth (#1454)

Status: **PLAN only. No implementation is authorized until PLAN-EVAL returns PASS and the
orchestrator explicitly says to proceed.**

## Research baseline

- Branch `fix/1454-plugin-doctor-package-backed` is clean at the requested pinned base
  `3c9dc1f39`. `origin/main` has advanced, but the intervening changes are unrelated Fresh work; the
  relevant CLI/plugin files have not moved. Phase 2 will re-sync with `main` before draft → ready.
- Primary archetype: CLI / Archetype 6, because this changes a public diagnostic, its exit code, and
  the scaffold E2E surface. Folded concern: plugin / Archetype 5, because doctor consumes published
  plugin manifests and a published doctor adapter. Doctrine status is **Restructure** for
  `packages/cli`, **Refactor** for `plugins/workers`, and **Keep** for `plugins/streams`.
- This is intended to close the still-open `cli-plugin-doctor-published-module` debt left by #1022:
  local and copied-source doctor resolution is covered, but a published JSR module is not. The
  exact close-out gate and evidence location are locked in the open-decision sweep below.
- Direct inspection of the published 0.0.5 packages confirms that both manifests already contain
  their complete top-level permission arrays, and workers already exports `./doctor`. The missing
  truth is lost inside the CLI; it is not absent from the published packages.
- Gate coverage is measured against the named **Archetype Gate Matrix — ARCHETYPE-5 (Plugin
  Package)** requirements, including F-5 public surface, F-6 JSR publishability, F-7 doc score, F-9
  permission declarations, required runtime validation, and required consumer import validation.
  Published-surface safety is measured against the named **JSR Publishing Audit (`jsr-audit`)
  rubric — 9 Scoring Factors and Audit Checklist**, including the full export map, module/symbol
  documentation, slow types, publish contents, description, and runtime compatibility.

## 1. Current behaviour

### Source/workdir conflation

1. `loadRegisteredPluginMetadata()` loops over configured plugin specifiers in
   `packages/cli/src/kernel/adapters/config/plugin-registry.ts:241`. Its local scaffold metadata
   resolver immediately returns `null` for any specifier that is not `.`-relative or absolute at
   `plugin-registry.ts:273-279`.
2. The resulting package fallback, `normalizePluginSpecMetadata()` at
   `plugin-registry.ts:354-367`, retains only a name and manufactures `workdir`/`rootDir`.
   `resolvePluginWorkdirFromSpec()` at `plugin-registry.ts:390-404` maps every non-filesystem
   specifier to the conventional `paths.plugins/<name>` directory. It does not preserve how the
   plugin was configured or resolved.
3. `RegisteredPluginConfig` requires `workdir` and `rootDir` and has no source discriminator at
   `packages/cli/src/kernel/domain/resolved-config.ts:153-170`, so downstream code cannot represent
   “package-backed, no local workdir contract.”
4. Doctor unconditionally calls `checkWorkdir()` for every normalized plugin at
   `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts:236-264`.
   `checkWorkdir()` then probes the manufactured path and emits the warning at
   `doctor-plugin-use-case.ts:524-536`.

The configured-module probe does import the real configured module in a bounded child, but its
`resolved` result contains no manifest data (`configured-plugin-manifest-probe.ts:9-16`), and the
child deliberately returns only `{ status: "resolved" }`
(`configured-plugin-manifest-probe-child.ts:30-33`). Doctor therefore proves that the package module
exists, then discards the very manifest that would describe it.

### Permission and generated-registry truth

- The ordinary manifest loader already preserves `PluginManifest.permissions` in
  `plugin-registry.ts:494-518`, but doctor does not use that path for a package specifier. Its
  metadata fallback above drops permissions and the doctor contribution.
- Doctor reads only `RegisteredPluginConfig.permissions` at
  `doctor-plugin-use-case.ts:539-546`, so workers and streams both become the false warning “No
  plugin permissions declared.”
- Workers declares the six effective service/runtime flags at
  `plugins/workers/src/public/mod.ts:26-33` and contributes them with `.withPermissions(...)` at
  `plugins/workers/src/public/mod.ts:54-62`. Streams does the same at
  `plugins/streams/src/public/mod.ts:19-26` and `plugins/streams/src/public/mod.ts:38-45`.
- The deployment split is also inconsistent: background resolution already falls back to the
  plugin-wide permissions (`packages/cli/src/kernel/adapters/config/deploy-config-background.ts:91-112`),
  while service/plugin resolution only consults `plugin.service.permissions` and otherwise falls
  back to global defaults (`deploy-config-resolvers.ts:175-209`). Thus streams' published
  plugin-wide permissions do not become the effective service permissions unless users duplicate
  them in appsettings.
- The real workers generated-registry checks live in its contributed doctor adapter
  (`plugins/workers/src/adapter/plugin.ts:60-115`). Workers contributes that adapter at
  `plugins/workers/src/public/mod.ts:109-110`, and the package already publishes a `./doctor`
  subpath (`plugins/workers/deno.json:6-13`). Because the package metadata fallback drops the
  contribution and gives it a fake root, those checks never run for a clean package-backed
  consumer.

## 2. Proposed source discriminator

Introduce a CLI-internal discriminated source contract before changing behaviour. In outline:

```ts
type RegisteredPluginSource =
  | { kind: 'local-workdir'; configuredSpecifier: string; rootDir: string; workdir: string }
  | { kind: 'package'; configuredSpecifier: string; resolvedSpecifier: string };
```

`RegisteredPluginConfig` will carry this source, and local-only paths will either live on the local
variant or be optional behind it. One shared classifier will be used by config loading and doctor:

- explicit relative paths, absolute paths, and `file:` URLs are **local-workdir**;
- bare/import-map specifiers, `jsr:`, `npm:`, and network module specifiers are **package-backed**.

That discriminator is the configured installation contract, not a filesystem heuristic. The
bounded child will also report the effective resolved module specifier so JSR package subpaths can
be formed and checked, but a cache/workspace resolving a package to `file:` does not silently turn
it into a local-workdir installation. Module resolution and module-manifest checks remain separate
doctor invariants.

If a plugin is configured from JSR (or through a bare alias targeting JSR) and a conventional local
directory also exists, **package-backed wins and that incidental directory is ignored**. A user who
wants the directory contract must configure an explicit filesystem specifier. This precedence is
covered by a test with a real incidental directory; presence/absence of that directory must not
change the result.

Doctor will run `Workspace directory` only for `local-workdir`. For a package-backed plugin, the
configured-module checks are the source/resolution proof; doctor will not invent a local path or
turn “not applicable” into a warning.

## 3. Permission metadata and published surface

The authoritative permission metadata remains the existing public `PluginManifest.permissions`
field. The bounded manifest child will return a JSON-safe normalized manifest summary (name,
version, permissions, service contribution, and doctor contribution), and the doctor metadata path
will consume that summary instead of replacing a resolved package with name-only fallback data.
The import stays out of the CLI process, preserving the isolation repair from #1022.

### Canonical effective-permission precedence (LOCKED)

This is the single authoritative chain for the plan; every later reference to “permission
precedence” means exactly:

```text
explicit appsettings/service cfg.Permissions
  > pluginService.permissions
    > plugin.permissions
      > global defaults
```

An absent slot is skipped. The existing `PluginManifest.permissions` therefore becomes the package
default for service/plugin and background resources without displacing either an explicit user
override or a contribution-specific permission declaration.

Doctor's permission check will report the exact effective set selected by that same precedence,
not merely the existence of a duplicate config field. Workers' package-backed doctor contribution
will be normalized to its already-published, versioned JSR `./doctor` export and executed so the
generated registry is checked. A package declaring a doctor contribution without a resolvable
public doctor export is an error, not a skipped check. Streams has no contributed doctor adapter;
its permission truth is covered by the generic effective-permission check.

**Published-surface answer:** this plan adds no `PluginManifest` field, no permission field, and no
new workers/streams export. The packages already publish the required permission arrays and workers
already publishes `./doctor`; the fix transports and consumes those contracts correctly. The
internal `RegisteredPluginSource` is not a package API. The observable CLI output/exit behaviour is
still a user-facing behavioural contract and requires CLI contract tests and E2E evidence. If
implementation discovers that a new public manifest field or export is actually necessary, that is
significant doctrine drift: stop, record it, and return for rescope/PLAN-EVAL rather than adding it
opportunistically.

Against the **Archetype Gate Matrix — ARCHETYPE-5** and the **JSR Publishing Audit (`jsr-audit`)
rubric**, this is a no-delta published manifest/export design: it adds no entrypoint, public symbol,
documentation obligation, inferred export, or slow-type risk. F-5/F-6/F-7/F-9 remain enforced by
the existing public-surface, JSR, documentation, and permission gates; the composite consumer E2E
supplies the matrix's required runtime and consumer validation. If Phase 2 touches a plugin public
file despite this plan, the slice must run the rubric over the full affected export map with
doc-lint, the JSR audit, and publish dry-run evidence, or stop for rescope if the surface changed.

## 4. Scaffold E2E design, including demonstrated failure

Add one critical composite gate, tentatively `behavior.package-backed-plugin-doctor`, using the
public CLI against a suite-owned generated consumer. The fixture will:

1. configure workers and streams through exact published JSR package specifiers (or generated bare
   aliases whose resolved targets are asserted to be JSR), with workspace substitution disabled;
2. assert before running doctor that neither `plugins/workers` nor `plugins/streams` exists;
3. add a real worker job in the consumer's canonical `workers/jobs` input directory;
4. run the real package runtime-registry generation path and assert the generated workers registry
   exists, is non-empty, and names that job;
5. run `netscript plugin doctor` and capture the raw exit code and output;
6. assert exit 0; exact workers and streams effective permission sets; healthy configured-module
   checks; healthy workers generated-registry checks; and absence of the fake workspace-directory
   warnings; and
7. inspect the generated runtime/AppHost configuration to prove the same package permissions, not
   global fallbacks or duplicated fixture metadata, are what the runtime receives.

This will use a dedicated semantic verifier rather than only `stdoutIncludes`: it will fail on a
wrong exit code, a missing expected check, a forbidden warning, a missing generated artifact, an
empty registry, a substituted local workspace module, or permission drift. The fixture will contain
no copied plugin workdir and no permission declaration outside the published manifests.

The failure mode will be executed, not inferred:

- First, land the gate code before the product fix and run the focused gate against the current
  branch baseline. It must be **red** for the existing false workdir/permission/doctor behaviour.
- After the fix goes green, deliberately break the package metadata transport at the narrow seam
  (drop the imported manifest permissions, or classify the JSR fixture as local). The same focused
  gate must return non-zero with the expected semantic assertion. Capture untruncated red output and
  exit status in `evidence.md`.
- Restore the break with the inverse patch, re-run green, and prove restoration with a path-scoped
  diff against the pre-break commit plus a final full worktree diff. No break will be made by adding
  or deleting fake fixture directories, so there is no fixture state to accidentally normalize.

Unit/contract tests will separately cover: explicit local missing directory still warns; package
specifier with no local directory is healthy; package specifier plus incidental local directory is
still package-backed; published manifest permissions survive the bounded child; streams service and
workers background resolve the manifest permission sets; the public workers doctor export runs;
and warning/error aggregation produces the truthful exit code.

## 5. E2E placement and cost

Register the composite gate in `scaffold.plugins`, whose documented boundary is plugin scaffold,
registry generation, and host diagnostics (`packages/cli/e2e/README.md:42-46`), and include the same
gate in `scaffold.runtime` before Aspire startup. This makes it available as a focused debugging
gate while keeping it in the serialized merge-readiness verdict. The existing placement points are
`PLUGIN_GATES` and `RUNTIME_GATES` in
`packages/cli/e2e/suites/scaffold/capability-suites.ts:50-140,155-172`.

The gate adds no container or Aspire start. Budget is roughly 30–90 seconds with a warm JSR cache
and up to about two minutes cold for exact package resolution, generation, and two doctor module
probes. The full `scaffold.runtime` remains roughly a five-minute serialized run, plus this increment.
In Phase 2 I will ask the orchestrator before taking the serialized slot, run the focused gate while
iterating, and run the required one-pass
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` only when the slot is granted.

## Risk register

| Risk | Mitigation | Owning slice |
| --- | --- | --- |
| **Type-breaking `RegisteredPluginConfig` migration.** `workdir` and `rootDir` are required today, while the proposed source union makes them local-only. Direct readers include `deploy-config-background.ts:99-103`, `deploy-config-resolvers.ts:197-201`, `doctor-plugin-use-case.ts:524-536`, and `list-plugins-command.ts:47-60,110-115`; unit fixtures in `plugin-registry.test.ts:21-302` encode the required-field shape. E2E topology assumptions also live in `packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts:122-155` and the local/published split in `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts:20-145`. | Slice 1 must enumerate every `RegisteredPluginConfig.workdir`/`rootDir` reader, select the guarded representation, and add a test that fails when the package variant is passed through a local-only caller. It must explicitly record whether each E2E assumption remains local-only; Slice 6 updates the new package-backed fixture. Type-check is the migration gate before Slice 4 consumes the source. | Slice 1 (inventory, representation, failing package-variant test); Slice 6 (E2E fixture) |
| **Runtime permission behaviour changes.** Adding manifest permissions to the effective chain changes the permissions users actually receive, so it is not metadata-only plumbing. | Lock the chain in §3 with precedence tests for every occupied/absent slot. Add a `packages/cli/CHANGELOG.md` 0.0.6 entry. Doctor must emit a warning when the effective manifest/contribution permission set differs from a user-overridden `cfg.Permissions`, while preserving that override as highest precedence. | Slice 4 (doctor warning); Slice 5 (runtime chain, precedence tests, CHANGELOG) |
| **Package source beats an incidental local directory.** Users relying on implicit workspace substitution could observe a different diagnostic and source choice. | Test both directory-present and directory-absent package cases. Explain the explicit-filesystem opt-in in CLI help/`packages/cli/README.md`, emit a package-backed/no-local-workdir message in doctor output, and include the behaviour in the 0.0.6 CHANGELOG/release notes. | Slice 4 (help/output); Slice 5 (release note) |
| **Permission-precedence contradiction.** The original plan's prose retained `pluginService.permissions` while sequence step 5 elided it, risking an implementation that skipped a contract slot. | Resolved by the single canonical chain in §3. All doctor/runtime code and tests point to that chain; sequence step 5 explicitly preserves `pluginService.permissions`. Any different ordering is plan drift and stops the slice. | Resolved in this plan amendment; enforced by Slices 4 and 5 |

## Open-decision sweep

| Decision | Status | Required resolution/evidence |
| --- | --- | --- |
| **Bounded-probe surface contract:** the exact JSON schema, validation rules, and error/failure envelope for carrying manifest metadata are not yet pinned. | **must-resolve-in-slice-2** | Slice 2 defines one versioned/internal result union covering resolved metadata, missing/ambiguous manifest, import failure, timeout, non-zero exit, and malformed payload; parser/child parity tests must fail on an invalid envelope before Slice 3 consumes it. |
| **`RegisteredPluginConfig.workdir` migration:** whether local fields move entirely onto the discriminated source or remain optional compatibility projections, and how every caller is guarded. | **must-resolve-in-slice-1 (and before slice 4)** | Use the caller inventory in the risk register, select one representation, and make the package-variant test plus scoped type-check fail if any local-only caller dereferences an unguarded field. |
| **#1022 debt close-out:** the debt may close only when published module resolution, adapter execution, and consumer truth are demonstrated rather than asserted. | **must-resolve-in-slice-7** | The exact closing gate is `behavior.package-backed-plugin-doctor`, registered in both `scaffold.plugins` and `scaffold.runtime`. Its focused red → green logs and the granted one-pass `scaffold.runtime` result are recorded untruncated in this slice's `evidence.md` and linked in the PR Phase 2 comment; only then may Slice 7 update the `cli-plugin-doctor-published-module` row in `.llm/harness/debt/arch-debt.md`. |

There are no remaining **safe-defer** decisions for #1454. A new public manifest field/export, a
different permission order, or a probe envelope deferred past its owning slice is rescope, not an
implementation choice.

## 6. Implementation sequence and gates

1. Add the internal discriminated source contract and a shared configured-specifier classifier;
   preserve exact configured/resolved package specifiers and make local paths local-only.
2. Extend/consolidate the bounded manifest probe so its resolved result carries validated,
   JSON-safe manifest metadata without importing plugin graphs into the CLI process.
3. Normalize local and package metadata through one path; remove the name-only package fallback and
   resolve a package doctor contribution through its public JSR export.
4. Make doctor source-aware, and make its permissions check consume the same effective permission
   precedence as runtime resolution.
5. Implement the canonical §3 chain in service/plugin runtime resolution, explicitly preserving
   the `pluginService.permissions` slot between explicit `cfg.Permissions` and `plugin.permissions`;
   retain the existing background behaviour for absent slots.
6. Add focused unit/contract tests, then the fail-closed composite E2E and its red → green proof.
7. Update/close the #1022 architecture-debt entry only when the published-package gate proves the
   debt's stated acceptance; record any design drift in the slice artifacts.

Phase 2 validation will use the requested commands and retain untruncated logs in `evidence.md`:

```text
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

The focused E2E runs for red/green iteration; the serialized `scaffold.runtime` runs only with the
orchestrator's slot. Lock neutrality and the forbidden-pattern diff scan are explicit evidence
checks. No `deno.lock`, cache reload, lint suppression, `@ts-ignore`, or unsafe double cast is in
scope.

## What this plan will not do

- It will not create `workers/`, `streams/`, `plugins/workers`, or `plugins/streams` merely to make
  doctor quiet. A real worker job input is allowed because it is runtime input, not a fake plugin
  installation.
- It will not duplicate published permissions into the consumer fixture, appsettings, or local
  scaffold metadata.
- It will not weaken a warning/error, skip an adapter, or broaden a fallback so the command exits
  zero. Package resolution, manifest export, permission truth, generated registry truth, and exit
  status remain independently fail-closed.
- It will not make filesystem presence decide the source kind.
- It will not add a new expensive suite that is absent from the merge-readiness schedule, nor rely
  on a gate whose red path was not run and preserved as evidence.
- It will not merge the PR or proceed to implementation before PLAN-EVAL PASS and explicit
  orchestrator authorization.
