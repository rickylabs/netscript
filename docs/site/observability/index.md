---
layout: layouts/base.vto
title: Observability
templateEngine: [vento, md]
---

# Observability

This section covers tracing, logging and reading telemetry back across every process in a NetScript
app.

The runtimes emit OpenTelemetry spans, a single W3C `traceparent` groups a cross-process flow into one
distributed trace, and structured logs ride the same OTLP export. The Aspire dashboard and a typed
query port both read it back, so you, a test or an agent can check that a change worked across every
process it touched.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Concept", title: "Telemetry & logging", body: "Automatic spans, the `@netscript/telemetry` helpers, browser logs, the dashboard views and the typed query port.", href: "/observability/telemetry/" },
  { eyebrow: "How-to", title: "Add OpenTelemetry", body: "Trigger a trace, add your own spans and read them in the dashboard.", href: "/observability/how-to/add-opentelemetry/" },
  { eyebrow: "Explanation", title: "Observability", body: "What is framework-real versus a scaffold stub, and how trace context crosses process boundaries.", href: resolveXref("explain:observability").href },
  { eyebrow: "Concept", title: "Trace the request model", body: "Follow one request through services, jobs and streams in the core-concepts tour.", href: resolveXref("concept:concepts").href },
  { eyebrow: "Reference", title: "`@netscript/telemetry`", body: "Generated API reference for the telemetry package.", href: resolveXref("ref:telemetry").href },
  { eyebrow: "Reference", title: "`@netscript/logger`", body: "Generated API reference for the structured logger.", href: resolveXref("ref:logger").href }
] }) }}
