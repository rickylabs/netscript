import { type DescribeHealthReport, evaluateDescribeFollow } from './describe-follow.ts';

/** One custom listener health report selected from captured Aspire describe evidence. */
export interface ListenerHealthReport {
  readonly resourceName: string;
  readonly healthCheckKey: string;
  readonly status: string;
  readonly description?: string;
}

/** Read a resource's named object-valued 13.5 health report without accepting array drift. */
export function readListenerHealthReport(
  topology: unknown,
  resourceName: string,
  healthCheckKey: string,
): ListenerHealthReport {
  const root = topology !== null && typeof topology === 'object' && !Array.isArray(topology)
    ? Object.fromEntries(Object.entries(topology))
    : undefined;
  const candidates = root ? Reflect.get(root, 'resources') : undefined;
  const resources = Array.isArray(candidates)
    ? candidates.map((candidate) => {
      if (
        candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)
      ) return candidate;
      const source = Object.fromEntries(Object.entries(candidate));
      return Reflect.has(source, 'state') ? source : { ...source, state: 'Running' };
    })
    : candidates;
  const line = `${JSON.stringify(root ? { ...root, resources } : topology)}\n`;
  const resource = evaluateDescribeFollow(line, [resourceName]).resources[0];
  if (!resource) throw new Error(`describe stream omitted ${resourceName}`);
  const report: DescribeHealthReport | undefined = resource.healthReports[healthCheckKey];
  if (!report) throw new Error(`${resourceName} omitted healthReports.${healthCheckKey}`);
  return {
    resourceName,
    healthCheckKey,
    status: report.status,
    ...(report.description === undefined ? {} : { description: report.description }),
  };
}
