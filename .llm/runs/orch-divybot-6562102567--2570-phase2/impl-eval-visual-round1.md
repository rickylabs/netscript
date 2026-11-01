**FAIL_FIX — one remaining P2 source regression.**

**Location:** `packages/cli/src/kernel/assets/app/assets/workspace.css.template`, inside the mobile media query:

```css
.workspace-query-table[data-rich] td::before { display: none; }
```

**Trigger:** At a viewport of 640px or narrower, expand **More fields** on a rich record containing a nested array of ordinary objects—for example, `lineItems: [{ sku: 'A1', quantity: 2 }]`.

`QueryResult` renders that array as a nested, non-rich table. The selector above matches its cells because they are also descendants of the outer rich table. Consequently:

- The nested table’s column headers are visually clipped by the mobile `thead` rule.
- Its replacement labels from `data-label` are also hidden by the outer table’s rich styling.
- Values remain visible, but their field names and visible field/value associations disappear.

**Required fix:** Scope rich-only rules to cells belonging directly to that table, for example:

```css
.workspace-query-table[data-rich] > tbody > tr > td::before {
  display: none;
}
```

Apply the same direct-child scoping to the rich-only reference/owner placement selectors. Verify expanded nested details at a narrow viewport, ensuring both field labels and values remain readable.

The supplied health-state derivation preserves the stated distinction between unavailable resources, access restrictions, and incomplete discovery. The pagination change consumes boolean navigation metadata only within the recognized numeric envelope and retains unknown metadata. I found no additional blocker in those changes.

This is a source-only verdict. I used no tools, executed no tests, and provide no visual-score or CI certification.