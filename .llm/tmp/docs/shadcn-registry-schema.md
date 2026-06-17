# Extract: shadcn Registry Schema v3.0

> Source: ui.shadcn.com/docs/registry/registry-json, ui.shadcn.com/docs/registry/registry-item-json
> Fetch date: 2026-06-11

## Key Facts

### registry.json
- `$schema`, `name`, `homepage`, `include` (compose from other registry.json files), `items`.

### registry-item.json fields
- `name` — unique identifier
- `title` — human readable
- `description`
- `type` — taxonomy: `registry:base|block|component|ui|lib|hook|page|file|font|style|theme|item`
- `author`
- `dependencies` — npm packages with `@version`
- `devDependencies`
- `registryDependencies` — item addresses (bare name = shadcn built-in; `@namespace/item` = namespaced; `owner/repo/item` = GitHub; URL = custom)
- `files[]` — `{ path, type, target? }`
  - `target` uses placeholders: `@components/`, `@ui/`, `@lib/`, `@hooks/`, `~/`
- `tailwind` — **DEPRECATED** for v4; use `cssVars.theme` instead
- `cssVars` — `{ theme?, light?, dark? }` — scoped CSS variables
- `css` — raw CSS rules to inject
- `envVars`
- `font` — for `registry:font` items
- `docs` — custom docs shown on install
- `categories` — organization
- `meta` — arbitrary metadata

## Diff vs Our Proposed Schema v2

| Field | shadcn | fresh-ui v2 (plan) | Verdict |
|-------|--------|-------------------|---------|
| `type` | `registry:component` etc. | `kind: component|island|block|...` | AMEND: align prefix? No, our kinds are simpler. Accept divergence. |
| `files[].target` | `@ui/`, `@lib/`, `@hooks/`, `~/` | `@ui/`, `@islands/`, `@assets/`, `@lib/`, `~/` | CONFIRMED: superset, justified by Fresh folder model. |
| `cssVars` | scoped theme/light/dark | `css?: { layer, content }[]` | AMEND: we dropped cssVars but should adopt per-item CSS variable contributions for theme-aware items. Add `cssVars` to v2 schema. |
| `docs` | present | present (optional) | CONFIRMED |
| `categories` | present | present (optional) | CONFIRMED |
| `meta` | present | present (optional) | CONFIRMED |
| `tailwind` | deprecated | omitted | CONFIRMED |
| `envVars` | present | omitted | CONFIRMED: not relevant for component registry. |
| `author` | present | omitted | AMEND: add `author?` for future community namespaces. |

## Implication for Plan D-4/D-5

- Our schema v2 is a **conscious subset+superset** of shadcn registry-item:
  - We drop React-specific fields (`tailwind`, `envVars`).
  - We add Fresh-specific placeholders (`@islands/`, `@assets/`).
  - We add `css` for per-item CSS (shadcn uses `cssVars` + `css` — we should adopt both).
- The `registry.json` export (derived artifact) should follow shadcn's root schema for community interop.
- Namespaced registries (`@acme/item`) are deferred but the schema should reserve the `@` prefix syntax.
