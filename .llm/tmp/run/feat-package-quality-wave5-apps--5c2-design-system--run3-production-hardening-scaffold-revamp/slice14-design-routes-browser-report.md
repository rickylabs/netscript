# Slice 14 - Generated Design Routes Browser Report

Date: 2026-06-12

Generated app:

```text
.llm/tmp/scaffold-smoke-slice14/slice14-design/apps/dashboard
```

Dev server:

```text
http://127.0.0.1:5173
```

## Scaffold Assertions

| Assertion | Result |
| --- | --- |
| `assets/design.css` emitted | PASS |
| `/design/tokens` route emitted | PASS |
| `/design/components` route emitted | PASS |
| `/design/composition` route emitted | PASS |
| design route layout emitted | PASS |
| `lib/design/registry.ts` emitted | PASS |
| `lib/design/tokens.ts` emitted | PASS |
| `islands/design/FloatingSurfaceDemo.tsx` emitted | PASS |
| `islands/design/TokenClipboard.tsx` emitted | PASS |
| `@netscript/fresh-ui/interactive` import-map entry emitted | PASS |
| `client.ts` imports `./assets/design.css` | PASS |
| app head declares a data-URI favicon to avoid `/favicon.ico` console 404 | PASS |

## Type Check

```powershell
Push-Location .llm/tmp/scaffold-smoke-slice14/slice14-design
deno check --unstable-kv apps/dashboard
Pop-Location
```

- Result: PASS
- Important checked files included:
  - `routes/(design)/design/{_layout,index,tokens,components,composition}.tsx`
  - `islands/design/{FloatingSurfaceDemo,TokenClipboard}.tsx`
  - `lib/design/{registry,tokens}.ts`
  - copied registry UI and Fresh islands under `components/ui` and `islands/ui`

## Browser Route Checks

Browser: local Playwright MCP against the generated app dev server.

| Route | SSR/browser title | Console errors | Live content checks | 390x844 overflow | Screenshot |
| --- | --- | --- | --- | --- | --- |
| `/design/tokens` | `Design tokens — NetScript design system` | PASS, 0 errors | `h1=Tokens`, copy controls present, sidebar shell present | PASS, `scrollWidth=375`, `innerWidth=390` | `slice14-design-tokens-390x844.png` |
| `/design/components` | `Components — NetScript design system` | PASS, 0 errors | `h1=Components`, responsive-table and floating-styles demos present | PASS, `scrollWidth=375`, `innerWidth=390` | `slice14-design-components-390x844.png` |
| `/design/composition` | `Composition rules — NetScript design system` | PASS, 0 errors | `h1=Composition`, layer ladder and do/don't sections present | PASS, `scrollWidth=375`, `innerWidth=390` | `slice14-design-composition-390x844.png` |

## Theme Flip

Route: `/design/tokens`

| Step | Result |
| --- | --- |
| Initial theme | `light`, `--ns-bg=oklch(98.5% 0.006 85)` |
| First click | `dark`, `--ns-bg=oklch(13.5% 0.006 85)` |
| Second click | `light`, `--ns-bg=oklch(98.5% 0.006 85)` |

## Reduced Motion

The local browser MCP endpoint used for this slice does not expose media emulation. Reduced-motion
coverage for Slice 14 is therefore static CSS evidence plus route rendering:

- `assets/design.css.template` contains `@media (prefers-reduced-motion: reduce)`.
- The media rule disables transitions on token rail links, copy controls, ramp steps, and motion
  chips.
- The media rule neutralizes the hover transform on motion chips and disables ramp flex expansion.

## Browser Tool Notes

- A first `deno run -A npm:playwright` browser attempt failed because Playwright's bundled Chromium
  executable was not installed.
- A second Deno Playwright attempt using installed Chrome failed in Deno's npm/child-process shim
  with `The handle is invalid. (os error 6)`.
- Firecrawl's remote browser could open the localhost URL but did not observe the local app content,
  so it was not used as route evidence.
- The local Playwright MCP was initially blocked by its own stale MCP Chrome profile lock. Only
  Chrome processes using `ms-playwright-mcp/mcp-chrome-a7ac91e` were stopped, then the MCP browser
  route checks passed.
