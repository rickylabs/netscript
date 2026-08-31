import resources from './aspire-13.5.3-resources.json' with { type: 'json' };
import spans from './aspire-13.5.3-spans.json' with { type: 'json' };

// Captured 2026-08-30 from Aspire Dashboard 13.5.3:
// GET <redacted-dashboard-url>/api/telemetry/spans and /api/telemetry/resources
// after triggering the scaffolded health-check worker job through the D-74 supervisor relay.
// The brief-scoped scratch lacked database.codegen and the streams plugin: no consumer/job.execute
// span or listed worker run, and 12 web /health 500s. This is environment/scope—not 13.5.3
// behavior; completed consumer coverage lives in the retained 13.4.6 case and scaffold.runtime.
export const aspireDashboardSpans1353Fixture: unknown = spans;
export const aspireDashboardResources1353Fixture: unknown = resources;
