# Research — fix-flow-b-fixture-plugin-marker--1863

## Re-baseline

- Carried-in source: issue #1863 and the owner-provided leaf brief.
- Re-derived against `origin/main` @ `3b6386e14bd2176de795dad16fe523f5cd1fbcff` on 2026-09-01.
- The worktree is clean and the branch, `origin/main`, and merge base all resolve to that SHA.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The fixture searches for the removed name-based comment and uses the following comment as its block boundary. | `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts:116` |
| 2 | The plugin generator emits positional comments but retains semantic `addExecutable(name, ...)` and `plugins.set(name, resource)` code. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:64,89,212` |
| 3 | The nested `packages/cli/e2e` workspace is explicitly outside the doctrine root set; the parent `packages/cli` verdict remains Archetype 6 / Keep. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:33,93` |

## jsr-audit surface scan

- N/A: this leaf changes only the nested CLI E2E fixture and focused tests. It changes no package
  export, published type, dependency, permission declaration, or JSR surface.

## Open questions

- None. The brief fixes the ceiling, anchor class, RED/GREEN requirement, and runtime exclusions.

## Stale-consumer sweep (#1863, deliberate read-only, orchestrator)

Command basis: `grep -rn "// --- " packages/cli/e2e/src packages/cli/e2e/tests packages/cli/src --include=*.ts`,
then classification of each hit as *reconstruction consumer* vs *generator-emission assertion*.

| # | Consumer | Keyed on | Generator emits today | State |
|---|---|---|---|---|
| 1 | `prepare-flow-b-fixture.ts` (plugins) | `'  // --- workers-api ---'` | `// --- plugin N ---` (#1837) | **BROKEN → fixed semantically** |
| 2 | `prepare-flow-b-fixture.ts:302` (background) | `'  // --- workers ---'` | `// --- ${name} ---` (`generate-register-background.ts:56`) | latent, **guarded** |
| 3 | `prepare-readiness-fixture.ts:213-214` | `lastIndexOf('  // --- app ')` | `// --- app ${appIndex} ---` (`generate-register-apps.ts:72`) | latent, tolerant — prefix-keyed, survives index changes |
| 4 | `service-environment_test.ts:124` | `lastIndexOf('  // --- plugin ')` | `// --- plugin ${pluginIndex} ---` | already migrated by #1837 |

Not stale consumers (correct by construction — they assert the generator's own output):
`generators-service-plugin_test.ts`, `generators-background-app_test.ts`, `generators-test-support.ts`,
`project-config-ops_test.ts:81` (unrelated `// ---` section banner).

### Consumer 2 — CORRECTION (orchestrator, after coordinator audit)

An earlier revision of this file, and an earlier code comment, claimed consumer 2 could not be made
semantic because `register-background.mts` has "no `plugins.set(...)` registration anchor to pair with
the creation". **That claim was false and is retracted.** The coordinator's audit was correct.

`generate-register-background.ts` emits the same two-anchor shape as the plugins generator:

- creation, `:111` — `const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, [...])`
- registration, `:237` — `backgroundProcessors.set('${name}', ${id});`

The only differences from the plugins generator are the registry variable (`backgroundProcessors`
rather than `plugins`) and that the resource identifier is derived via `safeIdentifier(name)` rather
than the literal `resource`. Neither prevents a semantic locator.

Consumer 2 has therefore been **migrated**, not documented-around, and the coupling guard that existed
only to justify not migrating it has been removed. `prepare-flow-b-fixture.ts` now contains **zero**
comment-keyed locators.

The locator was generalized to `locateGeneratedResourceBlock(source, { registry, resourceName,
generatedFile })`, which is strictly stronger than the first implementation: it captures the resource
identifier from the creation and **requires the same identifier** in the registration, rejects
ambiguity (more than one creation anchor) instead of resolving it by position, and still requires the
resulting span to contain exactly one creation and one registration so it cannot widen across a
sibling. Quote form is not assumed — the plugins generator emits names via `JSON.stringify` (double
quotes) and the background generator emits them single-quoted; both are covered and both are now
exercised by tests built from **real generator output**, not hand-written strings.

Consumer 3 (`prepare-readiness-fixture.ts`) remains prefix-keyed on `'  // --- app '`, which the apps
generator still emits as `// --- app ${appIndex} ---`. It is tolerant of index changes but is the same
class; it is out of scope for this leaf and is not claimed to be fixed.

### Open lead (NOT part of this leaf)

Real generated output observed on disk at
`007-leaf-1844/.llm/tmp/cli-e2e/plugin-smoke-20260901-081712/aspire/.helpers/register-plugins.mts`
is **fully exploded, one argument per line**, whereas `generate-register-plugins.ts:91` emits the
`['run', '--config', 'deno.json', …]` array on a **single line**. The local-mode branch of
`prepare-flow-b-fixture.ts` does a literal `.replace("['run', '--config', 'deno.json',", …)` that
cannot match the exploded form.

No mutating `deno fmt` gate exists in the E2E gate set, so the exploded file is most likely an artifact
of manual formatting during #1844 lease debugging rather than the pipeline. Recorded as a lead to
confirm against a clean local-mode run; deliberately **not** absorbed into this leaf.
