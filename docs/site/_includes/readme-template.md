<!--
  NetScript standardized README template (US-9 / A2).

  Every publishable unit's README.md MUST follow this shape. It is enforced by
  the conformance checker:

      deno task docs:readme:check
      .llm/tools/check-readme-standard.ts

  Required sections (exact rules the checker enforces):
    1. H1 title starting with `# @netscript/` (the package's JSR name).
    2. A one-line purpose sentence directly under the title.
    3. An `## Install` section that contains `deno add jsr:@netscript/...`.
    4. A `## Quick example` (or `## Quick start`) section containing at least
       one fenced code block (```ts ... ```).
    5. A `## Docs` (or `## Documentation`) section with at least one Markdown
       link — to the reference page and to the concepts site.

  Replace every <placeholder> below. Do not leave the angle-bracket tokens in
  a shipped README.
-->

# @netscript/<pkg>

<One-line purpose: what this unit does, in a single sentence.>

## Install

```sh
deno add jsr:@netscript/<pkg>
```

## Quick example

```ts
import { <symbol> } from '@netscript/<pkg>';

// <minimal runnable example showing the primary entry point>
```

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/<pkg>/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
