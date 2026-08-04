# Context Pack — #1290

Branch `fix/database-zod-barrel-contract-1290` starts at `6c3b534fc`. Live issue #1290 governs.
Baseline #1257 mutates the upstream models barrel and tests hand-written imports, but does not
compile the generated service contract. Locked direction: generate a multi-model NetScript-owned
`crud.ts`, point aliases there, compile the real generated contract, and prove service boot. Do not
touch #1287 or #1274. Formal evaluation is D6-composed. Foreign `deno.lock` remains unstaged.

RED/GREEN landed locally: the rendered generated contract failed TS2307 against the baseline alias,
then passed against the complete `crud.ts`; a two-model writer fixture proves all three symbols per
model. Focused tests and scoped/quality gates pass. Next: commit/push slice, then clean-scaffold DB
lifecycle and service boot artifacts.
