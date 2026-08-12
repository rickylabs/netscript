---
layout: layouts/base.vto
title: Reference
---

Reference is **information-oriented**: precise, exhaustive API documentation for every public
NetScript package and plugin. These pages are hand-written and derived from each package's published
export surface with `deno doc`, so they describe the published surface rather than the source tree
(US-2). For a guided introduction start with the [tutorials](/tutorials/), for problem-solving
recipes see the [how-to guides](/how-to/), and for the ideas behind the API read the
[explanation](/explanation/).

There is no generator that writes these pages. `deno doc <module>` is the authority a page is written
against, and an automated drift check verifies a subset of pages against their packages' declared
entrypoints — so a page can fall behind its package, and reporting one that has is a bug worth
filing.

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
`/reference/sagas/`. This is a description of what the site does today, not a rule to follow when the
two forms disagree; reconciling them is tracked separately.

Navigation is derived from the folder tree, so a new page is discoverable as soon as its directory
exists — no index or nav file lists the packages.
