import resources from './aspire-17.0.0-resources.json' with { type: 'json' };
import spans from './aspire-17.0.0-spans.json' with { type: 'json' };

// Aspire Dashboard 17.0.0 telemetry envelopes (GET /api/telemetry/resources and
// /api/telemetry/spans), including service.version + service.instance.id resource attributes
// verified against Aspire 17.0.0+2d325b13 and full workers producer/consumer job execution spans.
export const aspireDashboardSpans1700Fixture: unknown = spans;
export const aspireDashboardResources1700Fixture: unknown = resources;
