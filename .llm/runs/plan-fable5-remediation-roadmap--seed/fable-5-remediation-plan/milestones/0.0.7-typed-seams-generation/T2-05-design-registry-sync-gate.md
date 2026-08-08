# fix(scaffold): the generated /design/components gallery lists 50 of 66 registry items — the whole AI collection is invisible and no gate compares them — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-05 · **Proposed milestone:** 0.0.6 (small, self-contained, and a stated
prerequisite for #1333's `/design` acceptance; drafted inside the new-0.0.7 pack because it belongs
to the generation pillar, but it does **not** depend on the generator train and should not wait for
it) · **Labels:** `type:fix` `area:cli` `area:fresh-ui` `priority:p1` `status:triage` ·
**Depends on:** none

## Summary

The scaffolded `/design/components` gallery reads a hand-copied snapshot of the `@netscript/fresh-ui`
registry that declares 50 items while the live manifest has 66. The 16 missing entries are the
entire `ai` collection plus `donut` and `dropzone`. `netscript ui:add` / `ui:list` resolve against
the **live** manifest, so the CLI can install components the generated "living design reference"
says do not exist — and the generated `AGENTS.md` points coding agents at exactly that gallery. No
task, test or CI step compares the two, so the snapshot re-rots on the next registry addition.

## Evidence

- `research/repo-audit/scaffold-doctrine.md` §2.1 (D1) and `research/repo-audit/web-layer.md` §7.1 —
  both computed the same 16-item diff.
- Repo, verified at `fac9e339042c`:
  - `packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template:1-4`
    self-describes as a snapshot "regenerate when the registry changes"; `:28` declares
    `total: 50`.
  - Live manifest: `deno eval` on `packages/fresh-ui/registry.manifest.ts` →
    `items 66 collections 8 0.1.0`; collections are
    `foundation, ai, forms-core, surface-core, feedback-core, layout-foundations, dashboard-blocks,
    desktop`.
  - Missing from the snapshot: `avatar`, `citation-chip`, `code-block`, `model-selector`,
    `tool-call-card`, `chart-block`, `donut`, `prompt-input`, `message`, `markdown`,
    `command-palette`, `search`, `dropzone`, `chat-render`, `mcp-ui-widget`, `render-ui`.
  - The CLI reads the live manifest:
    `packages/cli/src/kernel/application/ui/registry.ts` imports `freshUiRegistryManifest` from
    `@netscript/fresh-ui` and selects items from it.
  - The only existing drift test — `packages/fresh-ui/tests/registry-doc-drift.test.ts:4-18` —
    compares `registry.ts` JSDoc **collection names** against the manifest and never looks at the
    CLI snapshot.
  - Agent-facing pointer: `packages/cli/src/kernel/templates/app/agent-conventions.ts:37` routes
    agents to `/design/composition`.

## Current surface

Two sources of truth for one catalog: `packages/fresh-ui/registry.manifest.ts` (authoritative, read
by the CLI) and the CLI's hand-copied `registry.ts.template` (read by the generated gallery). They
disagree by 16 items and by construction will disagree again after the next registry change.

## Target contract

1. The generated `/design/components` catalog is **derived from the manifest**, not hand-copied —
   either generated at scaffold time from `freshUiRegistryManifest` or checked against it by a gate
   that fails on any difference in item names, kinds, collections, `layer`, or the declared `total`.
2. The gate runs in CI on the same lane as the other scaffold checks and names the drifting items in
   its failure output.
3. The gate is symmetric: adding a registry item without updating the generated catalog fails, and
   listing a catalog item that the manifest does not have fails.
4. `registryMeta.version`/`total` cannot silently disagree with the manifest.

## Acceptance

- [ ] The generated `/design/components` catalog contains all 66 current registry items, including
      the full `ai` collection.
- [ ] The catalog's item names, kinds, layers and collection membership match the manifest exactly.
- [ ] `registryMeta.total` and `registryMeta.version` are derived from the manifest.
- [ ] A drift gate compares the generated catalog against `freshUiRegistryManifest` and names the
      differing items on failure.
- [ ] Negative test: adding a fixture item to the manifest without regenerating the catalog fails
      the gate.
- [ ] Negative test: removing an item from the manifest while the catalog still lists it fails the
      gate.
- [ ] gate: the drift gate runs in CI on every change to `packages/fresh-ui/registry.manifest.ts` or
      the CLI design assets.

## Boundaries

- **#1333** owns the acceptance item "`/design` and `/design/composition` are named and linked as
  the living design/component reference" — this issue makes that reference *true* and must not
  restate #1333's other boxes or close it.
- **#1335** owns the repo-wide conformance inventory; this is one row of it, filed separately
  because it is a concrete mechanical defect with a gate.
- **#946 / #922** own plugin-contributed UI; contributed items are out of scope until that seam
  exists.
- Not in scope: the `packages/fresh-ui` exclusion from root `check`/`lint`
  (`web-layer.md` §11.3) — that belongs to the T6 quality pack; and the token pipeline
  (`tokens:check`), which already has a gate.

## Docs/consumer proof

A scaffolded project whose `/design/components` page lists every installable item is the proof: a
reader can pick any name from the gallery, run `netscript ui:add <name>`, and get it. The negative
gate is the durable proof that the gallery cannot drift back.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/scaffold-doctrine.md` §2.1/D1 and `research/repo-audit/web-layer.md` §7.1;
the 66-item count and the 16-item diff re-verified against worktree `fac9e339042c`. No GitHub
mutation performed.
