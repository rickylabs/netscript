const ASPIRE_DESCRIBE_RESOURCES = {
  resources: [
    {
      name: 'users-yqkcrqst',
      displayName: 'users',
      resourceType: 'Executable',
      state: 'Running',
      healthStatus: 'Healthy',
      dashboardUrl: 'https://localhost:46251/?resource=users-yqkcrqst',
      relationships: [],
      urls: [{ name: 'http', url: 'http://localhost:43127' }],
      volumes: [],
      properties: { 'executable.workDir': '/project/services/users' },
      environment: { DATABASE_URL: 'REDACTED', PORT: '43127' },
      healthReports: {},
      commands: {},
    },
    {
      name: 'billing-abcdefgh',
      displayName: 'billing',
      resourceType: 'Executable',
      state: 'Running',
      urls: [{ name: 'http', url: 'http://127.0.0.2:43128' }],
      volumes: [],
      properties: { 'executable.workDir': '/project/services/billing' },
      environment: { PORT: '43128' },
      healthReports: {},
      commands: {},
    },
    {
      name: 'postgres-qqqqqqqq',
      displayName: 'postgres',
      resourceType: 'Container',
      state: 'Running',
      urls: [],
      volumes: [],
      properties: {},
      environment: { POSTGRES_PASSWORD: 'REDACTED' },
      healthReports: {},
      commands: {},
    },
  ],
};

/** Banner-prefixed describe snapshots for every retained Aspire compatibility version. */
export const ASPIRE_DESCRIBE_FIXTURES: readonly {
  readonly version: string;
  readonly output: string;
}[] = [
  {
    version: '13.4.6',
    output: `Aspire CLI 13.4.6\n${JSON.stringify(ASPIRE_DESCRIBE_RESOURCES)}`,
  },
  {
    version: '13.5.3',
    output: `Aspire CLI 13.5.3\n${JSON.stringify(ASPIRE_DESCRIBE_RESOURCES)}`,
  },
];

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
