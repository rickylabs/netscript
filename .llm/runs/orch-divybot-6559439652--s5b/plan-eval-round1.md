**Verdict: FAIL_PLAN** (PLAN-EVAL cycle 1 of 2, feature tier, baseline `1e4e58f`)

The plan is close: identity, scope, rollback and deferral are well designed. It fails the "open decisions" checkbox because it says there are none, yet the current catalog and the cited Figma API contradict two of its locked rules. Fixing those would force rework in slice 1, so they have to be settled before implementation.

I checked the plan's claims by running read-only scripts against the current tree. I wrote no repo files: one scratch copy landed in `.llm/` by mistake and I deleted it straight away. `git status` shows only the existing staged run files.

## Spot-checks that passed
- **Inventory:** the catalog has 87 contracts, 66 shipped, unique `specId`s. `style-utility.meta.components` has 66 entries. The token collections are Scheme, Theme, Theme B, Theme set, Density, Primitives, Base gray/accent and Studio flavor. `assertFigmaTokenNames` exists.
- **Variables are file-local:** the existing `tools/figma-plugin` creates local variables, so the plan's variable preflight is feasible.

## Required corrections

1. **Token shorthand rule fails on the real catalog.** `prose` (docs-kit/1.ts:172) declares `SF:prose/h2|h3|h4/size|line|tracking`. Expanded fully, that includes `prose/h4/tracking`, which exists in no collection. With "reject nonexistent expansions", generation fails for `prose`/`markdown` from actual contracts, and contracts can't be edited in this PR. Pick one now:
   - The tool passes the existing subset and reports the gaps.
   - Or generation stays strict, the gap is recorded as a pre-existing defect, and the acceptance claim is narrowed.

   Also define `SF:`. Today these roles exist in Theme/Theme B/Theme set/Studio flavor. Which collection is the binding target, given that Studio flavor's modes are flavor-specific and its descriptions route through Theme set? And state that Studio flavor, Primitives and Base gray/accent are excluded alongside Theme and Theme B. The full precedence order belongs in the plan, not as an unnamed constant.

2. **Code Connect targets a deprecated API.** The research cites `figma.connect`, `figma.enum` and the `html` tag from `@figma/code-connect/html`. Figma's docs now say "Framework-specific parsers will no longer receive updates or support" and "Template files are now the only actively maintained way of using Code Connect." The owner pointed to the template API. Re-lock on template files:
   - `.figma.ts` files with a `// url=` header taken from the import receipt.
   - `import figma from 'figma'` and `figma.selectedInstance.getEnum/getBoolean/getString` for each data-attribute axis.
   - `export default { example: figma.code\`…\`, id, … }`.
   - A `figma.config.json` with an HTML label/language.

   Also decide two things this raises:
   - The virtual `figma` module won't resolve under `deno check`, and dependencies can't change. Generated files therefore need excluding from type-checking, with their structure validated by a test instead.
   - The publish command is owner-run `npx --yes --package @figma/code-connect figma connect publish`, with no repo dependency.

3. **Variant and size limits aren't settled against current data.** "Full Cartesian" plus "limits fail before effects" leaves open:
   - Do variants use only `values`, or also `plannedValues` and `compatibilityValues`? I recommend `values` only, with the others kept as metadata.
   - Part-scoped attributes: are they set properties, with the template putting them on the part element?
   - Contracts with no attributes (`desktop-only`): a single component rather than a set?

   Set the per-set and whole-library limits above current maxima, which the plan must state: `table` (via `responsive-table`) = 720 variants, `button` and `sidebar` = 180 each, about 2.7k across all contracts. Otherwise the real inventory trips its own guard.

4. **Name the alias table now.** The current tree needs exactly 7 identity joins:

   | Registry item | Contract |
   |---|---|
   | `form-field` | `field` |
   | `markdown` | `prose` |
   | `sidebar-shell` | `sidebar` |
   | `responsive-table` | `table` |
   | `desktop-tray-menu` | `tray-menu` |
   | `desktop-window-chrome` | `window-chrome` |
   | `desktop-update-prompt` | `update-prompt` |

   Each needs cited evidence, such as the `field` note ("FormField is the compatible source API") or the source file. A stale or duplicate entry must fail, and no fuzzy matching. 22 shipped contracts have no registry item (dialog, tabs, popover, tooltip and others); list them as runtime-only and deferred in coverage, since S3 adds the items.

5. **Mock receipts versus real ones.** "Refuses fabricated receipts" needs a provenance field: mock/fixture receipts may drive tests and dry-run output, but publish refuses them. State whether any generated Code Connect output is committed. It shouldn't be without a real receipt, and live publish stays UNPROVEN.

6. **Slice 2 must list its files.** Name the importer/exporter, plugin entry plus `manifest.json`/`build.ts`, the commands, `figma.config.json`, README and the workflow. Also name the per-slice proving gate and confirm it stays under 30 files.

7. **CI integration is undecided.** Existing tools CI runs inside `ci.yml`'s quality job through the `run-gate.ts` allowlist (`figma-ci`), which writes durable receipts. A standalone `figma-component-library.yml` is not a required check, so it can't gate READY. Either:
   - widen the write surface to `ci.yml` plus the gate catalog and record that in drift, or
   - keep the standalone workflow and record why, with READY explicitly waiting on it.

   Commands are `deno run …` because root `deno.json` is outside the write surface; say so in the plan.

## Plan-gate checklist
| Item | Status |
|---|---|
| Research current | ✗ cites the deprecated Code Connect API (fix 2) |
| Decisions locked | ✗ fixes 1, 3, 4, 5 |
| Open-decision sweep | ✗ claims none; fixes 1–3 are hidden decisions that force rework |
| Commit slices | ✗ slice 2 files (fix 6) |
| Risk register | ✓ |
| Gate set | ✗ CI decision (fix 7); the rest of the gate list is fine for a tools surface |
| Deferred scope | ✓ (add S6 = #2419) |
| jsr-audit | ✓ N/A, justified |

## Already satisfied
- Scope stays tools-only, with no S3, token, preset or existing-plugin edits and no dependency changes.
- Inputs are complete snapshots; coverage is derived from inventory, not a forked component spec.
- Validation runs before any effects, on an isolated owned page, with variable preflight and rollback.
- Node URLs come only from import receipts.
- Live editor/MCP acceptance stays UNPROVEN.
- Owner rules hold: Refs #2568 only, no labels or private identities.
- Generator and evaluator are separate sessions from different families.
