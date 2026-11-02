# Slice 2 review, round 1

Independent read-only Opus 5.5 high evaluation.

**Verdict: FAIL_FIX.** There is one blocker: the new component-routing shortcut sends some ordinary NetScript questions to a single component page and drops all other results. The other areas you asked about are fine.

**Blocker: component routing triggers on everyday words**
- **Where:** `componentGuidance()` in `packages/mcp/src/domain/docs/component-guidance.ts:12-18` runs before any ranking (`packages/mcp/src/domain/docs/guidance-index.ts:110-111`).
- **When it fires:** the question either names something component-specific (`component`, `props`, `keyboard`, `Fresh UI`, `ui:add`) or just uses a common verb (`use`, `add`, `install`, `render`, `preview`, `variant`, `token`). It also needs a word that matches a component page name or title.
- **What it returns:** only that component page's sections, `related: []` and `confidence: 'medium'`. Ranked guidance is skipped entirely.
- **Why that's a problem:** many component names are also NetScript words, for example `pagination`, `message`, `search`, `progress`, `alert`, `select`, `input`, `label`, `card`, `panel`, `markdown` and `toast`. The curated concepts in `packages/mcp/src/domain/docs/guidance-concepts.ts` only catch a few narrow phrases, so most questions reach the shortcut.
- **Examples I traced by reading the code (not run):**
  - "How do I add pagination to my service list endpoint?" goes only to `pages/design-system/components/pagination`.
  - "How do I add progress reporting to a worker job?" goes only to the Progress component.
  - "How do I use search in the MCP server?" goes only to the Search component.
- **Why the tests don't catch it:** the existing locked suites (`guidance-evaluation_test.ts`, `guidance-retrieval_test.ts`, `guidance-terms_test.ts`, `issue-2269-guidance_test.ts`) have no queries like these. `packages/mcp/tests/component-guidance_test.ts` has no negative cases.
- **Fix, keeping the ranking policy unchanged:**
  1. Fire the shortcut only on an explicit component marker or an exact component title, and drop the bare-verb path at lines 16-18. Alternatively, put the component sections ahead of the normal ranked results instead of returning them alone.
  2. Add negative tests in `packages/mcp/tests/component-guidance_test.ts` for at least the three examples above. Each should assert the top result is not a `design-system/components/*` page.
  3. All four current positive cases already include an explicit marker, so they should keep passing.

**Checked and fine**
- **52 verbatim `get_doc` pages:** `component-guidance_test.ts:11-36` lists every registry component and block from the published release corpus. Each must be in `verbatim` mode, byte-identical to the page, within 12,288 UTF-8 bytes, and include its `ui:add` line. A future registry item is picked up from its page path (lines 60-72).
- **Vento xref and callout fixes:** `absoluteUrl` (`docs/site/_plugins/ai-tooling.ts:152-175`) now strips a doubled base path, so the result is the same whether a link arrives as source, built or same-origin absolute. Other-origin URLs are left unchanged. `inlineCode` (`docs/site/_plugins/callout.ts:23-29`) leaves existing `<code>` spans alone, escapes new ones, and now also runs on callout bodies. Real-component tests cover both (`docs/site/_plugins/markdown-render-fixture.ts:382-418`).
- **isolatedDeclarations fix:** `packages/cli/src/kernel/domain/ui/ui-preset.ts:4-19` declares an explicit `UiPreset` with the same fields as before, and `UiPresetSchema: z.ZodType<UiPreset>` keeps `.strict()`. No caller depends on `.shape` or `.extend` (checked `resolve-preset.ts` and `ui-preset-command.ts`). `ROOT` and `OUTPUT` are now typed `string` (`tools/docs-site/fresh-ui/generate.ts:9-10`).
- **Filesystem traversal:** `generate.ts:73` uses `Deno.readDir`, and root `deno.json` no longer has a `@std/fs` alias.
- **Isolated CSS policy, no unverified exemptions:**
  - `tools/fresh-ui-browser/docs-tests/docs.spec.ts:553` skips the outer policy for `assets/fresh-ui/*` except `docs.css`, which keeps its outer checks.
  - `tools/fresh-ui-browser/docs-tests/components.spec.ts:44-47` requires the published CSS set to match the expected set exactly, so any unexpected stylesheet fails.
  - Each asset's source hash is recomputed from the repository, and its published bytes are compared with a hash predicted by running Lume's actual lightningcss transform and defaults (`docs/site/design-system/components.page.ts:26-35`). Lume produces the published file separately, so this is a real check, not a hash of itself.
  - `preview.css` is checked against the Utility token layer and has two negative controls, raw colour and misplaced red (`components.spec.ts:65-89`). The outer policy's original strict negative contracts are unchanged.
- **CI wiring:** `.github/workflows/pages.yml:246` adds `tools/docs-site/fresh-ui/generate_test.ts` to the existing read-only tooling test command, with no policy changes.

The pass counts (browser 158/0/0 and the rest) come from `slice-2-evidence.md`; I didn't rerun them. Re-review only needs the routing change plus its negative tests, followed by `component-guidance_test.ts` and the locked guidance suites. The CLI, render and full-root gates stay in slice 3.
