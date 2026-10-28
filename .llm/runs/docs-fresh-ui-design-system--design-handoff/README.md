# Design-system implementation handoff

Internal context for the build slices of epic #2412: S1 #2414, S3 #2416, S8 #2430 and S9 #2431.
Public documentation lives in `docs/design-system/`; this folder holds what implementers need and
readers of the docs do not.

- `docs-site.md`: how the docs site maps onto the Utility theme, component by component, with the
  component gaps (G-1…G-18) for S3.
- `reference/`: WebP exports of the docs-site designs and the Utility specimen.
- `figma-variables/`: a full export of the Figma variables (1,229 across 7 collections), with values
  per mode, aliases by name and CSS code syntax. This is the value source for S1.
- `figma/<theme>.md`: per theme, the Figma frames (node ids) and any node-level bindings that S1
  must replace with roles. File: `pGRLnkPPRZJZy74evNcQBr`.
