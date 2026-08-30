import resources from './aspire-13.5.3-resources.json' with { type: 'json' };
import spans from './aspire-13.5.3-spans.json' with { type: 'json' };

// Captured 2026-08-30 from Aspire Dashboard 13.5.3:
// GET <redacted-dashboard-url>/api/telemetry/spans and /api/telemetry/resources
// after triggering the scaffolded health-check worker job.
export const aspireDashboardSpans1353Fixture: unknown = spans;
export const aspireDashboardResources1353Fixture: unknown = resources;
