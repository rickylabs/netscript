# Plan

Fix malformed Cookie handling in the existing form CSRF reader only. Preserve `readCsrfToken(request): string | undefined`; a Cookie parser SyntaxError maps to undefined, other exceptions propagate.

LOCKED: use the existing missing-token path for POST rejection and GET renewal. Do not weaken token verification or change response status conventions.
Open decisions: none. Risk: swallowing unrelated failures; catch SyntaxError specifically.
Archetype 4 + frontend overlay; AP-1/AP-14/AP-25 in scope. No new layers, ports or architectural debt.
Slices: (1) bootstrap plan, (2) failing reader and GET/POST regression tests, reader correction and scoped gates, (3) separate-session evaluation and review handoff.
Gates: structured test/check/lint/fmt; quality:scan and arch:check; JSR audit and doc lint; release:preflight; docs:accuracy. CLI E2E N/A: no scaffold, Aspire helper or runtime wiring changes. Server-rendered form seam tests exercise route output; no visual behavior changes.
Deferred: all other milestone issues and the excluded saga transports.
