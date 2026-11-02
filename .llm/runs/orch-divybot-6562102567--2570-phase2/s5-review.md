**PASS — prior source approval is preserved with the S5 probe correction included.**

The revised expectations match the supplied authored templates: **“Service records,” “Validate a note,” “Users summary,”** and **“People summary.”** Removing the obsolete **“Cache-first query”** expectation correctly follows the approved product-copy change.

The acceptance scope remains intact:

- All five routes and both desktop/mobile viewports remain covered.
- Seeded record and rich-field values still must occur within `td` or `dd` content.
- Script removal now applies before semantic-marker checks as well as seeded-cell checks, preventing script-only text from satisfying either.
- The new negative control removes each distinct section marker from the remaining markup and verifies rejection. It appropriately leaves the existing resource-name substring behavior unchanged.

I identify no source blocker or weakening of the existing route, viewport, or seeded-cell requirements. These assertions remain checks of browser-dumped DOM content; they do not independently establish computed visibility.

This is a source-review PASS. I used no tools and executed no gates. The reported CI and focused-test results remain supplied evidence, and the full runtime rerun on the new head remains pending as stated.

Implementation verification: 63/63 focused probe/builder/registry tests and scoped check/lint/fmt2 files passed under Deno2.9.7. Quality/architecture PASS. The same DOM assertions passed on the live seeded Orders example and newly generated People resource at1440/390; only fixture-specific Users→Orders and Seed User→Seed Order expectations differ. No product source or visual changes. Full new-head CI remains required.
