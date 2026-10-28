---
layout: layouts/base.vto
title: Reference
---

# Reference

API reference for every public NetScript package and plugin: sub-path exports, symbols with their
kinds, and short examples. Each page is written against the package's `deno doc` output; when they
disagree, `deno doc <module>` is authoritative. For a guided introduction start with the
[tutorials](/tutorials/); for recipes see the [how-to guides](/how-to/); for the ideas behind the
API read the [explanation](/explanation/).

## Page paths

Every publishable package has a page at `/reference/<segment>/`, where the segment is the package
name without the `@netscript/` scope: `@netscript/sdk` is at [`/reference/sdk/`](/reference/sdk/),
`@netscript/plugin-ai-core` at [`/reference/plugin-ai-core/`](/reference/plugin-ai-core/). The four
deployable plugins drop the `plugin-` prefix:

| Package | Page |
| --- | --- |
| `@netscript/plugin-sagas` | [`/reference/sagas/`](/reference/sagas/) |
| `@netscript/plugin-streams` | [`/reference/streams/`](/reference/streams/) |
| `@netscript/plugin-triggers` | [`/reference/triggers/`](/reference/triggers/) |
| `@netscript/plugin-workers` | [`/reference/workers/`](/reference/workers/) |

Their `-core` counterparts keep the full name: `@netscript/plugin-sagas-core` is at
[`/reference/plugin-sagas-core/`](/reference/plugin-sagas-core/).

Each package's own page is canonical for its exported API. The deployable plugin pages describe
their manifests and integration entrypoints and link to their `-core` package for the core symbols.

## CLI command coverage

Public command documentation spans two pages: the curated [CLI reference](/cli-reference/) and the
detailed [`netscript` command reference](/reference/cli/commands/). Together they cover every public
root command and direct subcommand.
