const appHost = Deno.args[0];
if (!appHost) throw new Error('AppHost path argument is required');

const deadline = Date.now() + 90_000;
let last = 'resource absent';
while (Date.now() < deadline) {
  const result = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  if (!result.success) throw new Error(`aspire describe failed: ${stderr || stdout}`);
  const document = JSON.parse(stdout) as { resources?: readonly Resource[] };
  const resource = document.resources?.find((entry) => entry.displayName === 'readiness-dead-port');
  if (resource) {
    const reports = Array.isArray(resource.healthReports) ? resource.healthReports : [];
    last = `${resource.state ?? 'unknown'} / ${
      resource.healthStatus ?? 'unknown'
    } / ${reports.length} reports`;
    if (
      resource.state?.toLowerCase() === 'running' &&
      resource.healthStatus?.toLowerCase() !== 'healthy' &&
      reports.length > 0
    ) {
      console.log(`readiness-dead-port observed ${last}`);
      Deno.exit(0);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
throw new Error(
  `readiness-dead-port never exposed failed readiness evidence; last observed ${last}`,
);

interface Resource {
  readonly displayName?: string;
  readonly state?: string;
  readonly healthStatus?: string;
  readonly healthReports?: readonly unknown[];
}
