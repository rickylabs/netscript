# 2026-10-29 — Removing theme ownership is not removing app token state

A preset apply can become sole lock owner of styles.css and APP_TOKEN_FILES while preserving existing application CSS. Managed files intentionally skip copy edit checks; without a separate core-file rule, removing the theme silently deletes app CSS and compiled token state although tokens.config.json still selects the preset.

Use the shared isUiManagedCoreFile predicate for explicit removal and style retirement. Drop the removed registry item's records/docs and reconcile its managed imports, while retaining the existing aggregator and compiler outputs. Ordinary unshared generated registry CSS remains removable; normal copied-file edits still refuse atomically.

Regression: the structured v2 suite exercises theme-only and full apply on a pre-existing custom aggregator; the actual public CLI fixture applies Tonal to a legacy app then removes theme-tonal. Both fail with a missing stylesheet before repair. Assert the post-apply aggregator survives byte-for-byte, custom imports/rules remain, every compiler output and token config remains, and the theme lock/docs disappear. Compare against post-apply bytes because the established renderer inserts managed/custom boundary markers during apply.

Retained native-provider review output may include an ERROR envelope and cumulative conversation duration even alongside a fresh substantive content verdict. Preserve both observations. Reproduce concrete findings; require a fresh exact-head substantive review response before readiness rather than inferring PASS from process exit0 or transport availability.
