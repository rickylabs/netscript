# Research — g5-843-ui

## Re-baseline

- Carried-in source: issue #843, epic #840, merged #841/#842 surfaces, RFC PR #822 POC
  `desktop-chrome.ts`.
- Re-derived against `feat/desktop-frontend` @ `1709dcbabb689edd8e5c659ca91774600272597c` on
  2026-07-18.
- What changed vs the carried-in version:
  - #841 now publishes the discriminated `AutoUpdateReadyEvent` (`automatic` or `manual`).
  - #842 now publishes `@netscript/fresh/desktop` and `@netscript/sdk/desktop`; the POC's ad-hoc
    binding seam must not be copied.
  - Current Deno docs expose close/hide/show/focus/reload/title operations, but no minimize/maximize
    methods.
  - The later #456 integration merge changes desktop packaging/release CLI code, not Fresh UI or the
    scaffold design-gallery templates; no design decision changed.

## Findings

| # | Finding                                                                                                                                                                                                                            | How to verify                                                                                                       |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | `@netscript/fresh-ui` is doctrine Archetype 4 (public DSL/builder), with a frontend overlay. Desktop runtime behavior is a bounded adapter concern inside that public surface.                                                     | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; `.llm/harness/archetypes/04-public-dsl-builder.md` |
| 2 | L2 components are app-owned registry copy sources: one TSX plus CSS, no L2→L2 imports, `ns-*` BEM classes, `data-part`/`data-state`, token-only CSS, reduced-motion handling, manifest registration, then a real gallery consumer. | `.agents/skills/fresh-ui-horizontal/l0-conventions.md`; `theme-authoring.md`; `packages/fresh-ui/README.md`         |
| 3 | The canonical in-repo consumer is the scaffolded design gallery under CLI app assets; generated embeds are derived by the checked-in generator.                                                                                    | `packages/cli/src/kernel/assets/app/routes/(design)/design/`; `.llm/tools/generate-cli-assets-barrel.ts`            |
| 4 | #842's desktop seam is structural and browser-safe. Feature detection should use its binding name/type vocabulary rather than ambient `Window` augmentation.                                                                       | `deno doc @netscript/fresh/desktop`; `deno doc @netscript/sdk/desktop`                                              |
| 5 | #841's ready event is the contract for update UX: automatic means restart-to-apply; manual carries `manualUpdateUrl`.                                                                                                              | `deno doc @netscript/sdk/auto-update`                                                                               |
| 6 | Deno native tray/menu events carry IDs; menu item declarations form a tagged union. Native notifications use the Web Notification API; native alert/confirm/prompt must be desktop-gated.                                          | Deno desktop docs: tray/dock, menus, dialogs, notifications                                                         |
| 7 | The original POC correctly avoided ambient augmentation and no-oped without desktop globals, but coupled setup, exit, tray, window, and updater behavior. The product surface must separate declarations from host policy.         | PR #822 `desktop-chrome.ts` corpus copy                                                                             |
| 8 | Live issue #843 deliberately leaves desktop smoke to #457. This run may prove web/Aspire no-op and browser rendering, but must not check or claim the native smoke box.                                                            | GitHub issue #843 and epic #840                                                                                     |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all `packages/fresh-ui/deno.json` exports with `doc:lint`, rubric audit, and raw
  `deno publish --dry-run --allow-dirty`.
- New-surface bar: the proposed `./desktop` export must have zero missing-doc and zero private-type
  diagnostics; explicit return types at the public boundary.
- Existing bounded baseline: `./interactive` currently owns 123 doc diagnostics (96 private-type
  references, 27 missing docs). The rubric scan also flags existing `registry/lib` and cardinality
  warnings. Raw JSR dry-run succeeds and reports no actual slow-type diagnostic. #843 will not
  expand or silently “fix” those unrelated baselines.

## Open questions

- None before Plan-Gate. Whether native desktop smoke passes remains intentionally deferred to #457.
