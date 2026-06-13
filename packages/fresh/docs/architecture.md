# Architecture

`@netscript/fresh` is organized around explicit subpath exports. The root entrypoint is curated for
small cross-cutting helpers, while route builders, deferred rendering, forms, streams, query helpers,
interactive helpers, Vite integration, and testing helpers stay on named subpaths.

The support spine owns these package-wide conventions:

- Error normalization lives under `./error`.
- Error display primitives are part of the error surface.
- Cache-entry helpers stay under `./utils`.
- Vite integration stays under `./vite`.
- Test fixtures stay under `./testing`.
- Fresh telemetry uses one internal convention shared by feature-specific helpers.
