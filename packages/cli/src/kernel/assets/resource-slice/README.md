# Resource-slice template family

This directory is the single neutral asset authority for generated Fresh resource slices. The pure
resource planner chooses roles and target paths; `render-resource-slice.ts` supplies variables,
selects option fragments, and applies ownership markers. Init does not consume this family until
Slice F establishes byte-equivalence with `generate resource --form --partial`.

## Variables

| Variable | Meaning |
| --- | --- |
| `resource`, `resourceCamelCase`, `resourcePascalCase` | Normalized resource identity and TypeScript-safe symbols. |
| `route`, `routeAlias`, `routeDirectory` | Static Fresh route, generated `appRoutes` property, and route-relative source directory. |
| `clientModuleSpecifier`, `queryFactoryName`, `queryFactory` | Selected generated client module and exact procedure factory expression. |
| `partialName`, `partialRoute` | Derived partial identity and URL. |
| `pageOptionImports`, `pageOptionLayers`, `pageLayoutProps` | Renderer-owned additive page fragments in form/partial/stream order. |
| `viewOptionLinks` | Renderer-owned presentation delta for the selected optional roles. |

Templates contain no command parsing or IO. A new variable belongs here only when it is derived
from `ResourceSlicePlan`; there is no neutral-template extension registry.

## Ownership marker

Every emitted leaf starts with the schema-1 `@netscript/resource-slice` JSON comment produced by
`markOwnedResourceSliceLeaf()`. Its fixed key order is schema, resource, role, options, then
`bodySha256`. The hash covers every UTF-8 byte after the marker, including the final LF. The marker
is provenance for safe reconciliation, not an authentication boundary. Missing, malformed, or
hash-mismatched markers are never silently replaced.

Page and view are the only existing leaves whose canonical bytes change when an option is added.
The renderer includes every strict prior option subset so the reconciler can prove an additive
transition. Other options add their declared leaves without changing core layout/loaders.

## Directory-role headers

The first generated body in each selected helper directory owns one exact header:

| Directory | Header contract |
| --- | --- |
| `(_components)` | `@netscript/directory-role components: server-rendered markup only` |
| `(_islands)` | `@netscript/directory-role islands: client hydration only` |
| `(_shared)` | `@netscript/directory-role shared: loaders and shared route types only` |
| `(_lib)` | `@netscript/directory-role lib: route-local pure contracts and helpers only` |

The machine ownership marker remains line one. The directory-role header is therefore the first
line of the generated body and line two of the complete owned leaf. Sibling optional leaves do not
repeat it.
