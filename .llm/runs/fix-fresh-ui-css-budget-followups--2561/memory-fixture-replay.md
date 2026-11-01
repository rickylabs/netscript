# Replaying the original CSS proof

The original265 fixtures contain repeated human-readable scenario names across the basic
and variant sets. Identity is the data-case index; preserve the original ordering/names and
input hashes rather than renaming or deduplicating them. The committed snapshot is87989bytes
compressed and includes original52CSS files, base/Utility tokens and all265HTML specimens.

Keep lexicographic file ordering identical to the old Array.sort(), not localeCompare: alert.css
and alert-styles.css can change order under locale collation and alter cascade behavior.
Browser-only Node tests use .browser.mjs to avoid Deno's default test discovery. The Deno
location fixture runs the actual package test inside a theme-named checkout and validates
that oversized/stale/unshipped CSS still fails. The gzip raise is planned and fixed, not per-file.
