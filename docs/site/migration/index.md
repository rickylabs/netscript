---
layout: layouts/base.vto
title: Migration roadmaps
description: Evidence-bounded roadmaps for translating proven framework concepts without claiming complete parity.
templateEngine: [vento, md]
order: 1
---

# Migration roadmaps

These roadmaps translate only mechanisms established by a published comparison case. They are not
complete migration guides, compatibility promises, or automated conversion instructions.

## Available roadmap

- {{ comp.xref({ key: "migration:nextjs", text: "Migrate from Next.js" }) }} — a placeholder that
  maps the Session case's proven routing, cache, deferred-region, navigation, and metadata concepts.

The [full Next.js concept map and parity checklist](https://github.com/rickylabs/netscript/issues/1650)
owns everything beyond that bounded case. Until an item has a runnable equivalent and evidence under
the {{ comp.xref({ key: "compare:methodology", text: "comparison methodology" }) }}, it remains
**deferred** rather than implied by this roadmap.

{{ comp.nextPrev({ prev: { label: "NetScript vs Next.js: Session page", href: "/comparisons/nextjs-session/" }, next: { label: "Migrate from Next.js", href: "/migration/nextjs/" } }) }}
