# Utility state cascade

Use the resolved root identity `data-theme="studio" data-flavor="utility"` as well as the standalone preset id when scoping Utility CSS. Native checked state, not an SSR `data-checked` snapshot, drives the choice control after interaction.

A hover selector with `:hover:not(:disabled)` has two pseudo-class specificity points; a later invalid attribute has only one. Use `:where(:hover):not(...)` or an explicit invalid-hover selector so error borders survive pointer and focus interaction. This also applies to label hover on checkbox/switch roots. Browser assertions caught this after geometry-only checks passed.

For pointer captures, hover the visible choice label/track, focus the actual input, and restore defaultChecked after activation. Wait for finite transitions before reading computed colors. Snapshot-only state labels do not prove cascade behavior.
