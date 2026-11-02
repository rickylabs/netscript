# CommandPalette local behavior and native ports

The baseline CommandPalette invoked actions only from item onClick while Combobox Enter invokes
onValueChange. Its query never filtered groups and its empty content always rendered. Two corrected,
scoped real-browser negative controls proved activation0 vs expected1 and options2 vs expected1.
Raw logs are private; the retained regression artifact is verdict/counts only. Scope combobox
locators to the palette: the page also has native selects with that role.

Use one headless onValueChange port for pointer and keyboard selection. Controlled value='' permits
repeated activation. Controlled open refusal must preserve the highlighted option until the state
actually closes; the generic Combobox now clears on actual closure, input edit or removal of a
registered result. Primary mousedown on an option must prevent default focus transfer, or inline
pointer selection leaves focus on body and subsequent keys cannot reach the input. Native IME
composition returns before headless key handling and must not prevent the editor's default commit.

Native Dialog close observation follows a programmatic state-driven close, so the palette ignores
that redundant native-close request when already controlled closed. A native cancel event must be
prevented before requesting close, otherwise a controlled refusal can leave the DOM closed while
state stays open. Input Escape is composed once; Escape from filter/footer buttons uses the same
cancel policy. Hidden Dialog.Title/Description provide valid generated ARIA references.

The old unit tests directly invoked CommandPalette as a function and JSON-stringified VNodes. Once
it owns hooks, render through the real Preact SSR renderer instead. Legacy class/content assertions
remain, and the accessibility boundary is asserted as native dialog/input/listbox markup.

Registry Kbd/Spinner copies are real dependencies, with an exact named compatibility allowance and
a removal negative control. The frozen legacy-v1 fixture stays unchanged. Audited baseline consumer
SSR includes CommandPalette separately from new-gap inventory. Regenerate assets before registry
or install tests. New file-text/corner-down-left glyphs use verified upstream Lucide geometry under
the retained full notice; Z1/name-set/render fixtures must cover the complete curated vocabulary.

Native RegExp.escape is not assumed in copied browser code. Capability-check it and use portable
literal escaping otherwise; the actual browser test deletes it, asserts absence and matches A.B(C)
against plain a.b(c) with no page errors. Deno availability alone is not browser availability.
