# Implementation brief — Slice A

Extract the exact #1664 client-binding resolver from `web-scaffold.ts` into
`application/resource-slice/client-selector.ts`. Preserve all decisions and diagnostics. Add the
locked exact selector matrix in `client-selector_test.ts`; keep UI integration expectations
unchanged. Do not touch commands, inputs, templates, exports, or any fifth product file.

