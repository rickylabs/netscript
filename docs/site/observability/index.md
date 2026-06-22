---
layout: layouts/base.vto
title: Observability
templateEngine: [vento, md]
---

# Observability

Observability covers OpenTelemetry trace context, structured logging, service and background spans,
and the Aspire dashboard view of the workspace. Use this pillar when you need to add tracing,
inspect runtime behavior, or connect package-level telemetry to the running system.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Telemetry model", body: "Trace context and logging across services, workers, sagas, and orchestration.", href: "/explanation/observability/", icon: "O" },
  { eyebrow: "Quickstart", title: "Trace the architecture", body: "Read the architecture overview before following traces through the runtime.", href: "/concepts/", icon: "Q" },
  { eyebrow: "How-To", title: "Add OpenTelemetry", body: "Wire OTel into a workspace.", href: "/how-to/add-opentelemetry/", icon: "H" },
  { eyebrow: "API Reference", title: "telemetry", body: "Generated telemetry package symbols.", href: "/reference/telemetry/", icon: "R" },
  { eyebrow: "API Reference", title: "logger", body: "Generated logger package symbols.", href: "/reference/logger/", icon: "R" }
] }) }}
