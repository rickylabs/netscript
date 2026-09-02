# S3 Plan: move official discovery axes out of generic plugin core

## Status and Baseline

This is the pre-implementation design checkpoint required by the S3 brief. Implementation is
blocked pending supervisor review of this plan.

| Field | Value |
| --- | --- |
| Issue / PR | `#1093` / `#1850` |
| Branch | `fix/plugin-discovery-contribution-seam` |
| Exact planning head | `7d1026a0328906ae8319b9cf32ad58e1c45c8240` |
| Integrated `origin/main` | `38f2ce7358f80e4075c481b450b52e1a01c5984c` |
| Lock SHA-256 | `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe` |
| Lock comparison | byte-identical to `origin/main` at planning time |
| Phase | S3 plan; hard stop before implementation |

The pre-existing untracked `implement-s3.md` supervisor brief is preserved and is not an S3 output.

## Architecture and Doctrine

The affected published SDK remains **Archetype 4 — Public DSL / Builder**: `@netscript/plugin/sdk`
owns the typed `ContributionBuilderPattern`, the immutable `AstExtractorOptions` seam, and the
generic extraction grammar. The three first-party connectors are **Archetype 5 — Plugin Package**:
they compose that generic grammar by declaring their own factory-to-axis patterns in their existing
install adapters. The quality scanner is repository tooling; the two inspected CLI composition
roots remain read-only and do not acquire plugin-specific imports or branches.

The controlling rules are A1, A2, A10, A11, and A14; doctrine 07's plugin-loading rule that a loaded
plugin contributes a named registration; AP-11/AP-25's rejection of global or load-time registration;
and AP-24's rejection of core dispatch over closed plugin variants. The anti-pattern removed here is
the generic host/core package naming the factories and axes owned by specific plugins.

No new or deepened architecture debt is planned. `PLG-WALKER-AST` remains open: S3 extends the
existing bounded static extractor grammar and does not claim TypeScript symbol resolution.

## Design

### D1 — Transport is a plugin-owned, in-band static source declaration

Each official plugin's existing install adapter will emit a conventional declaration in the
control-plane module it already owns:

```ts
export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineSaga', axis: 'sagas' },
] as const;
```

The workers and triggers variants use their own mappings. This is static TypeScript data, not a
module-evaluation side effect. It adds no manifest field and imports no plugin into the CLI. It also
adds no package dependency edge: the generated declaration is structurally inferred and does not
import `ContributionBuilderPattern` merely for `satisfies` syntax.

`AstExtractor.extract(files)` will use the `WalkedFile` inputs it already owns in two deterministic
passes:

1. collect and validate every top-level `NETSCRIPT_CONTRIBUTION_BUILDERS` declaration;
2. combine those declarations with the constructor's immutable `additionalBuilders` snapshot, then
   extract contribution calls.

Declaration discovery is independent of file order. A present-but-malformed declaration, a blank
axis, an invalid callee, or a duplicate callee across plugins/options fails loudly with `TypeError`.
There is no mutable global registry, plugin import, dynamic module execution, or load-order behavior.

The declaration convention is generic: a third-party plugin may emit the same control-plane
declaration without any edit to `packages/plugin` or `packages/cli`. The existing explicit
`additionalBuilders` seam remains available and unchanged for direct SDK composition.

### D2 — `defineJob -> jobs` moves with the other official mappings

All three rows leave `DEFAULT_CONTRIBUTION_BUILDERS`; the constant is deleted rather than retained
as a fallback:

- workers declares `defineJob -> jobs`;
- sagas declares `defineSaga -> sagas`;
- triggers declares `defineWebhook -> triggers`.

Workers is not architecturally different from sagas or triggers. Leaving its row in generic core
would retain the same plugin-specific dependency and force the guard to encode an exception. The
acceptance text names sagas/triggers as the minimum, not as permission to preserve an inconsistent
workers special case.

### D3 — The shipped extension seam is preserved, not redesigned

`ContributionBuilderPattern`, `AstExtractorOptions.additionalBuilders`, constructor snapshotting,
duplicate/malformed validation, deterministic contribution sorting, and `startWalker(root,
options?)` remain. S3 changes the source of the no-options mappings from a core default table to
walked plugin declarations. Caller-provided patterns extend walked declarations and never replace
or mutate them.

No new exported SDK type or function is planned. The generated declaration convention and revised
no-argument behavior will be documented in `packages/plugin/README.md`; `deno doc` must show the
existing public signatures unchanged.

### D4 — No-argument CLI consumers receive declarations through `WalkedFile`

Both current CLI consumers remain generic and continue constructing `new AstExtractor()`:

- plugin list walks the project before extraction;
- registry item add/update receives the existing `FilesystemWalker` plus no-argument extractor.

An installed official plugin already owns and emits `<plugin>/plugin.ts`. After S3 that walked file
carries its static declaration, so neither CLI composition root needs a named plugin import, mapping,
or conditional. `startWalker(root)` follows the same path and is the focused compatibility oracle.

The compatibility boundary must be explicit: a hand-built `WalkedFile[]` containing only factory
calls and no declaration is no longer an official-default registration. Such callers must include
the conventional declaration file or pass `additionalBuilders`. Likewise, projects installed before
S3 must run the normal plugin update/sync path to regenerate their control-plane modules before the
new no-argument transport is present. Retaining a hidden core fallback for old generated files would
make box 2 cosmetic and is therefore rejected. The supervisor accepted this migration boundary with
the mandatory fail-loud diagnostic below.

The migration failure is fail-closed, never silent. If the extractor recognizes a direct exported
contribution-factory call but no effective declaration assigns that callee an axis, extraction throws
a `TypeError` naming the callee, stating that no plugin declared its axis, and prescribing either
plugin sync/update or an explicit `additionalBuilders` mapping. A walk with no recognizable factory
call sites remains a valid empty result. The RED suite must distinguish these two cases.

### D5 — Box 5 is enforced by the required quality gate

Extend `.llm/tools/quality/scan-code-quality.ts` with a generic structural rule over production
`packages/**`, excluding plugin-specific owner packages matching `packages/plugin-*-core/**`.
The rule does not list today's plugin names. It flags:

1. a core mapping object that binds string literals through both `callee` and `axis`; and
2. control-flow dispatch (`if`, conditional, `switch`/`case`, or equivalent predicate) that compares
   a `callee` or contribution `axis` discriminant to a string literal.

The RED guard test plants an arbitrary future example—not one of today's three—in a temporary
generic core path, such as:

```ts
if (builder.callee === 'defineExample') return 'examples';
```

The current scanner must miss it, making the new test fail. GREEN requires a
`plugin-name-check`/dedicated discovery-coupling finding at that file and line; the scanner CLI must
exit nonzero. A companion table fixture proves that restoring the current table shape also fails.
Plugin-owned declarations under `plugins/**` remain allowed.

This is a bounded static guard, not a TypeScript data-flow engine. It catches direct literal
branches/tables, multiline token shapes, and same-expression predicates. It cannot prove coupling
hidden behind encoded strings, cross-file aliases, computed property names, or arbitrary helper
data flow; those remain within `PLG-WALKER-AST`/future compiler-backed fitness scope. Using an
arbitrary planted factory rather than today's strings prevents the guard from being a three-name
snapshot.

### D6 — No manifest, config-path, or forbidden dependency rescope is selected

The chosen transport does **not** change the installer manifest schema, runtime `PluginManifest`,
`packages/config` path constants, `ExtractorPort`, `WalkerPort`, or package import graph. The CLI
does not import `plugins/workers`, `plugins/sagas`, or `plugins/triggers`. Therefore none of the
brief's mandatory hard-stop conditions is triggered by the proposed design.

### D7 — Corpus regeneration is canonical but incidental to the S3 surface

S3 plans no additional published export. The existing S2 SDK exports already stale the generated
MCP corpus, and clean `main` has the separately filed deterministic #1873 staleness. After the code
slices, run `deno task gen:mcp-export-corpus` and commit only
`export-surface-corpus.generated.ts`; then require `deno task check:mcp-export-corpus` exit 0.

The PR body will say that #1850 incidentally clears the deterministic corpus staleness reported by
#1873. It will not claim that #1873's missing-workflow/CI-gating half is fixed.

### D8 — PR and evaluation state remain supervisor-controlled

After implementation, update PR #1850 in place. Preserve its correction section, preserve
`Closes #1093`, add evidence that boxes 2 and 5 are now implemented, reference #1873 narrowly, and
leave every DoD/acceptance checkbox unticked for supervisor mirroring. Do not edit issue #1093; report
its stale older mirror comment. Do not mark ready, merge, or self-certify. A fresh separate-session
exact-head IMPL-EVAL is mandatory because the previous verdict predates S3.

## Locked S3 Write Ceiling Proposed for Authorization

The expected ceiling is narrowed where inspection proved no edit is needed and expanded where the
selected transport and RED proofs require it. Exact product/test/tool/generated paths:

1. `packages/plugin/src/sdk/discovery/ast-extractor.ts`
2. `packages/plugin/tests/sdk/walker-ports_test.ts`
3. `packages/plugin/README.md`
4. `plugins/workers/src/adapter/plugin.ts`
5. `plugins/workers/src/adapter/resources/resources.test.ts`
6. `plugins/sagas/src/adapter/plugin.ts`
7. `plugins/sagas/src/adapter/resources/resources.test.ts`
8. `plugins/triggers/src/adapter/plugin.ts`
9. `plugins/triggers/src/adapter/resources/resources.test.ts`
10. `.llm/tools/quality/scan-code-quality.ts`
11. `.llm/tools/quality/scan-code-quality_test.ts`
12. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`

Run records under `.llm/runs/fix-plugin-discovery-contribution-seam--0.0.7/**` remain allowed and
must be preserved. `deno.lock` is excluded and must retain the planning hash above.

The following expected-ceiling paths are confirmed **read-only regression surfaces**, not S3 write
targets:

- `packages/plugin/src/sdk/presets/start-walker.ts` — already forwards the unchanged options seam;
- `packages/cli/src/public/features/plugins/list/list-plugins-command.ts` — its no-argument extractor
  receives in-band declarations from the existing walk;
- `packages/cli/src/public/features/root/public-command-dependencies.ts` — remains a generic
  composition root with no plugin imports or mappings.

Expansions beyond the brief's expected examples are workers (D2 consistency), the existing SDK test
and README (behavioral/public convention proof), and exact resource tests for all three plugin-owned
declarations. No implementation may begin until the supervisor accepts this exact ceiling.

## RED -> GREEN Commit Slices

### S3.1 — Plugin-owned declaration transport

**RED commit, tests only:**

- add an in-band synthetic declaration/no-options extractor test;
- change the official no-options/start-walker oracle to require walked declarations and preserve the
  same emitted registry paths;
- assert each plugin's generated control-plane module contains its own exact mapping;
- compile first, then demonstrate real behavioral failures against unchanged S2 product code.

**GREEN commit:** remove the three defaults, implement declaration collection/validation, emit the
three plugin-owned declarations, document the convention, and make all S3.1 tests pass. The explicit
third-party `additionalBuilders` tests from S2 must remain green unchanged.

### S3.2 — Generic core-coupling guard

**RED commit, test only:** plant arbitrary branch and table fixtures in a temporary generic core
tree and prove the current scanner returns no required finding / exits zero.

**GREEN commit:** implement the structural rule and prove both fixtures fail the scanner while
plugin-owned declarations remain allowed. Run `quality:gate` after this slice.

### S3.3 — Canonical corpus and handoff records

Record the existing committed corpus RED at the exact pre-generation head, run the canonical
generator, commit only the generated corpus plus run/PR evidence, and prove the check exits 0.
No generator or workflow file is in scope.

Every RED is committed alone against unchanged product code. After greenlight, each slice records
the RED/GREEN SHAs, exact wrapper commands, counts, push state, and PR phase comment in `worklog.md`.

## Required Gates and Contracts

Record raw exit codes and structured counts. The coordinator's required minimum is:

```text
deno task quality:gate
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin
deno task arch:check
deno task check:mcp-export-corpus
```

Because S3 touches three Archetype-5 plugins, also run the structured check/lint/fmt wrappers over
`plugins/workers`, `plugins/sagas`, and `plugins/triggers`, plus the focused structured test command
covering the four S3 test files. `quality:gate` remains the full framework verdict; scoped wrappers
are not substitutes.

Carry forward the already measured non-increase contracts from `plan.md`; do not relabel them as
promised greens:

| Gate | S3 contract |
| --- | --- |
| Full export doc-lint | at most 15 private refs; 0 missing JSDoc; 0 other; no S3-owned diagnostic |
| Package JSR audit | no increase from 4 FAIL / 2 WARN / 1 INFO; no S3-owned finding |
| Package publish dry-run | pass with exactly the same two known dynamic-import warnings |
| Doctrine scan | no increase from the last recorded 0 FAIL / 2 WARN / 1 INFO result |
| MCP corpus | current deterministic RED becomes exit 0 after canonical regeneration |
| Lock hygiene | SHA-256 remains `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe` |

Runtime leases, scaffold commands, CLI E2E, Aspire, Docker, and hosted gates remain forbidden in this
implementation session. The coordinator may dispatch hosted/evaluator work separately.

## Risks and Stop Conditions

| Risk | Mitigation / stop condition |
| --- | --- |
| Pre-S3 generated projects lack the declaration | Require plugin update/sync and supervisor acceptance of D4; never hide this with a core fallback. |
| Missing declarations recreate silent discovery failure | Recognizable unmatched factory calls throw with callee plus sync/update or `additionalBuilders` remedy; genuinely empty walks remain quiet. |
| Declaration grammar silently misses malformed data | Detect the conventional export name first; reject any present declaration that cannot be parsed and validated. |
| Two plugins claim one callee | Fail with both declaration file paths in the error; no first-wins behavior. |
| Guard overfits today's factories | Plant arbitrary future names and match structure, not a fixed name list. |
| Guard false-positives plugin-owned core code | Exclude `packages/plugin-*-core/**`; those packages are the named capability owners, not generic hosts. |
| Parser scope expands into symbol resolution | Stop and report; `PLG-WALKER-AST` owns compiler-backed parsing. |
| Manifest/config/dependency change becomes necessary | Hard stop and report before editing, per brief. |
| Any path beyond the 12-path ceiling becomes necessary | Append drift only after supervisor direction; otherwise stop unchanged. |
| `deno.lock` changes | Stop immediately and report the diff; do not commit it. |

## Open-Decision Sweep

| Decision | Status |
| --- | --- |
| How plugin-owned declarations reach no-arg consumers | resolved by D1/D4, pending supervisor acceptance |
| Whether workers moves | resolved: yes, D2 |
| Guard location and assertion | resolved: required quality scanner + guard test, D5 |
| Manifest/schema transport | rejected; hard-stop trigger avoided |
| `packages/config` changes | not required |
| New cross-package dependency | not required |
| Pre-S3 generated-project migration boundary | accepted by supervisor with mandatory fail-loud unmatched-callee diagnostic |
| Fresh IMPL-EVAL | mandatory after exact-head implementation |

No product or test edit is authorized by this document. The next action is supervisor review of the
transport, migration boundary, and exact ceiling.
