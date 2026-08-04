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
