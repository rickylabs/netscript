/** Generic banner-prefixed describe output exercising leading-banner noise tolerance. */
export const ASPIRE_DESCRIBE_FIXTURE = `Aspire CLI 17.0.0
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

/** Bannerless Aspire 17.0.0 describe snapshot captured from a live native-Deno AppHost. */
export const ASPIRE_DESCRIBE_17_0_0_FIXTURE: string = `{
  "resources": [
    {
      "name": "users-aqctbjac",
      "displayName": "users",
      "resourceType": "Executable",
      "resourceTypeDisplayName": "Deno",
      "state": "Running",
      "healthStatus": "Healthy",
      "dashboardUrl": "https://localhost:35797/?resource=users-aqctbjac",
      "relationships": [
        { "type": "Reference", "resourceName": "cap-web-sddmysmn" }
      ],
      "urls": [{ "name": "http", "url": "http://localhost:45215" }],
      "volumes": [],
      "properties": {
        "executable.path": "deno",
        "executable.pid": 4312,
        "executable.workDir": "/project/services/users",
        "resource.appArgs": [
          "run",
          "--allow-net",
          "--allow-read",
          "--allow-env",
          "--node-modules-dir=none",
          "--minimum-dependency-age=0",
          "src/main.ts"
        ],
        "resource.appArgsSensitivity": [0, 0, 0, 0, 0, 0, 0],
        "resource.launchConfigurationType": "deno"
      },
      "environment": {
        "DATABASE_PROVIDER": "sqlite",
        "DATABASE_URL": "REDACTED",
        "DB_PROVIDER": "sqlite",
        "NETSCRIPT_CORS_ORIGINS": "http://localhost:36775",
        "OTEL_DENO": "true",
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:41791",
        "OTEL_RESOURCE_ATTRIBUTES": "service.version=1.0.0,service.instance.id=aqctbjac",
        "OTEL_SERVICE_NAME": "users",
        "PORT": "25603",
        "SQLITE_URI": "REDACTED",
        "SSL_CERT_DIR": "/tmp/aspire-dcp-REDACTED/users-aqctbjac/certs:/usr/lib/ssl/certs"
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
