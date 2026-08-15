# Research — comparison pages (#1659)

## Current surface

- The existing comparison landing page points to a methodology page and one framework-specific
  session page. A separate migration section repeats that framework-specific path.
- Navigation roots and cross-reference keys still advertise both surfaces.
- A measurement script and two stored result files support the old protocol. All are removed by
  the issue contract.

## Public API findings

- `@netscript/fresh/builders` publicly exports `definePage()` and the page builder's route,
  resource, layer, layout, metadata, caching, freshness, and streaming configuration.
- A layer accepts a component plus `loader`, `partial`, `partialName`, `fallback`, `staleTime`,
  `staleReloadMode`, and `delivery`. `loader` may return `undefined`.
- Route references expose typed `href()` generation and page contexts expose typed route paths.
- `Region.Settled` is not a public export. The page examples therefore use the supported component
  argument to `withLayer()`.
- Backend public surfaces support contract-first routes, schema input/output, typed service clients,
  and typed worker handlers/results.

## Presentation findings

- The docs layout already enhances tabbed code with small vanilla JavaScript.
- A comparison component can render the fixed NetScript panel and every competitor panel in the
  initial HTML, then switch only competitor-labelled nodes. The first competitor remains visible
  without JavaScript.
- Root format and lint wrappers select `packages/**` and `plugins/**`; this docs slice is outside
  those wrapper roots. The docs-site verifier owns source formatting for this surface.

