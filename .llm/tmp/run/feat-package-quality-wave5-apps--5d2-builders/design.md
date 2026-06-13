# 5d2 builders — Design: `definePage` DSL decomposition

> Run: `feat-package-quality-wave5-apps--5d2-builders` · Branch: `feat/package-quality-wave5-apps-5d2-builders` · PR #35  
> Phase: PLAN (Design checkpoint) · Zero implementation.

## Authority

- Umbrella plan: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (binding).
- Handover: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md`.
- Phase-1 research: `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/research.md`.
- Archetype: A3 Runtime/Behavior + SCOPE-frontend + A4-Browser obligation; builder concerns use A4 DSL/Builder vocabulary.

## Status

Skeleton — sections will be populated incrementally.

## 1. Decomposition target

### 1.1 Current file topology

```text
packages/fresh/builders/
  mod.ts                         # public barrel (41.4K)
  define-page/
    mod.ts                       # sub-barrel
    builder.tsx                  # 38.4K
    types.ts                     # 22.4K
    navigation.tsx               # 20.6K
    runtime.tsx                  # 18.4K
    search-params.ts             # 4.6K
    internal.ts                  # 3.2K
  define-partial.tsx             # 3.2K
  define-page.test.tsx           # 45.8K
  define-partial.test.tsx        # 5.7K
```

### 1.2 Proposed folder topology

```text
packages/fresh/builders/
  mod.ts                         # thin barrel, same exports
  define-page/
    mod.ts                       # re-export barrel
    types.ts                     # public type catalog only
    builder/
      mod.ts                     # `definePage` overload set
      state.ts                   # builder state interfaces + type helpers
      factory.ts                 # definition factory / `build()`
      validators.ts              # option/runtime validation helpers
    runtime/
      mod.ts                     # runtime assembly exports
      context.ts                 # runtime context helpers (today runtime.tsx top half)
      render.tsx                 # render-to-stream / response assembly
      handlers.ts                # GET/POST/loader/action wiring
    navigation/
      mod.ts                     # public navigation barrel
      hooks.ts                   # useCurrentRoute / usePage* hooks
      link.tsx                   # Link, getLinkProps
      context.ts                 # wrapWithNavigationContext / route context
    search-params.ts             # kept; small, cohesive
    internal.ts                  # non-public helpers, stays internal
  define-partial.tsx             # kept (small enough) or split later
  define-page.test.tsx           # split along seams below
```

### 1.3 Public-surface contract

All export specifiers and public type names from `research.md` §3 are retained.  
No new public symbols introduced. No public symbol removed.

### 1.4 File-cap targets

Apply F-1 layer cap (≤20K source, target ≤16K):

| Current file | Size | Target file(s) | Target size |
| ------------ | ---- | -------------- | ----------- |
| `mod.ts` | 41.4K | `mod.ts` (thin barrel) | <2K |
| `builder.tsx` | 38.4K | `builder/mod.ts`, `builder/state.ts`, `builder/factory.ts`, `builder/validators.ts` | each <16K |
| `types.ts` | 22.4K | `types.ts` (trimmed to pure types) + move helper logic into `builder/state.ts` | <18K |
| `navigation.tsx` | 20.6K | `navigation/hooks.ts`, `navigation/link.tsx`, `navigation/context.ts` | each <12K |
| `runtime.tsx` | 18.4K | `runtime/context.ts`, `runtime/render.tsx`, `runtime/handlers.ts` | each <10K |

## 2. DSL market bar

TODO

## 3. Island / partial bridge

TODO

## 4. RFC 14 protection seams

TODO

## 5. Browser validation strategy

TODO

## 6. Test decomposition

TODO

## 7. Risk and trade-offs

TODO
