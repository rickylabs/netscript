# Context Pack — #1290

Branch `fix/database-zod-barrel-contract-1290` starts at `6c3b534fc`. Live issue #1290 governs.
Baseline #1257 mutates the upstream models barrel and tests hand-written imports, but does not
compile the generated service contract. Locked direction: generate a multi-model NetScript-owned
`crud.ts`, point aliases there, compile the real generated contract, and prove service boot. Do not
touch #1287 or #1274. Formal evaluation is D6-composed. Foreign `deno.lock` remains unstaged.

