# Research — fix-design-registry-catalog-drift-gate--0.0.7-wave1

## Re-baseline

- Carried-in source: issue #1358 and the topic-orchestrator leaf brief.
- Re-derived against `origin/main` @ `da574111af05a5cded74250128b196fcab870274` on 2026-08-15.
- The carried-in 66/50/16 counts remain current. The exact missing set is unchanged.
- The frontend overlay references `.claude/05-frontend.md`, but that path is absent in this
  checkout. The applicable Fresh 2.x and `fresh-ui-horizontal` L0/theme authority documents were
  read instead; no implementation decision depends on the missing legacy pointer.

## Red-first reproduction

The defect was reproduced before any implementation or run-artifact edit. Command (repository
root, raw exit code `0` because this is an inventory probe rather than the future failing gate):

```bash
deno eval 'import { freshUiRegistryManifest as manifest } from "./packages/fresh-ui/registry.manifest.ts"; const path = "packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template"; const source = await Deno.readTextFile(path); const catalogSource = source.slice(source.indexOf("export const registryCatalog")); const galleryNames = [...catalogSource.matchAll(/\n\s+name: '\''([^'\'']+)'\'',/g)].map((match) => match[1]); const manifestNames = manifest.items.map((item) => item.name); const missing = manifestNames.filter((name) => !galleryNames.includes(name)); const extra = galleryNames.filter((name) => !manifestNames.includes(name)); const ai = manifest.collections.find((collection) => collection.name === "ai"); console.log(JSON.stringify({manifestItems: manifestNames.length, galleryMetaTotal: Number(source.match(/total: (\d+)/)?.[1]), galleryEntries: galleryNames.length, missingCount: missing.length, missing, extra, aiCollectionCount: ai?.items.length, aiCollectionItems: ai?.items, missingAiItems: ai?.items.filter((name) => missing.includes(name))}, null, 2));'
```

Observed numbers:

| Surface | Count |
| --- | ---: |
| Live `freshUiRegistryManifest.items` | 66 |
| Generated gallery `registryMeta.total` | 50 |
| Generated gallery `registryCatalog` entries | 50 |
| Missing from gallery | 16 |
| Extra in gallery | 0 |
| `ai` collection members | 15 |
| Missing `ai` members | 14 (all except shared `theme-seed`) |

Missing names, in manifest order:

```text
avatar, citation-chip, code-block, model-selector, tool-call-card, chart-block, donut,
prompt-input, message, markdown, command-palette, search, dropzone, chat-render,
mcp-ui-widget, render-ui
```

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The authoritative manifest has 66 items; the app template declares and contains 50. | Red-first `deno eval` above. |
| 2 | The missing set is symmetric evidence: 16 missing, 0 extra. | Red-first output above. |
| 3 | This is not a gallery filter defect. `DesignComponentsView` covers every `RegistryItemKind` and filters only by the section's kind before mapping every matching catalog entry. | `packages/cli/src/kernel/assets/app/routes/(design)/design/(_components)/components-view.tsx.template:755` and `SECTIONS` at lines 45–82. |
| 4 | The generated gallery reads only the hand-copied `registryCatalog`; the CLI's install/list/update flows read the live `freshUiRegistryManifest`. | `components-view.tsx.template:40-43,755`; `packages/cli/src/kernel/application/ui/registry.ts:3,87-92,135-140`. |
| 5 | The snapshot was incomplete when created, not merely allowed to become stale later. Git blame attributes both the original manifest AI entries and the original template to `317e4b509`; later desktop work updated the snapshot total to 50 without adding the 16 omitted items. | `git blame` on template lines 1–30 and manifest lines 428–445; `git log --follow` for both files. |
| 6 | The existing drift test compares only the public `registry.ts` JSDoc collection names with manifest collection names. It never reads the CLI gallery catalog. | `packages/fresh-ui/tests/registry-doc-drift.test.ts`. |
| 7 | Issue #1358 requires names, kinds, layers, collection membership, version and total to match, with positive and symmetric negative fixtures that name drift. | Live issue body fetched 2026-08-15. |

## Root cause

There are two independently maintained catalog representations. The package manifest is the live
source used by CLI behavior, while the generated route template is a manually curated static
snapshot. No generator or semantic test connects them. Because the route renderer consumes the
snapshot directly, omitted entries are unobservable to the generated page even though `ui:add` and
`ui:list` can install and list them.

## JSR-audit surface scan

- Public surfaces inspected first with `deno doc`: `packages/cli/mod.ts`,
  `packages/fresh-ui/mod.ts`, `packages/fresh-ui/registry.manifest.ts`, and
  `packages/cli/src/kernel/application/ui/registry.ts`.
- `packages/cli/deno.json` exact-pins `@netscript/fresh-ui` to
  `jsr:@netscript/fresh-ui@0.0.6`; `packages/fresh-ui/deno.json` exact-pins both touched
  `@netscript/sdk` subpaths to `0.0.6`. No pin change is planned.
- The CLI route template is in the CLI publish allowlist (`src/**/*.template`). The fix must remain
  a checked-in constant asset: no runtime filesystem read, text import attribute, top-level
  `import.meta` path resolution, or self-referential bare package import will be introduced.
- `registry-doc-drift.test.ts` is excluded from the fresh-ui publish surface, so its test-only
  `import.meta.url`/`Deno.readTextFileSync` use does not enter a JSR graph.
- No public export, entrypoint, dependency, or runtime permission is planned to change. Publish
  dry-runs for both touched publishable members remain required evidence.

## Open questions

- None that can force implementation rework. The frozen four-file contract and issue acceptance
  criteria fully specify the repair and regression gate.
