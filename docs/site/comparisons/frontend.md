---
layout: layouts/base.vto
title: Compare service-backed web apps
description: Live operations, versioned service clients and authenticated admin forms compared with common web approaches.
templateEngine: [vento, md]
order: 2
---

# Compare service-backed web apps

These cases fit a Fresh and Preact app whose backend already has services, durable work and
telemetry. Each excerpt shows a specific integration; the surrounding app still owns mounting,
credentials and recovery policy. All scenarios remain readable without JavaScript.

## Choose a scenario

{{ comp.scenarioPicker({ id: "frontend", label: "Web scenario", scenarios: frontendScenarios }) }}

## When another web stack is a better fit

Keep Next when React libraries, Server Components or its deployment ecosystem are the main
constraint. SvelteKit already has a compact server-form model with progressive enhancement.
Use Nuxt when your team and component library are built around Vue. A single-process web app
may not need NetScript’s service discovery or durable runtime processes.

See the [capability table and trade-offs](/comparisons/#capability-table).
