---
layout: layouts/base.vto
title: Observability
templateEngine: [vento, md]
---

# Observability

The most expensive turn in any change loop — whether the author is you or an AI agent — is the
verification turn: *did the change actually work, across every process it touched?* This pillar is
how NetScript answers it. The runtimes emit real OpenTelemetry spans, a single W3C `traceparent`
groups a cross-process flow into one distributed trace, structured logs ride the same OTLP export,
and both a dashboard and a **typed query port** read it all back — for you, or for an agent
verifying its own change. Use this pillar when you need to add tracing, inspect runtime behavior,
or connect package-level telemetry to the running system.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Telemetry model", body: "Trace context and logging across services, workers, sagas, and orchestration.", href: "/explanation/observability/", icon: "O" },
  { eyebrow: "Quickstart", title: "Turn on tracing", body: "Run aspire start, trigger a job, and watch the runtime's automatic spans land in the dashboard — the lowest-effort path to a first trace.", href: "/observability/telemetry/", icon: "Q" },
  { eyebrow: "How-To", title: "Add OpenTelemetry", body: "Wire OTel into a workspace.", href: "/observability/how-to/add-opentelemetry/", icon: "H" },
  { eyebrow: "API Reference", title: "telemetry", body: "Generated telemetry package symbols.", href: "/reference/telemetry/", icon: "R" },
  { eyebrow: "API Reference", title: "logger", body: "Generated logger package symbols.", href: "/reference/logger/", icon: "R" }
] }) }}

## Where to go next

Telemetry in NetScript is built-in, not bolted-on — the fastest route is to see a trace first, then
learn the model:

- **Emit and view a trace:** {{ comp.xref({ key: "cap:telemetry", text: "Telemetry & logging" }) }}
  is the capability hub — automatic worker spans, the `@netscript/telemetry` helpers, browser logs,
  and the dashboard views, with {{ comp.xref({ key: "howto:add-opentelemetry", text: "Add OpenTelemetry" }) }}
  as the task recipe.
- **Understand the model:** {{ comp.xref({ key: "explain:observability", text: "Observability" }) }}
  maps what is framework-real versus a scaffold stub, and how trace context propagates across process
  boundaries.
- **See where telemetry is collected:** {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }}
  explains the dashboard and OTLP collector the AppHost provisions; trace context crosses service
  boundaries at the {{ comp.xref({ key: "cap:services", text: "services" }) }} seam.
- **Read a trace back in code:** the {{ comp.xref({ key: "cap:telemetry", text: "Telemetry & logging" }) }}
  hub's *Close the loop* section covers the typed `TelemetryQueryPort` read side — how a test or an
  agent asserts a span landed instead of eyeballing the dashboard.
- **Look up exact symbols:** {{ comp.xref({ key: "ref:telemetry", text: "telemetry" }) }} and
  {{ comp.xref({ key: "ref:logger", text: "logger" }) }} references, and the
  [telemetry convention](/reference/telemetry/convention/) (span naming, SpanKind, the `netscript.*`
  attribute rules).
