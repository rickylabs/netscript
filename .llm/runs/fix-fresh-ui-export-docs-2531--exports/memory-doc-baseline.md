# Per-entrypoint documentation closure matters

Run the structured full export wrapper, then inspect each entrypoint result. Combined Deno graphs
can hide a private reference if a different entrypoint exports that type. token-config.ts references
TokenPreset while tokens.ts exports it; combined lint hides this independent failure.
The metadata audit emits text by default unless --out is supplied; a .json redirect does not make
its default output JSON. Native JSON data exports cannot carry a module JSDoc comment.
