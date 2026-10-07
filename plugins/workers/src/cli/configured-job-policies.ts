import { relative, resolve } from '@std/path';
import type { JobConfig, WorkersConfigData } from '@netscript/plugin-workers-core/config';

type DiscoveredJob = Readonly<{ path: string; source: 'local' | 'plugin' }>;

interface ConfiguredJob {
  readonly canonicalPath: string;
  readonly grouped: boolean;
  readonly origin: string;
  readonly policy: JobConfig;
}

/** Match normalized policies to discovered job modules, rejecting conflicting declarations. */
export function resolveConfiguredJobPolicies(
  projectRoot: string,
  jobs: readonly DiscoveredJob[],
  workers: WorkersConfigData,
): ReadonlyMap<string, JobConfig> {
  const discovered = new Map<string, DiscoveredJob>();
  jobs.forEach((job) => addDiscovered(job.path, job.source));
  const configuredByPath = new Map<string, ConfiguredJob>();
  const configuredById = new Map<string, ConfiguredJob>();
  workers.groups.forEach((group, groupIndex) =>
    group.jobs.forEach((policy, jobIndex) =>
      addConfiguredJob(policy, `workers.groups[${groupIndex}].jobs[${jobIndex}]`, true)
    )
  );
  workers.jobs.forEach((policy, index) =>
    addConfiguredJob(policy, `workers.jobs[${index}]`, false)
  );

  const matched = new Map<string, JobConfig>();
  for (const configured of configuredByPath.values()) {
    const discoveredJob = discovered.get(configured.canonicalPath);
    if (!discoveredJob) {
      const available = [...discovered.values()].map((entry) => entry.path).join(', ') || '(none)';
      throw new Error(
        `Workers config ${configured.origin} declares id "${configured.policy.id}" at "${configured.policy.entrypoint}", which resolves to unmatched project path "${configured.canonicalPath}". Discovered worker job files: ${available}.`,
      );
    }
    if (configured.policy.source !== discoveredJob.source) {
      throw new Error(
        `Workers config ${configured.origin} declares source "${configured.policy.source}" for id "${configured.policy.id}" at "${configured.canonicalPath}", but discovery identified that file as source "${discoveredJob.source}".`,
      );
    }
    matched.set(discoveredJob.path, configured.policy);
  }
  return matched;

  function addDiscovered(path: string, source: 'local' | 'plugin'): void {
    const canonicalPath = canonicalProjectPath(projectRoot, path);
    discovered.set(canonicalPath, { path, source });
  }

  function addConfiguredJob(policy: JobConfig, origin: string, grouped: boolean): void {
    const canonicalPath = configuredProjectPath(projectRoot, workers.jobsDir, policy.entrypoint);
    const configured = { canonicalPath, grouped, origin, policy } satisfies ConfiguredJob;
    const samePath = configuredByPath.get(canonicalPath);
    if (samePath) {
      if (samePath.policy.id !== policy.id) {
        throw new Error(
          `Workers config path "${canonicalPath}" is paired with conflicting ids "${samePath.policy.id}" (${samePath.origin}) and "${policy.id}" (${origin}).`,
        );
      }
      if (!grouped && samePath.grouped) {
        console.warn(
          `Workers config ${samePath.origin} wholly shadows flat ${origin} for id "${policy.id}" at "${canonicalPath}".`,
        );
        return;
      }
      throw new Error(
        `Workers config contains duplicate policies for id "${policy.id}" at "${canonicalPath}" (${samePath.origin} and ${origin}).`,
      );
    }

    const sameId = configuredById.get(policy.id);
    if (sameId && sameId.canonicalPath !== canonicalPath) {
      throw new Error(
        `Workers config id "${policy.id}" is paired with conflicting paths "${sameId.canonicalPath}" (${sameId.origin}) and "${canonicalPath}" (${origin}).`,
      );
    }
    configuredByPath.set(canonicalPath, configured);
    configuredById.set(policy.id, configured);
  }
}

function configuredProjectPath(projectRoot: string, jobsDir: string, entrypoint: string): string {
  const absoluteJobsDir = resolve(projectRoot, jobsDir.replaceAll('\\', '/'));
  return canonicalProjectPath(
    projectRoot,
    resolve(absoluteJobsDir, entrypoint.replaceAll('\\', '/')),
  );
}

function canonicalProjectPath(projectRoot: string, path: string): string {
  const absolute = resolve(projectRoot, path.replaceAll('\\', '/'));
  return relative(resolve(projectRoot), absolute).replaceAll('\\', '/');
}
