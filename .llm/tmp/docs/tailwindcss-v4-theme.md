# Extract: Tailwind CSS v4 @theme

> Source: tailwindcss.com/docs/theme, tailwindcss.com/docs/functions-and-directives
> Fetch date: 2026-06-11

## Key Facts

1. **@theme vs :root**: `@theme` defines tokens that ALSO generate utility classes. `:root` defines plain CSS variables without utility generation.
2. **@theme inline**: Use `@theme inline { --font-sans: var(--font-inter); }` to inline the value into utilities rather than referencing the variable.
3. **@theme static**: Use `@theme static { ... }` to force generation of all CSS variables even if unused.
4. **Namespace → utilities mapping**:
   - `--color-*` → `bg-`, `text-`, `fill-`, etc.
   - `--font-*` → `font-family` utilities
   - `--text-*` → font size utilities
   - `--spacing-*` → spacing/sizing utilities
   - `--radius-*` → border-radius utilities
   - `--shadow-*` → box-shadow utilities
   - `--ease-*` → transition-timing utilities
   - `--animate-*` → animation utilities
5. **Custom variants**: `@custom-variant theme-midnight (&:where([data-theme="midnight"] *));` — we can define `theme-dark`/`theme-light` variants.
6. **Referencing other variables**: Use `inline` when a theme variable references another variable to avoid CSS resolution pitfalls.
7. Default Tailwind v4 theme uses OKLCH for colors (e.g., `--color-red-500: oklch(63.7% 0.237 25.331)`).

## Implication for Plan D-3 / D-7

- The generated `theme-bridge.css` should use `@theme inline` (since it references `--ns-*` custom properties from `:root`):
  ```css
  @theme inline {
    --color-ns-bg: var(--ns-bg);
    --color-ns-primary: var(--ns-primary);
    /* ... */
  }
  ```
- This generates `bg-ns-bg`, `text-ns-primary`, etc. while keeping the semantic source in `:root`.
- The `tokens.css` artifact stays in `:root` (primitive + semantic custom properties).
- `--*` reset to `initial` is available if we ever want to strip default Tailwind colors.
