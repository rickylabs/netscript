# Drift

rtk/rg absent; direct commands run as node. Pinned Deno2.9.7 via mise. Current maint:leak-check/maint:teardown and check:review-threads task names replace older agentic aliases. Public artifacts omit actual operator paths, hostnames/ports and session identities.

- Runtime research found a pinned native checkpoint alignment failure before any generator change. Original checkpoint probe failure is excluded as proof of the reported missing-AOF finding. Added an AOF-only restart oracle to isolate data loss. Durable launch policy now includes FileStream plus storage-tier, following the confirmed upstream configuration workaround for4K-sector storage, with both directories sharing the configured data path. This is native provider configuration within the existing contract; no version bump or unsupported scheduler.

- Preserved the existing semicolon-free generator style rather than adding broad mechanical punctuation churn. Structured formatting uses CLI quality settings with the sole per-file temporary semicolon override, measured passing on base and head; the new test uses canonical CLI settings. No shared formatter changes.


## Required CI formatter correction

Required ready-for-review quality:cli compares changed files against canonical CLI style and rejected the legacy-style generator. This supersedes the earlier temporary-config decision; that decision was insufficient for the required gate. Canonically format only the owned generator. Formatting the evaluated source through the canonical formatter yields exactly the current file, proving the generator delta is formatter-only. No launch policy changes. A repeated live test exposed a readiness-window fixture failure (connection refused before delivery assertions), so readiness now has deterministic20seconds instead of jittered ~5seconds and reports its phase; hard-restart delivery still has its original5-second bound. All33tests pass again and full quality:cli passes. No repo formatter policy edits, no gate waiver. Independent follow-up evaluation required.
