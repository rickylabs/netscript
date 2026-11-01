# Research

- #2466 is the next unclaimed 0.0.9 leaf under #2412. No existing PR, issue comments or dependencies.
- `CALLOUT_TYPES.error.markdown` is ERROR, which GitHub does not support. The component twin reads
  this field, but authored Markdown alerts take a separate path preserving raw data-alert markers.
  Both ERROR and DANGER must normalize to CAUTION in twins while HTML variants/tone/icons remain.
- The browser collector currently supplies one exact orange-12 value for the number-kind role.
  The analyzer accepts arbitrary exemption keys, so a supplied extra token entry can suppress the
  red check. Close this contract to the one required role and retain exact-value matching.
- Definitions in the shared token layer are not uses; legitimate shared red ramps still exist.
  Test non-destructive token consumption, forged exemptions, changed values and aliases.
- Existing real-browser docs tests exercise all authored/built sources, raw-color/red/undefined
  role negative controls, gallery semantics, and Markdown twins. Extend these existing gates.
