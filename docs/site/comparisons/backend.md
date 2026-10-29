---
layout: layouts/base.vto
title: Compare backend workflows
description: Order state, scheduled polyglot work and agent operations compared with common backend approaches.
templateEngine: [vento, md]
order: 3
---

# Compare backend workflows

These cases fit an application that already needs several durable runtimes. NetScript supplies
shared definitions and generated resource wiring; you still own the business effects, deployment
and persistence policy. The code shows the relevant boundary, not a complete application.

## Choose a scenario

{{ comp.scenarioPicker({ id: "backend", label: "Backend scenario", scenarios: backendScenarios }) }}

## When another backend is a better fit

Keep Nest when its Node ecosystem, dependency injection and existing workflow integrations meet
the need. Use Hono for a small HTTP service that does not need a coordinated worker estate.
Choose Encore when its infrastructure model and platform workflow suit how you want to operate.
Adding NetScript solely for one webhook or cron task adds a workspace and orchestration cost.

See the [capability table and trade-offs](/comparisons/#capability-table).
