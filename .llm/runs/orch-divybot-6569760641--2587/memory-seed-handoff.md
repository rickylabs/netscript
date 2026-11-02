# Seed handoff and Deno 2.9.7

Seeds emit at `database/<engine>/scripts/seed.ts`; the root marker requires three parent traversals.
Test the actual emitted location, not a replaced marker URL. Publish a complete private candidate
with an atomic no-clobber hard link, then validate the winning marker. Existing invalid intent is
an error; concurrent seeds preserve one identity and interrupted private candidates are ignored.
Deno 2.9.7 accepts URL types for `Deno.link` but this runtime fails with empty link paths.
Use the existing `@std/path` `fromFileUrl` conversion for both arguments (string form verified).
The workspace root already ships that import. Keep this regression under the pinned runtime.
