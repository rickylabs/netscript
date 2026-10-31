# Drift

- No implementation drift. Vite glob behavior was verified before source edits.
- RTK remains unavailable; use direct commands and structured wrapper verdicts.
- Evaluation route preference retained from owner: `claude -p --model claude-opus-5-5 --effort high`, read-only. New independent session for this new leaf; public artifacts omit identifiers.
- No-label preference retained; no extra opt-in labels. Later readiness transition is explicitly requested by owner.

- Deno 2.9.7 rejects npm:vite@catalog: directly in TypeScript source. Use a root development import alias vite:catalog: and the existing pinned catalog value instead. No package runtime dependency or version change. Root lock metadata joins the scoped write surface; resolved graph must be identical.
- Root formatter excludes CLI. Scoped source-config.json retains root formatting/lint rules without global exclusion filters for these explicit owned files.

- Fresh UI's frozen private lock mirrors root workspace metadata, so the new root dev alias requires its canonical lock:update as well. This is metadata synchronization, not a version upgrade; compare full npm/JSR maps before accepting.

Broad quality gate exposed root import-map leakage into the isolated Expo reference: catalog vite unavailable there. Replace the experimental root alias with CLI-local package.json devDependencies (vite:catalog:), preserving test-only dependency ownership and the existing catalog pin. Previous root-alias lock metadata is superseded.
