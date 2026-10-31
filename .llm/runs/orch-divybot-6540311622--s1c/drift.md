# Drift

- RTK absent: equivalent commands run directly.
- Existing #2500 disabled work is reused to avoid a competing policy. Only source/tests/docs are carried forward; its operational artifacts are not imported.
- Specific owner process takes precedence over generic dispatcher boilerplate: Refs #2450 only, no labels, exact-head checks before READY.
