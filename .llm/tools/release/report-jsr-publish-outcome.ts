import { discoverWorkspaceMembers } from './publish-workspace.ts';
import { readRegistryVersions } from './canary.ts';

export type PublishOutcomeKind = 'none' | 'partial' | 'complete';
export interface PublishOutcome {
  readonly kind: PublishOutcomeKind;
  readonly published: readonly string[];
  readonly missing: readonly string[];
}

/** Observe exact-version registry presence after a failed coordinated publish. */
export async function reportJsrPublishOutcome(
  version: string,
  packageNames: readonly string[],
  readVersions: (name: string) => Promise<readonly string[] | null> = readRegistryVersions,
): Promise<PublishOutcome> {
  const published: string[] = [];
  const missing: string[] = [];
  for (const name of packageNames) {
    const versions = await readVersions(name);
    (versions?.includes(version) ? published : missing).push(name);
  }
  const kind: PublishOutcomeKind = published.length === 0
    ? 'none'
    : missing.length === 0
    ? 'complete'
    : 'partial';
  return { kind, published, missing };
}

if (import.meta.main) {
  const versionIndex = Deno.args.indexOf('--version');
  const version = versionIndex >= 0 ? Deno.args[versionIndex + 1] : undefined;
  if (!version) throw new Error('--version requires the failed canary version.');
  const members = await discoverWorkspaceMembers();
  console.log(JSON.stringify(await reportJsrPublishOutcome(version, members.map((m) => m.name))));
}
