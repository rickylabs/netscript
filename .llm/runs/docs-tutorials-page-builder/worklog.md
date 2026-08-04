# Worklog — docs/tutorials-page-builder (Refs #1208, PR #1209)

Branch: `docs/tutorials-page-builder`
Status: INSUFFICIENT phase-1 audit resolved, deep feature integration completed.

## 1. Page-Builder API & @netscript/fresh-ui Exports Inventory

We ran `deno doc` against the `@netscript/fresh-ui` exports mapped in `packages/fresh-ui/deno.json` to inventory the full page-builder runtime surface:

### Primary Exports Surface (`.`)
- **DataGrid**: Renders a generic, templated, token-styled data grid.
  - Components: `DataGrid`
  - Helpers/Constants: `DATA_GRID_CELL_VARIANTS`
  - Types/Interfaces: `DataGridProps<T>`, `DataGridRow<T>`, `DataGridColumn<T>`, `DataGridCellVariant`, `DataGridNode`, `DataGridRenderable`, `DataGridRowActionContext<T>`, `DataGridSelectionContext`
- **Icon SVG System**: Curated token-driven stroke SVG icon systems.
  - Components: `Icon`
  - Constants: `ICON_PATHS`
  - Types/Interfaces: `IconName`, `IconProps`, `IconSize`, `IconSvgAttributes`, `IconSvgAttributeValue`
- **Toast Redirect-Flash System**: Persistence and extraction of message banners across redirects via URL query parameters.
  - Functions: `getToast`, `stripToastFromUrl`, `withToast`
  - Constants: `REGISTRY_TOAST_QUERY_KEYS`
  - Types: `RegistryToast`, `RegistryToastType`
- **Classname Merger**: Optimised Tailwind and Preact CSS class combiner.
  - Functions: `cn`

### Generative UI Export (`./ai/render-ui`)
- **Generative UI renderer**: Safe renderer of dynamic tool-calls whitelisted blocks.
  - Functions: `renderUiPayload`, `RenderUiSurface`
  - Constants: `RENDER_UI_MAX_DEPTH`, `RENDER_UI_BLOCK_CATEGORIES`
  - Types/Interfaces: `RenderUiBlockCategory`, `RenderUiBlockType`, `RenderUiNode`, `RenderUiOptions`, `RenderUiSurfaceProps`

### Native Desktop Chrome Helpers (`./desktop`)
- **Desktop Chrome integrations**: Window control interfaces and process status maps.
  - Functions: `createDesktopChrome`
  - Constants: `DESKTOP_CHROME_DISABLED_REASONS`, `DESKTOP_CHROME_STATUSES`, `DESKTOP_MENU_SOURCES`, `DESKTOP_OPERATION_REASONS`, `DESKTOP_OPERATION_STATUSES`, `DESKTOP_WINDOW_ACTIONS`
  - Types/Interfaces: `DesktopChromeActive`, `DesktopChromeCapability`, `DesktopChromeDisabled`, `DesktopChromeDisabledReason`, `DesktopChromeLifecycle`, `DesktopChromeStatus`, `DesktopDialogCapability`, `DesktopEventTargetCapability`, `DesktopMenuActionEvent`, `DesktopMenuActionItem`, `DesktopMenuItem`, `DesktopMenuRoleItem`, `DesktopMenuSeparator`, `DesktopMenuSource`, `DesktopMenuSubmenu`, `DesktopNativeMenuItem`, `DesktopNotificationCapability`, `DesktopNotificationHandle`, `DesktopNotificationOptions`, `DesktopOperationReason`, `DesktopOperationResult`, `DesktopOperationStatus`, `DesktopTrayCapability`, `DesktopTrayConfig`, `DesktopTrayConstructor`, `DesktopWindowAction`, `DesktopWindowCapability`

### Stateful Interactive accessibility primitives (`./interactive`)
- **Accessibility & Interactive Primitives**: Stateful, unstyled interactive blocks for layout regions:
  - namespaces: `ActionMenu`, `Accordion`, `Combobox`, `Dialog`, `Drawer`, `Popover`, `Sheet`, `Tabs`, `Tooltip`
  - Types/Interfaces: Supporting component props and configurations (e.g. `ActionMenuRootProps`, `AccordionItemProps`, etc.)

### Platform-contract Base Primitives (`./primitives`)
- **Base L0 Primitives**: Platform-contract base primitives.
  - Components: `Icon`, `Show`, `SrOnly`, `VisuallyHidden`
  - Types/Interfaces: `PrimitiveChild`, `PrimitiveChildren`, `PrimitiveNode`, `VisuallyHiddenStyle`, `VisuallyHiddenProps`

### Copy-based Component Registry Manifest (`./registry`)
- **Copy-based component registry manifest**: Manifest descriptor mapping CLI resources.
  - Constants: `freshUiRegistryManifest`
  - Types: `FreshUiRegistryManifest`, `FreshUiRegistryItem`, `FreshUiRegistryFile`, `FreshUiRegistryCssContribution`, `FreshUiRegistryCollection`

---

## 2. sweep of Tutorials (Sweep Scope)

We swept all tutorials under `docs/site/tutorials/` to ensure page-builder conformity:

1. **Storefront Tutorial (ch. 6)**: Rewritten to page-builder idiom (`definePage()` with route contract bind, cache-first resource resolution, visual layer, and layout slots).
2. **Chat Tutorial (ch. 3)**: Rewritten to page-builder idiom (`definePage()` with inline contract, server-side resource resolution, island layer loader, and layout slots).
3. **Live Dashboard (ch. 4)**: Swept and fully upgraded to demonstrate all core page-builder capabilities:
   - `withRoute` (contract-first routes)
   - `withTelemetry` (span-based traces)
   - `withResource` (cross-layer request-dedup + per-layer query refinement idiom)
   - `cache-first SDK data`
   - `server+client dehydration` (`dehydrateQueryClient` + `hydrateFromDehydrated`)
   - `withForm` (Zod-schema validated server-bound forms)
   - `definePartial` & deferred-loader composition via `<Deferred>` components.
4. **Workspace Tutorial**: *Intentionally out of scope.* Contains database partitioning, background queues, and route-authz service builders (`GET /api/workspace/:workspace/members` guarded via `.withAuthn()`). It does not define any frontend UI/pages, so the page-builder idiom does not apply.
5. **ERP Sync Tutorial**: *Intentionally out of scope.* Headless backend synchronization service using queues and cron tasks. Does not contain any user-facing routes or pages.
6. **EIS Chat Tutorial**: *Intentionally out of scope.* Legacy copy of the chat tutorial. All files redirect to the main `/tutorials/chat/` track.

---

## 3. Type-Checking Evidence

All examples in the tutorials have been consolidated and type-checked against `@netscript/fresh` in the type-checking fixture `packages/fresh/tests/type-fixtures/tutorial-examples_type.tsx`.

We executed the type checking via `.llm/tools/run-deno-check.ts`:

```
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/tutorial-examples_type.tsx --pretty
{
  "source": {
    "mode": "selection",
    "cwd": "/home/codex/repos/ns005-tutorials"
  },
  "command": "deno check --unstable-kv <files>",
  "selection": {
    "filesSelected": 1,
    "batches": 1,
    "failedBatches": 0
  },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueCodes": 0,
    "uniquePaths": 0
  },
  "groups": []
}
```

The check resolved with **0 occurrences, 0 errors, 0 warnings (Exit code 0)**, proving that all demonstrated page-builder patterns (including forms, dehydration, resources, partials, and telemetry) compile with strict type safety.

## 2026-08-04 — Slop-audit repair pass (lane: Claude docs-exception subagent)

Owner slop-audit of commit `38009a962` found the deepened chapter-4 rewrite had force-fit features
with no narrative predecessor. Surgical repair applied (verified-good additions retained):

`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md`

- Removed the auth force-fit entirely: `resolveAuthSession`, the `@app/lib/auth.ts` import, the
  `auth` resource, `auth.tenantId`, and the `throw new Response('Unauthorized', 401)` guards. The
  tutorial never scaffolds auth, so none of it had a predecessor.
- `withResource` dedup is now demonstrated honestly with the `ordersData` cached-entry resource
  shared by the `list` and `ordersQuery` layers — one KV read, two consumers.
- Restored route-contract fidelity: all resource/query/layer inputs use
  `{ limit, offset, status }` from `ctx.search`, matching the Step 1 search schema. No `tenantId`
  anywhere in the chapter.
- Deleted the six numbered feature-checklist comments; replaced with short plain comments only where
  the code needs one.
- Restored the deleted good prose: the `definePage` builder steps `comp.apiTable` (recovered from
  `f7558aa1c`, plus a new `.withResource(name, factory)` row) and the
  "This is the dense part — and it earns its weight" callout, both reintegrated after the full
  builder chain.
- Dropped the `withForm('statusForm', …)` layer, the `StatusForm` import, `{slots.statusForm()}`,
  and its prose — the island already demonstrates status updates via optimistic `useMutation`.
- Trimmed the page-module import list to what the page module actually uses (island-only hooks and
  `zod` no longer imported server-side).
- Fixed the mutation util name back to the chapter-3 naming `ordersQueryUtils.update` (was
  `updateStatus`).
- Stats layer keeps `Deferred` + partial but loses the auth-derived input; it now calls
  `baseQueries.orders.getStats({ status: ctx.search.status })`.
- Closed the traces gap: added prose at `.withTelemetry({ spanName: 'dashboard.orders.list' })`
  explaining the span surfaces in the Aspire dashboard traces view.
- Corrected the verify checklist file list (the `(_shared)/query-loaders.ts` module no longer exists
  in this version of the chapter).

`packages/fresh/tests/type-fixtures/tutorial-examples_type.tsx`

- Mirrored the corrections: dropped the `AuthSession` stub and `auth` resource, dropped the
  `tenantId` path schema in favour of a `status` search field, renamed the mutation util
  `updateStatus` → `update`, and de-authed the stats loader. The `checkoutForm` demo stays (it
  mirrors the storefront chapter, which legitimately uses `withForm`).

`docs/site/tutorials/chat/03-chat-ui.md` / `docs/site/tutorials/storefront/06-storefront-ui.md`

- Slop-checked against the same bar. No auth force-fit, no checklist comments; the `definePage`
  surfaces used (`withRouteContract`, `withLayout((slots, ctx) => …)`, `withResource`) verified
  against `packages/fresh/src`. Two prose regressions repaired: the storefront "What you built"
  bullet had lost the bound-route-contract explanation (restored, extended with the builder), and
  its Step 4 paragraph claimed `parseSearch` runs in a page that no longer calls it (reworded to
  describe builder-side parsing). The chat "What you built" run-on sentence was rebalanced.

`deno.lock`

- Attempted the `git checkout f7558aa1c -- deno.lock` revert of the added
  `jsr:@netscript/queue@0.0.4` line. Any `deno check` in this workspace regenerates it immediately
  (verified: clean after checkout, one insertion again after a bare
  `deno check --unstable-kv` on the fixture). Left in place as a legitimate lock refresh.

Gate:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/type-fixtures --ext tsx
→ filesSelected 1, failedBatches 0, totalOccurrences 0 (exit 0)
```

Changes left uncommitted for orchestrator review per the slice review gate.
