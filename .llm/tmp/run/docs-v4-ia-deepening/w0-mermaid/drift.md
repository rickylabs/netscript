# W0 Mermaid Drift

## 2026-06-22 — Run artifact location

- Severity: minor.
- The prompt points to `.llm/tmp/run/docs-v4-ia-deepening/plan.md`, but this
  checkout only had `.llm/tmp/run/docs-v4-ia-deepening/w2-restructure/*` before
  W0. W0 proceeded from the explicit locked contract in the implementation
  prompt and created this slice artifact directory.

## 2026-06-22 — Renderer path

- Path taken: pre-rendered SVGs plus build/gate validation.
- Local renderer: `@mermaid-js/mermaid-cli@10.9.1`.
- Local install/probe command:
  `npx --yes @mermaid-js/mermaid-cli@10.9.1 --version`.
- Result: exit 0, printed `10.9.1`.
- Rationale: `@mermaid-js/mermaid-cli@11.4.2` rendered locally but emitted Node
  20 engine warnings under this WSL Node 18.19.1 environment. Version 10.9.1
  runs under Node 18 without those engine warnings, so W0 pins 10.9.1 for
  regeneration and the determinism gate. Live in-build rendering remains
  deferred so `deno task build` does not depend on npm, Chromium, or Puppeteer.

## 2026-06-22 — Mermaid source compatibility

- `docs/site/_diagrams/otel-traceparent.mmd` used the edge label
  `enqueue (propagated)`, which Mermaid CLI 10.9.1 rejected. The label was
  changed to `enqueue propagated`; the graph semantics are unchanged.

## 2026-06-22 — Theme decision

- Added `docs/site/_diagrams/mermaid.config.json`.
- Diagrams use Mermaid `theme: "base"` with transparent background, dark neutral
  node fills, DM Sans stack, and the docs copper accent (`#bd774c`) for borders
  and links. This avoids the default purple Mermaid palette while matching the
  docs chrome.

## 2026-06-22 — Build-gate behavior

- Added a docs build validator that scans public `.md`/`.vto` source files for
  `comp.diagram` references and throws when a referenced
  `/assets/diagrams/*.svg` is absent.
- This intentionally covers the W0 diagram surface only. W5 still owns
  non-diagram missing-asset gates such as `featureGrid` and scanner/CI wiring.

### Missing-asset proof

Command: temporarily moved `docs/site/assets/diagrams/request-lifecycle.svg`
aside, ran `deno task build` from `docs/site/`, then restored the file with a
shell trap.

Raw exit code: 1.

Key output:

```text
error: Uncaught (in promise) Error: [diagram] missing or invalid diagram asset reference
  - capabilities/services.md: missing diagram asset /assets/diagrams/request-lifecycle.svg
```

## 2026-06-22 — Validation Evidence

| Command                                                                                        | Raw exit code | Evidence                                                                         |
| ---------------------------------------------------------------------------------------------- | ------------: | -------------------------------------------------------------------------------- |
| `deno task diagrams:render` from `docs/site/`                                                  |             0 | Rendered 15 diagrams.                                                            |
| `deno task diagrams:check` from `docs/site/`                                                   |             0 | `15 committed SVGs match Mermaid sources.`                                       |
| `deno task build` from `docs/site/`                                                            |             0 | `[diagram] verified 22 diagram asset reference(s).` and `Site built into _site`. |
| Missing-asset proof build                                                                      |             1 | Error shown above; asset restored afterward.                                     |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root docs/site --ext ts,tsx` |             0 | JSON summary reported zero occurrences.                                          |

## 2026-06-22 — Lock and reference hygiene

- `docs/site/deno.lock` and root `deno.lock` unchanged.
- `reference/**` and `docs/site/reference/**` unchanged.
