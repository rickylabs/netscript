# Candidate validation

Candidate is staged atop a normal merge of main `1e4e58f`. This records working-tree results, not a clean immutable-head claim. Raw logs remain private in the project run area; reduced structured evidence is in candidate-gates.json.

- Generator suite: 12 passed / 0 failed. Baseline red controls failed on the handwritten count and main links, then passed after implementation. Coverage includes renumbered headings, route relocation/missing/ambiguous targets, read-only metadata drift, reserved tokens, real MCP corpus retrieval and CLI/docs import negative controls.
- Consumer/scaffold suite: 69 passed / 0 failed, including actual agent init for stable/canary releases, all hosts, exact untouched files, canonical reference, repeat-init idempotence, no-write rejection for malformed tokens/refs and original bundle hash verification.
- Scoped structured check/lint/fmt: all 8 owned TS files, none dropped, raw0. Check includes --unstable-kv. Initial command misuse and test import choice were corrected before these terminal results; no dependency/lock changes.
- Root check:*: 15/15 raw0. review-threads needs its explicit --repo/--pr arguments; its bare invocation was not a code failure. All four carrier gates included; read-only design-skill check still precedes regeneration.
- quality:gate, docs links/accuracy/snippets/contract derivation, release preflight, CLI JSR audit and CLI publish dry-run: raw0. Existing dynamic-import warnings remain; audit helper's slowTypeWarnings=1 counts the banner, while raw publish reports no slow-type diagnostic. No new allowances/debt.
- Carrier chain: prose, export corpus (--allow-dirty explicitly), assets, publish metadata. GUIDELINES snapshot SHA-256 is 3c9b6292547f979addaaef7ece3b365fbf96661a85e921b863d0c926b43abc15.
- One-pass scaffold.runtime with cleanup: raw1, passed1/failed2/skipped0. Docker inaccessible, runtime UNPROVEN locally; no policy skip or runtime PASS. Read-only resource inventory reviewed; unknown/foreign entries left untouched.

Release tag behavior is tested for stable and canary versions. Development manifest versions can predate an existing feature or name an unpublished tag; remote source URLs can 404 until the matching release is published. The embedded release-matched MCP/local reference remains the primary readable guidance. No versioned Pages routes are claimed.
