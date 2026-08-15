---
layout: layouts/base.vto
title: Migrate from Next.js
description: A deferred roadmap mapping only the Next.js concepts established by the pinned Session-page case.
templateEngine: [vento, md]
order: 2
---

# Migrate from Next.js

Status: **roadmap / deferred**. This page is not a complete migration guide. It maps only concepts
established by the {{ comp.xref({ key: "compare:nextjs-session", text: "pinned Session-page case" }) }};
it does not claim source compatibility or prescribe a mechanical rewrite.

## Case-proven concept map

| Start from this Next.js concern | Map the responsibility before choosing NetScript code | Evidence boundary |
| --- | --- | --- |
| Dynamic App Router segment | Bind the generated NetScript route contract, then consume typed path values in the page graph. | **Inspected** in both mechanisms; end-to-end diagnostic quality is **deferred**. |
| Cache Components and `use cache` | Separate request-scoped cached projections from presentation, then declare layer freshness and authoritative partial ownership. | **Inspected** mapping; cache behavior and runtime parity are **deferred**. |
| `cacheLife` and tag/path invalidation | Translate stale, revalidate, and expire intent explicitly; do not collapse them into one threshold. Identify which mutation owns invalidation. | Semantic difference is **inspected**; comparative clock behavior is **deferred**. |
| Suspense or loading file | Preserve each region's shell position and model loading, settled, empty, and failed presentation before selecting a partial boundary. | Layout and lifecycle responsibilities are **inspected**; streaming performance is **deferred**. |
| Parallel-route slot | Use a named authoritative partial only when the region needs independent refresh and failure ownership. Do not assume ordinary siblings provide equivalent isolation. | Closest mechanisms are **inspected**; failure injection is **deferred**. |
| `Link` and React Server Component navigation | Preserve a normal destination and decide deliberately whether partial navigation should enhance it. Keep cache-seed behavior explicit on the destination page. | Transport difference is **inspected**; cold/warm navigation results are **deferred**. |
| `generateMetadata` | Derive page metadata from the same cached domain projection used by the layout instead of introducing a second fetch path. | API mapping is **inspected**; delivery behavior is not comparatively measured. |

## What this roadmap does not cover

The Session case does not establish a runnable Next.js counterpart, comparative runtime results,
complete type-continuity evidence, form migration, middleware, image or font handling, deployment,
testing, authentication, or broader App Router parity. Do not infer those mappings from this page.

The [full concept map and parity checklist](https://github.com/rickylabs/netscript/issues/1650)
owns the complete migration guide. Use the
{{ comp.xref({ key: "compare:methodology", text: "comparison methodology" }) }} for any new mapping,
and keep unmatched behavior **deferred** until its evidence lands.

{{ comp.nextPrev({ prev: { label: "Migration roadmaps", href: "/migration/" } }) }}
