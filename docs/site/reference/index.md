---
layout: layouts/base.vto
title: Reference
---

Reference is **information-oriented**: precise, exhaustive API documentation for every public
NetScript package and plugin. These pages are hand-written and derived from each package's published
export surface with `deno doc`, so they describe the published surface rather than the source tree
surface. For a guided introduction start with the [tutorials](/tutorials/), for problem-solving
recipes see the [how-to guides](/how-to/), and for the ideas behind the API read the
[explanation](/explanation/).

There is no generator that writes these pages. `deno doc <module>` is the authority a page is written
against, and an automated drift check verifies a subset of pages against their packages' declared
entrypoints — so a page can fall behind its package, and one that has is a bug worth filing.

## Page paths

Every publishable workspace member has a page at `/reference/<segment>/`. Today the segment is the
package name with the `@netscript/` scope stripped — `@netscript/sdk` at [`/reference/sdk/`](/reference/sdk/),
`@netscript/plugin-ai-core` at [`/reference/plugin-ai-core/`](/reference/plugin-ai-core/) — with four
exceptions, the deployable plugins, which drop the `plugin-` prefix:

| Package | Page |
| --- | --- |
| `@netscript/plugin-sagas` | [`/reference/sagas/`](/reference/sagas/) |
| `@netscript/plugin-streams` | [`/reference/streams/`](/reference/streams/) |
| `@netscript/plugin-triggers` | [`/reference/triggers/`](/reference/triggers/) |
| `@netscript/plugin-workers` | [`/reference/workers/`](/reference/workers/) |

Their `-core` counterparts use the name-exact form, so `@netscript/plugin-sagas-core` is at
[`/reference/plugin-sagas-core/`](/reference/plugin-sagas-core/) while `@netscript/plugin-sagas` is at
`/reference/sagas/`. The release-readiness gate treats the four table entries as declared aliases;
all other publishable members use the name-exact segment. A maintainer adding or changing an
exception must update this table and the gate together.

Each publishable workspace member's own page is canonical for its exported API. The four deployable
plugin pages describe their manifests and integration entrypoints, then link to their separately
published `-core` packages instead of duplicating the core symbol tables inline. Focused examples may
use both packages, but exhaustive entrypoint and symbol documentation lives on the package that
exports it. This one-package/one-canonical-page rule keeps the reference consistent with the
publishable workspace surface and gives each API claim one place to stay current.

Navigation is derived from the folder tree, so a new page is discoverable as soon as its directory
exists — no index or nav file lists the packages.

## CLI command coverage

The public command documentation is the union of exactly two pages: the curated
[CLI reference](/cli-reference/) and the detailed [`netscript` command
reference](/reference/cli/commands/). Together they cover every public root command and direct
subcommand derived from the installed command tree; neither page is treated as exhaustive alone.
