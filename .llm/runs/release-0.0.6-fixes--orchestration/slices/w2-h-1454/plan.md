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
- This closes the still-open `cli-plugin-doctor-published-module` debt left by #1022: local and
  copied-source doctor resolution is covered, but a published JSR module is not.
- Direct inspection of the published 0.0.5 packages confirms that both manifests already contain
  their complete top-level permission arrays, and workers already exports `./doctor`. The missing
  truth is lost inside the CLI; it is not absent from the published packages.

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

The same plugin-wide permissions must feed effective runtime resolution:

- explicit appsettings/service permissions remain highest precedence;
- contribution-specific permissions, if present internally, remain next;
- existing `PluginManifest.permissions` becomes the package default for service/plugin and
  background resources;
- global defaults are the final fallback only.

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

## 6. Implementation sequence and gates

1. Add the internal discriminated source contract and a shared configured-specifier classifier;
   preserve exact configured/resolved package specifiers and make local paths local-only.
2. Extend/consolidate the bounded manifest probe so its resolved result carries validated,
   JSON-safe manifest metadata without importing plugin graphs into the CLI process.
3. Normalize local and package metadata through one path; remove the name-only package fallback and
   resolve a package doctor contribution through its public JSR export.
4. Make doctor source-aware, and make its permissions check consume the same effective permission
   precedence as runtime resolution.
5. Feed plugin-wide manifest permissions into service/plugin runtime resolution, retaining explicit
   configuration precedence and the existing background behaviour.
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
