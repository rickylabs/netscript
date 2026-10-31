# Preserve downstream token vocabulary

Figma exports new semantic role names, while existing docs consumers may still reference the original spacing/type scale. The protected Design system section uses18such roles. Generate compatibility aliases through Utility density/type roles rather than silently dropping them or changing the sibling stylesheet. Each alias must resolve to a generated role and must not shadow an authoritative export.

The style gate now reads every built CSS file. Maintained owned and sibling CSS gets full colour/red/role validation; generated Pagefind CSS still gets undefined shared-role validation. A visible nav-gap assertion catches layout failures that axe/overflow alone miss. Avoid rendering a second identity row when the content already owns one.

Synthetic Lume groups also affect breadcrumbs: use slug text when no title exists, render groups with no URL as text, and avoid adding a lane that is already in the real trail. The Studio theme route is a concrete regression case.
