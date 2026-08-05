**[PHASE: IMPL] [SLICE: S1]**

`createRuntimeHost()` now composes existing service, worker, queue, and database drains under one
shared timer. It uses deterministic phase ordering, preserves stable ties, returns at budget
expiration even when the active drain never settles, and reports partial failures without aborting
later drains.

Evidence: 3 focused deterministic tests passed; scoped check/lint/fmt are clean across 45 service
files; full-export doc lint is clean; quality gate exits 0; focused service doctrine shows only the
three pre-existing baseline warnings.
