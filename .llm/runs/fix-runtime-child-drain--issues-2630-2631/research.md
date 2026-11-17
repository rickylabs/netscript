# Research

Read both issues in full and fetched origin/main before product inspection. Main is still the evidence baseline b0eb07957.
Child health uses Deno.serve({port}) and a signal abort followed by unbounded completion; only fatal paths set exitCode. Service shutdown bounds HTTP/hooks but does not terminate on signals. KV close has no process integration. Prisma cleanup in defineService covers only the health client. OTel has its own SIGTERM handler that exits early.
Plugin service factories support explicit native ServeOptions.hostname; contrary to the issue's historical wording, current main has no hostname environment fallback. Reuse explicit hostname on child options, default 127.0.0.1; add an explicit environment fallback only if generated container wiring needs it.
Deno KV alone does not retain the process: an eval with getKv(:memory:) exits normally. Redis/ioredis sockets are the concrete suspected retained handle. A real, isolated Redis test resource owned by this lane is used for subprocess reproduction; no foreign resources are touched.
Generated background glue lives in each plugin's adapter resources. Generated host service context lazily resolves KV and DB clients through project-owned accessors. Native factories also support host-owned embedded dependencies; manual stop must not dispose those globally.
Archetype 3 runtime with plugin/CLI and service overlays; existing service/workers doctrine Refactor verdicts do not authorize unrelated restructuring. No saga transport changes.
JSR plan audit: explicit option types and documented fields, no upstream re-exports or new external dependencies.
