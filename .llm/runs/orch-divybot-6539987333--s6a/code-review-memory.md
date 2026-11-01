# CodeBlock review repair notes — 2026-10-31

- Real memoization coverage needs client Preact renders. Separate SSR renders cannot demonstrate
  reuse across parent updates. The browser harness mounts the installed Message, spies on the
  actual highlighter, and keeps the same component instance until the explicit remount case.
- The browser imports the fixture using Vite’s `/@fs/` source-module URL. Direct root-relative
  requests for an unreferenced module return 404, including ordinary and hidden directories.
- Install Message and Markdown before starting Vite, so its import resolver sees the shared
  `highlight.js` mapping. Author the bare subpath and declare `npm:highlight.js@^11` in the
  registry and package import map. Native lock updates retain the already resolved 11.11.1.
- Utility Avatar has no server-side preset context. CSS can hide a photo but cannot prevent its
  download. Correct SSR omission preserving legacy photo behavior needs an explicit theme contract.
