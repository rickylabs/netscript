# Research for #2652

- Source-inspected the pinned Fresh Vite plugin (1.1.2). In `src/mod.ts` Fresh builds `client` before `ssr`. In `src/plugins/server_snapshot.ts` it opens the client Vite manifest, uses `chunk.file` for the client entry and browser islands, and registers the emitted files as immutable. Fresh core's `src/middlewares/static_files.ts` serves those files with a one-year cache lifetime.
- Source-inspected `src/plugins/server_entry.ts`. Fresh writes `_fresh/server.js` using the actual server entry filename. The generated app's start task invokes that launcher. The baseline build emitted `_fresh/server/server-entry.mjs`.
- Source-inspected the CLI Vite asset and the package Vite integration. The app asset supplies the global file naming override. The package owns aliases, environment mapping and route-manifest generation. The checkout's `find_guidance` and `deno doc` agreed on that package surface.
- The existing CLI E2E Chromium session can hold one profile and tab over a normal reload. A real scaffold, production build and generated launcher can exercise it without Aspire or a database.
