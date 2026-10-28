# Component contract source

`component-spec.md` is the component inventory and per-component specification the NetScript Figma library is built from: 104 components (shadcn parity plus Fresh UI's own). For each component it gives:
- its parts (layer names = `data-part`);
- its variant, size and state axes (the data-attribute values);
- its boolean and slot properties;
- the token roles it binds.

It is the input for the machine-readable component contract (#2416). Every style (theme language) restyles each component over this one contract.

- **Ids:** §1 lists the components by category with priority (P0 core, P1 shadcn parity, P2 NetScript-specific).
- **Per-component specs:** §2. Naming conventions are in §0.
- **Code vs Figma conflicts:** §4.6 lists the known ones, to resolve in the contract.
- **Status:** the Figma base library implements Actions, Forms, Navigation, Overlays, Data display (part 1) and Feedback. Data display 2, Layout & blocks, AI, Desktop and Docs kit are specified here but not yet drawn.
