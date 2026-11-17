# Research

Read issue #2632 in full after fetching origin. Current main matches its evidence baseline.
`readCsrfToken` directly calls `getCookies`; POST reads it before the CSRF opt-out and the GET loader reads it when generating the form state.
The existing `string | undefined` contract already represents a missing token. No export or dependency changes are needed.
Archetype 4 (builder) with frontend overlay. Current doctrine verdict for fresh: Keep; existing route documentation debt is outside this fix.
JSR surface review: unchanged explicit return type, named exports and package export map; no new slow types.
