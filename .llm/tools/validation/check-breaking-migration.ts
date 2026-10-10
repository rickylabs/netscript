import { isBreakingPullRequest, migrationNote } from '../release/canary-notes.ts';
import { GITHUB_API_BASE_URL } from '../release/config/endpoints.ts';
import type { CanaryPullRequestDetails } from '../release/canary-notes.ts';

/** Share the release composer's breaking/migration contract with the PR merge check. */
export function breakingMigrationFindings(pr: CanaryPullRequestDetails): readonly string[] {
  return isBreakingPullRequest(pr) && !migrationNote(pr.body)
    ? [
      'Breaking PR: migration note missing. Add a nonempty ## Breaking change and migration section.',
    ]
    : [];
}

if (import.meta.main) {
  const args = Deno.args;
  const repo = args[args.indexOf('--repo') + 1];
  const number = args[args.indexOf('--pr') + 1];
  if (
    !args.includes('--repo') || !args.includes('--pr') ||
    !/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(number)
  ) {
    throw new Error('Usage: check-breaking-migration.ts --repo owner/name --pr number');
  }
  const token = Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN');
  if (!token) throw new Error('GitHub token required.');
  const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${repo}/pulls/${number}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`PR metadata lookup failed: HTTP ${response.status}`);
  const pr = await response.json() as {
    title: string;
    body: string | null;
    labels: { name: string }[];
  };
  const findings = breakingMigrationFindings({
    title: pr.title,
    body: pr.body ?? '',
    labels: pr.labels.map((label) => label.name),
  });
  console.log(JSON.stringify({ gate: 'breaking-migration', ok: !findings.length, findings }));
  Deno.exit(findings.length ? 1 : 0);
}
