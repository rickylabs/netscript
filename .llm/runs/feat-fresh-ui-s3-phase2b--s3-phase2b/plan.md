# Plan & Design — READY FOR REVIEW

Second approved stacked review unit for #2416, based on PR2488 at31cc758.
Feature tier; supplied leaf profile. Primary Archetype4 (Fresh UI, doctrine06/10
Keep), small-contract concern folded in, frontend/docs overlays. Same separate
read-only Claude Opus5.5 high evaluator must ratify this detailed plan before
product code, especially the owner’s new additive-extension boundary.

## Locked public surface and native behavior

1. Finish17 missing identities without changing the104-identity inventory.
   Each becomes shipped only with real source, registry installation, contract
   renders, keyboard behavior and Utility evidence. Registry authoring stays in
   registry.json; all native/legacy projections, collections, style maps,
   consumer coverage and carriers ratchet with each slice. Preserve frozen v1
   fixtures through narrowly named compatibility repairs only when justified.
2. Layout: ScrollArea uses a named, focusable native viewport with vertical,
   horizontal/both overflow and native scrollbar parts; AspectRatio uses native
   CSS ratios; Direction/DirectionProvider applies native dir to exactly one
   existing HTML boundary without adding a DOM wrapper. Reject fragments/arrays
   or non-host boundaries rather than silently ignoring direction. Nested
   direction is local, never a document-global mutation. Resizable uses two
   panels, a focusable APG separator, pointer capture, native focus and bounded
   axis/Home/End keys with RTL handling. Pixel defaults280/160 preserve the
   ledger; min/max/controlled size/refusal, ARIA values, observer cleanup and
   resize bounds are tested. No backend service or new drag library.
3. AI: MessageScroller follows the end only while pinned, preserves a reader’s
   scroll position otherwise, computes data-scrollable from real geometry and
   provides a keyboard scroll-to-latest action with stable focus. Marker is
   presentation. Trace uses actual native disclosures with status/duration
   content and controlled refusal. Questionnaire renders native radio/checkbox/
   freeform controls and a real form, with explicit answer/change/submit ports;
   the host owns wizard progression, validation messages and business effects.
   Attachment presents caller-owned upload/processing/error/done state and
   optional native actions/progress; it never uploads or fetches.
4. Docs: FilePathChip copies exact path text with actual outcome/error and stale
   completion protection; AttributeChip is escaped native text. Toc and
   AnchorNav use ordinary links and optional native section observation, never
   tab roles for document navigation. Toc’s mobile disclosure remains native;
   current markers, controlled current state, missing targets, responsive/RTL,
   cleanup and native hash navigation are covered. A shared copied helper is
   allowed only if it encodes actual section-tracking policy used by both.
   FileTree is read-only nested lists with ownership labels, not a pretend ARIA
   tree. Figure is native figure/media/caption, with host-owned alt text/media.
   RuledGrid implements the ledger’s docs-card anatomy and responsive columns;
   Hero owns its documented heading/lede/actions/optional aside/path content
   using existing display/title roles. No Markdown/parser/backend rewrite.
5. Page-shell audit/implementation stays one AppShell/Sidebar/TopBar identity
   family in SidebarShell, preserving current root/slot inputs and copy target.
   Add truthful dashboard/chat/docs layout, optional navigation/rail/composer
   seams and responsive topbar/navigation. Use existing Sheet/native dialog
   for mobile focus/Escape/return, no fake offscreen focusable navigation.
   Render one active sidebar/navigation branch; document hydration ownership
   and preserve useful desktop SSR. Media-query listeners/observer lifetimes,
   controlled refusal and focus on viewport changes are real browser cases.
   Docs topbar spans the shell grid and retains a mobile Toc path; do not add a
   second DocsTopBar or collide with CLI ui:add page. Audit StatsGrid/DataTable
   caller APIs, relevant archetype features and metadata against actual source,
   fixing named gaps rather than inventing evidence. Desktop’s existing six
   components get the same actual-source/contract/browser callback audit; no
   native bridge or updater rewrite (#859 is separate).

## Locked style-extension declaration

6. Preserve pinned upstream registry schemas and meta.netscript legacy shape.
   Each source registry:style item declares
   meta.netscriptStyleExtensions: readonly StyleExtension[]. Absence reads as[]
   for compatibility; style-utility declares an explicit empty array. A
   production registry validation adapter checks this publisher namespace and
   source-style eligibility: registry:style plus meta.components. The field is
   invalid on CSS support styles, themes and every other item type; add both
   CSS-support and non-style negative tests. The harness additionally requires
   that the item appears in the source-style registration table, and validates
   every registered item through getStyleExtensions, including absence-as-empty.
   The portable production adapter never imports test registration code.
   The pinned upstream schemas already allow metadata; no schema
   snapshot or legacy projection exception is needed.
7. Every entry has exactly component, name, type, default and maps-to. Names
   start x- (camel-case Figma names remain legal); mapped attributes/part names
   use portable lower-kebab identifiers. Normalize name by inserting '-' between
   a lowercase/digit and uppercase letter, and between an uppercase acronym and
   following Capitalized word, then lowercase ASCII; only x- followed by ASCII
   letters/digits separated by single hyphens is legal after normalization.
   maps-to MUST equal data- + normalized name for scalars, slot: + normalized
   name for slots, or block:<declaring-style-item>/ + normalized name for blocks.
   Reject mismatched mappings and distinct names normalizing to the same target;
   duplicate/promotion checks use component plus normalized name. Presentational types boolean/string/
   number map to data-x-* attributes and have matching scalar defaults (finite
   numbers). Structural type slot maps to slot:x-name; type block maps to
   block:<declaring-style-item>/x-name. Structural defaults are null/empty and
   optional. Reject missing/extra fields, base-name/attribute collisions,
   duplicate names/targets, wrong default types, non-finite numbers, foreign
   block scopes and non-x targets. The registry adapter validates syntax;
   the contract harness also validates the declared component against its
   independent canonical catalog. Public StyleExtension/StyleExtensionType data live on the existing contracts
   subpath; getStyleExtensions(item: RegistryItem) returns a validated readonly
   declaration array on registry-v2. Registry validation calls that same adapter
   before publication. All new symbols/fields have full documentation.
8. A declaration can add only its mapped attribute or optional slot/block.
   Existing base props/parts/attributes/values/slots/APG/keyboard items are
   immutable. It cannot rename/remove a base item, extend an existing enum,
   replace a keyboard operation or introduce a required/default-visible
   structural feature. If two registered source styles declare the same
   component/extension name, fail with a promotion-to-base diagnostic; never
   silently mutate the base. UI-style-switch unsupported-attribute diagnostics
   and Figma plugin export consume this boundary in their owning S2/S5 work;
   they are not new CLI/plugin work in this harness slice.

## Locked all-style fixture and browser boundary

9. tests/contracts/styles.ts remains the source-style registration authority:
   style ID plus registry:style item identity, separate from CSS support items
   and token presets. Make that metadata importable without evaluating Preact
   sources or Deno-only copy renderers. Move actual provider assembly into a
   separate module. Every registered ID must have exactly one complete source
   provider; missing/extra/duplicate providers and wrong registry type fail.
   Canonical base contracts are independent of each provider’s declarations.
10. From slice9a onward, EVERY NEW identity must pass the same strict base
    render checker before becoming shipped: no unclassified data attributes,
    and no data-x-* before a valid extension declaration. Introduce the reusable
    component+part+purpose classification seam in9a; new identities cannot use
    a permissive fallback. Slice12b extends that same checker/table to all27
    existing private-binding scopes, with no broad exemption.
    Render/base tests iterate every registered provider, not index0. Validate
    provider API/part/variant/slot/keyboard declarations against the canonical
    base plus only its registry-declared additions, and actual rendered parts/
    axes against that same authority. Existing private runtime payload/layout
    attributes and nested base-component bindings get explicit independently
    reviewed component+part classifications (or canonical metadata correction),
    never a blanket data-* allowance. data-x-* always needs its owner’s
    declaration; public axes are never hidden by a private-binding exception.
    Base fixtures cannot supply structural extension content, and their
    default renders must keep those slots/blocks empty.
11. Browser projects derive every registered style ID from the same authority.
    A source-style header selects a real fixture renderer and CSS set on the
    local server; no silent fallback to Utility. Current Utility’s real
    composition becomes its adapter. Other source styles must supply a full
    compatible adapter and shared keyboard scenario IDs before registration
    can pass. This avoids rewriting individual navigation URLs and lets every
    existing keypress/focus/accessibility case run on the selected sources.
    Only Utility is registered today; no real S4–S6 style implementation is
    fabricated. Token presets remain a separate axis, and colour certification
    must state the actual tested preset scope.
12. Extension fixtures are synthetic UNREGISTERED checker inputs constructed
    from the real Utility provider plus declarations and declared additions.
    Pass them directly to registry adapter and base/extension checker; never
    put them in styles.ts or browser projects. Positive fixtures cover a
    declared x attribute and optional slot/block with empty defaults, enabled
    only for their declaring synthetic provider. The real registered Utility
    path with explicit [] must pass end to end from registry metadata through
    getStyleExtensions to the checker. Negative controls include each original prop/part/variant-value/
    keyboard mutation, an undeclared addition (including an unregistered x
    attribute), malformed declarations, missing style/provider/browser adapter,
    base mutation disguised as an extension and nonempty structural defaults.
    Check default and enabled extension output. Keep all base tests running;
    extension-only tests cannot replace or weaken them.

## Ordered commits and gates

Each slice has the seven-item contract checkpoint before source edits, same
independent substantive review, source commit, committed-source carrier checks,
evidence commit, zero public audit, push/PR comment and reconcile note. Target
fewer than30 source files per commit; split a category into complete units when
needed. Never start the next implementation slice before its predecessor is
terminal. Run/context notes accompany every slice. If9c exceeds the file
budget, split the completed responsive shell behavior from the StatsGrid/DataTable
metadata/audit unit. If12b exceeds it, split complete strict-existing-provider
coverage from complete browser routing/extension regression coverage; each split
still receives its own gates/review/carriers and must not loosen the invariant.

| Slice | Complete unit and primary source surface | Proof |
| --- | --- | --- |
| 9a | Strict-new-identity render checker/classification seam and ScrollArea/AspectRatio/Direction, typed/JSON catalog, registry/style/collections, real fixtures/tests and docs | native scrolling/ratios/local RTL, child tab behavior, real installed copies, strict axe/Utility captures |
| 9b | Resizable and its typed API/state constraints, registry and fixtures | pointer/touch capture, both axes/RTL, bounds/Home/End, refusal/resize cleanup, ARIA and child focus |
| 9c | Single AppShell/Sidebar/TopBar family and StatsGrid/DataTable audit | actual page shell/slots, mobile modal focus/Escape/resize, docs/chat geometry, responsive topbar and archetype mapping, consumer compatibility |
| 10a | Marker/Trace/Attachment, catalog/registry/fixtures | native disclosure, status/action/controlled refusal, native child controls, all states |
| 10b | MessageScroller/Questionnaire, catalog/registry/fixtures | pinned/unpinned streaming geometry, stable scroll action focus, native form/radio/checkbox/freeform/submit |
| 11a | FilePathChip/AttributeChip/Figure/FileTree, catalog/registry/fixtures | exact clipboard/outcomes, escaped text, semantic native media/read-only lists, child focus |
| 11b | Toc/AnchorNav/RuledGrid/Hero plus Desktop audit | hash/current/disclosure/observer cleanup, responsive docs anatomy, existing Desktop callbacks/metadata and no fake native-host proof |
| 12a | Extension types/metadata reader+validator, registry declaration and focused public tests | valid portable manifests, malformed/collision/type/default/promotion controls, no pinned-schema/legacy drift, new export doc-lint/JSR |
| 12b | All-style provider/browser routing, base/extension checker and fixture mutants, docs | every registered source style, all four mutations and undeclared additions fail, declared x additions pass only their style, real browser routing/keyboard coverage |
| 13 | Full2b evidence, carriers, independent IMPL-EVAL and final-head CI | full package/browser/quality/publication/docs/consumer/runtime gates, review threads and privacy at exact READY head |

## Gate set, debt and deferrals

Run scoped source/browser check/lint/fmt/test wrappers with no dropped files,
including unstable-kv for source checking; broader quality:gate (quality+arch),
registry template lint, actual ui:add installed-source/compile/lint/SSR tests,
full Fresh UI tests and current browser matrix with strict axe/no allowances.
Compare Utility anatomy with the completed ledgers/renders; local Linux captures
are not cross-environment pixel hashes. Use existing tokens only; preserve
Lucide source notices when adding required glyphs. Every new identity has an
actual keyboard test, including presentation components’ native child/tab-skip
behavior. Registry/style/collection equality guards stay closed.

Run release:preflight, docs:accuracy, export drift, docs build, JSR/native member
publish dry-run and full export doc-lint with exact inherited-baseline attribution.
New public extension symbols must have zero new documentation/type diagnostics.
Generate/check prose, corpus, assets barrel and publication carriers after each
source unit, with source committed before corpus generation. No root/docs lock
churn, no cache deletion/reload, no dependency family/version changes.

One canonical scaffold.runtime --cleanup one-pass attempt per final unit;
Docker-unavailable stays UNPROVEN and a Docker-capable hosted gate must supply
runtime evidence before READY. The existing open#859 native updater exception is
not native Desktop success. Independent phase2b IMPL-EVAL is mandatory, same
separate evaluator; follow the supplied two-consecutive-failure stop rule.
Required remote checks must be green at the exact final head before READY.
No labels/closing keyword/merge. Cockpit owns merging.

Existing accepted debt#2531 remains open and raw failures stay disclosed; no new
quality waiver is accepted by this plan. Real alternate source styles remain
S4–S6; token values/broader preset contrast certification remain#2450/S6; Pagefind
backend remains S8; Figma plugin extension export remains#2418 phase2. No final
assignment completion until both review units and the full requested harness
scope are delivered. Contributor entry: packages/fresh-ui/src/contracts/README.md.

All decisions that affect current implementation are locked above. Exact local
prop/type details for each native unit are written contract-first in its slice
checkpoint and independently reviewed; no unresolved choice permits silently
adding a backend, a second identity or a new dependency.
