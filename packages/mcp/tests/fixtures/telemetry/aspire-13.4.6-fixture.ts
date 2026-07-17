import resources from './aspire-13.4.6-resources.json' with { type: 'json' };
import spans from './aspire-13.4.6-spans.json' with { type: 'json' };

// Captured 2026-07-17 from Aspire Dashboard 13.4.6:
// GET https://localhost:43909/api/telemetry/spans and /api/telemetry/resources
// after triggering the scaffolded health-check worker job.
export const aspireDashboardSpansFixture: unknown = spans;
export const aspireDashboardResourcesFixture: unknown = resources;
