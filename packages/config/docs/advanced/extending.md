---
title: Extending Config
description: Extension guidance for adding config sections and plugin contributions.
package: '@netscript/config'
order: 30
---

# Extending

Config extensions should start with a named schema and a matching public type.

## Add A Project Section

1. Add a focused schema under `src/domain/`.
2. Export it from `src/domain/mod.ts`.
3. Add the corresponding TypeScript interface in `types.ts`.
4. Re-export the public type or schema through `src/public/mod.ts` when callers need it.
5. Add tests and docs for the new section.

## Add A Plugin Contribution

Plugin-provided config should be expressed as a `PartialConfig` fragment in
`@netscript/config/merge`.

Avoid adding plugin-specific behavior to the root loader. The root package validates and merges
plain data; plugin packages own runtime behavior.
