---
layout: layouts/base.vto
title: Comparisons
description: Six application scenarios, the integration boundaries they expose, and when to choose another stack.
templateEngine: [vento, md]
order: 1
---

# Compare NetScript

Choose by the application you need to operate. NetScript is most useful when services, background
work and the browser need shared contracts and resource wiring. These six cases show that fit;
they do not rank frameworks by speed or count files as a proxy for maintainability.

{{ comp.cardsGrid({ columns: 2, cards: [
  { eyebrow: "Web apps", title: "Live dashboard, versioned SaaS, admin form", body: "Three service-backed web cases, with checked NetScript code and the usual alternatives.", href: "/comparisons/frontend/" },
  { eyebrow: "Backend work", title: "Order lifecycle, ERP sync, agent operations", body: "Three cases that cross durable runtimes and operational boundaries.", href: "/comparisons/backend/" }
] }) }}

## Capability table

This is a map of integration choices, not an exclusivity checklist. Other stacks can provide each
capability. Links lead to their own documentation; the scenario pages explain the comparison.

| Need | NetScript composition | Common alternative | Cost that remains |
| --- | --- | --- | --- |
| Typed service calls | Shared oRPC contracts and discovery-aware SDK clients | [Hono RPC](https://hono.dev/docs/guides/rpc), [Encore typed services](https://encore.dev/docs/ts) | Version rollout and independently deployed consumers |
| Durable order state | Saga definitions, configured state stores, trigger ingress and worker dispatch | [Nest durable workflows](https://docs.nestjs.com/reliability/workflows) and queue integrations | Idempotent effects, compensation and storage operations |
| Scheduled polyglot work | Scheduled triggers, jobs and task runtime adapters | [Nest scheduling](https://docs.nestjs.com/application/task-scheduling) with a queue and subprocess integration | Interpreter installation, OS isolation and retry-safe imports |
| Live UI state | Durable stream producers and Fresh reactive collections | App-owned realtime transport or a hosted data service; [Next streaming](https://nextjs.org/docs/app/getting-started/fetching-data) covers HTML delivery | Stream authorization, retention and recovery after expired offsets |
| Validated admin forms | Fresh withForm, server schemas, session SDK calls and trace names | [Next forms](https://nextjs.org/docs/app/guides/forms), [SvelteKit actions](https://svelte.dev/docs/kit/form-actions) | Backend authorization and application mutations |
| Agent operations | One MCP surface for docs, runtime health, telemetry and API discovery | [Encore MCP](https://encore.dev/docs/mcp), [Next MCP](https://nextjs.org/docs/app/guides/mcp), [Nest MCP](https://docs.nestjs.com/observability/mcp-server) | Running resources, available telemetry and tool permissions |

## When to choose the other

- **One HTTP process:** Fresh or Hono can meet the need with less orchestration.
- **An established UI ecosystem:** keep Next/React, Nuxt/Vue or SvelteKit when that ecosystem is
  the stronger constraint. NetScript’s web layer is Fresh and Preact.
- **An existing Node service estate:** Nest’s providers, operational tools and workflow support
  may already solve the integration problem.
- **A platform-managed infrastructure model:** Encore may better match your team’s deployment
  preferences. NetScript is not a hosted infrastructure platform.
- **A stable API requirement:** NetScript is pre-1.0. Exact release pins make upgrades deliberate;
  they do not promise compatibility between releases.

NetScript adds a coordinated Deno workspace, plugin processes and an Aspire resource graph. Use
it when those joins are already part of the product. [Why NetScript](/why/) explains that trade;
the [quickstart](/quickstart/) lets you try the workflow.
