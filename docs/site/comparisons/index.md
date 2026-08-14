---
layout: layouts/base.vto
title: Comparisons
description: Evidence-led framework comparisons, their shared methodology, and the roadmap for work not yet measured.
templateEngine: [vento, md]
order: 1
---

# Comparisons

This section compares framework mechanisms under an explicit equivalence contract. It is for
teams deciding whether NetScript fits an application boundary, and for maintainers who need a
repeatable way to add or refresh a case. Start with the
{{ comp.xref({ key: "compare:methodology", text: "comparison methodology" }) }} before reading a
case.

The existing {{ comp.xref({ key: "explain:compared", text: "orientation to NetScript's path" }) }}
answers a broader question: what several frameworks teach first, where NetScript's ordering differs,
and what that ordering costs. It remains the right introduction. This section adds a narrower
evidence contract; it does not replace that orientation or turn its trade-offs into benchmark
results.

## Current case

The first bounded case will examine a deferred Session page design in NetScript and Next.js. No
completed case result or measured number is published yet. Until the evidence manifest, repeatable
procedure, and case matrix land together, the case remains **deferred**.

## Programme roadmap

The initial case cannot truthfully answer every part of a framework decision. The remaining work
has explicit owners:

- [Runnable parity fixture and comparable static evidence](https://github.com/rickylabs/netscript/issues/1645)
- [Type continuity, diagnostics, and editor evidence](https://github.com/rickylabs/netscript/issues/1646)
- [Runtime, freshness, navigation, and failure-isolation evidence](https://github.com/rickylabs/netscript/issues/1647)
- [Human and coding-agent discovery studies](https://github.com/rickylabs/netscript/issues/1648)
- [Further comparison cases and topic prioritization](https://github.com/rickylabs/netscript/issues/1649)
- [Full Next.js concept map and migration parity checklist](https://github.com/rickylabs/netscript/issues/1650)

Migration guidance is deferred to issue #1650 until case-backed mappings become available. A
roadmap owner is not evidence: each future page must still satisfy the methodology below.

{{ comp.nextPrev({ prev: { label: "How NetScript's path compares", href: "/explanation/compared/" }, next: { label: "Comparison methodology", href: "/comparisons/methodology/" } }) }}
