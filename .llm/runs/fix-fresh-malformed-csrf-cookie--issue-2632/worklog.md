# Worklog

## Design

Public surface: unchanged definePage().withForm(...).build() and `readCsrfToken` return type. Domain: existing optional cookie token and form result statuses. Ports/constants: none added; retain CSRF_COOKIE_NAME.
Cookie parsing is the validation boundary. Malformed headers yield no token and use existing form behavior.
Slices and gates are listed in plan.md. Contributor path: `form/validation/csrf.ts` plus its colocated tests and `define-page/tests/runtime.test.tsx`.
PLAN-EVAL: N/A — bounded parser error correction; acceptance specifies all behavior and there is no new public contract or unresolved design tradeoff.

## Evidence

Bootstrap complete; reproduction and implementation pending. Tests will be written and run before the reader changes.
