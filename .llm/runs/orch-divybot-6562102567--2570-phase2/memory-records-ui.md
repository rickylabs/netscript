# Records UI lessons — 2026-11-01

Use `f-client-nav={false}` on GET filter forms when filters must persist in the address bar: live Fresh partial navigation refreshed results but retained the old URL. Selection/export belongs in an app-owned island; keep native table cells because the scaffold runtime acceptance probe intentionally reads seeded values from `td`/`dd`.

At 390px keep column headers accessible inside a clipped `thead`, expose sorting through visible filter controls, and keep row checkboxes visible. The browser matrix must operate a visible row checkbox at this size. For a 30-day ChartBlock, use a constrained 30-column x-axis and an end-aligned max-content final tick; flex gaps plus overflowing text can add three pixels of page overflow. Explicitly inspect KPI values for clipped currency digits.

Provider search needs `mode: insensitive` for PostgreSQL, while SQLite does not accept that option. Propagate the actual scaffold DB engine into template generation; retain status filtering and search before pagination.

Persistent native Codex resumes must specify `-m gpt-6-astra -c model_reasoning_effort="xhigh"`; otherwise the host default replaces the recorded model. Keep resume identity and raw logs private.
