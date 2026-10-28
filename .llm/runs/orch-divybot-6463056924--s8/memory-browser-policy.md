# Browser acceptance recipes

Use `npm test -- --config docs.playwright.config.ts` in tools/fresh-ui-browser after rebuilding the site. The docs suite lives in docs-tests, separate from the S0 scaffold tests. Strict browser types use docs.deno.json (manual npm materialization, no lock writes) through the structured check wrapper. Named AxeBuilder import type-checks under both Deno and Node.

CSSOM iterates expanded shorthand properties with empty values when the authored value contains var(); explicitly read background/border/outline/text-decoration shorthands too. Canvas fillStyle retains its prior paint when handed an invalid var() expression; resolve aliases before checking sRGB red. The policy caught and fixed renderer-generated named red in state diagrams, mapped only in inline presentation. Original Mermaid assets remain unchanged.

Full negative controls inject raw-colour or red-role into the ordinary authored-policy gate through DOCS_UI_NEGATIVE_CONTROL; expected command exit is 1, rather than a test that merely asserts the checker returned true.

Playwright default locator text matching ignores noscript descendants even with JavaScript disabled. Assert the noscript paragraph is visible and use the innerText matcher for the fallback message; verify against a freshly built site.
