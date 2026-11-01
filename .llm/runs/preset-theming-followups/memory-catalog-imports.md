# Figma plugin Zod catalog

Deno 2.9.7 rejects a literal source import from npm:zod@catalog: despite the older skill wording. Use a bare zod import with root imports mapping zod to catalog:. Existing workspace members already use that mapping. Review any resulting lock workspace metadata instead of changing versions or deleting a lock.
