# Figma design-system library: restructure and completion

File `pGRLnkPPRZJZy74evNcQBr`. The owner's request (2026-10-28): the file must be cleaned up,
structured and feature complete. That means a complete, exhaustive base component library, plus
exhaustive component coverage in every theme.

## Constraints

- Mutations go through `use_figma` strictly one at a time; there are no parallel Figma agents.
- Move frames rather than recreate them, so node ids and the handoff maps stay valid.
- Bind every component to the existing variables (Scheme, Theme, Studio flavor, Density, Base
  gray/accent). A theme then applies by switching modes.
- Language variants are only for themes whose anatomy differs.

## Phases

- **A. Restructure.**
- **B. Base library** (~85 components).
- **C. Theme coverage.**
- **D. Review.**
