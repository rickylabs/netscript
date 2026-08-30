/** Aspire 13.4.6-style describe output with banner noise and top-level resources. */
export const ASPIRE_DESCRIBE_FIXTURE = `Aspire CLI 13.4.6
{
  "resources": [
    {
      "name": "users-yqkcrqst",
      "displayName": "users",
      "properties": { "executable.workDir": "/project/services/users" },
      "urls": [{ "name": "http", "url": "http://localhost:43127" }]
    },
    {
      "name": "billing-abcdefgh",
      "properties": { "executable.workDir": "/project/services/billing" },
      "urls": [{ "name": "http", "url": "http://127.0.0.2:43128" }]
    },
    {
      "name": "postgres-qqqqqqqq",
      "displayName": "postgres",
      "urls": []
    }
  ]
}`;

/** Bannerless Aspire 13.5.3 describe snapshot derived from the S2 V5 receipt. */
export const ASPIRE_DESCRIBE_13_5_3_FIXTURE: string = `{
  "resources": [
    {
      "name": "users-yvbcumea",
      "displayName": "users",
      "resourceType": "Executable",
      "state": "Running",
      "healthStatus": "Healthy",
      "dashboardUrl": "https://localhost:42501/?resource=users-yvbcumea",
      "relationships": [
        { "type": "Reference", "resourceName": "aspire-13-5-postgres-db" },
        { "type": "WaitFor", "resourceName": "aspire-13-5-postgres-db" }
      ],
      "urls": [{ "name": "http", "url": "http://localhost:3001" }],
      "volumes": [],
      "properties": {
        "executable.path": "deno",
        "executable.pid": 4312,
        "executable.workDir": "/project/services/users",
        "resource.appArgs": ["run", "--allow-net", "src/main.ts"],
        "resource.appArgsSensitivity": [0, 0, 0]
      },
      "environment": {
        "DATABASE_PROVIDER": "postgres",
        "DATABASE_URL": "REDACTED",
        "DB_PROVIDER": "postgres",
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:42043",
        "OTEL_RESOURCE_ATTRIBUTES": "service.instance.id=yvbcumea",
        "OTEL_SERVICE_NAME": "users",
        "PORT": "43515",
        "POSTGRES_URI": "REDACTED",
        "SSL_CERT_DIR": "/tmp/aspire-dcp-REDACTED/users-yvbcumea/certs:/usr/lib/ssl/certs"
      },
      "healthReports": {
        "users_http_/health_200_check": { "status": "Healthy" }
      },
      "commands": {
        "restart": {
          "displayName": "Restart",
          "description": "Restart resource",
          "state": "Enabled",
          "sortOrder": 2
        },
        "stop": {
          "displayName": "Stop",
          "description": "Stop resource",
          "state": "Enabled",
          "sortOrder": 1
        }
      }
    }
  ]
}`;

/** Shared service configuration with pinned, legacy, and dynamically allocated ports. */
export const APPSETTINGS_FIXTURE = {
  NetScript: {
    Services: {
      billing: { Runtime: 'deno', HostPort: 43128 },
      legacy: { Runtime: 'deno', Port: 43129 },
      users: { Runtime: 'deno' },
    },
  },
};
