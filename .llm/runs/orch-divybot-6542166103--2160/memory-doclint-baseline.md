# Documentation gate baseline

At abe9d3e, doc:lint reports 30 privateTypeRef errors for plugins/sagas and 7 for
packages/plugin-sagas-core. Current implementation has identical grouped files
and counts. Run each --root separately: repeated --root takes only the last root.
Both package audit-jsr-package dry-runs succeed despite the separate doc-lint red.
No new documentation type errors should be excused by these baseline totals;
compare the grouped files too (retained in reports/).
