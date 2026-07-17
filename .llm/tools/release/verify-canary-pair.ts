/** Fail-closed CLI gate shared by stable publish entrypoints. */

import { resolveGithubToken } from '../agentic/lib/agentic-lib.ts';
import { CANARY_PAIR_STATUS_CONTEXT, verifyGreenCanaryPair } from './github-release.ts';

const DEFAULT_REPO = 'rickylabs/netscript';

export function parseRepo(argv: readonly string[]): string {
  let repo = DEFAULT_REPO;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--repo') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--repo requires owner/name.');
      repo = value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error(`Invalid GitHub repository: ${repo}`);
  return repo;
}

async function main(): Promise<void> {
  const repo = parseRepo(Deno.args);
  // Actions' GITHUB_TOKEN is an installation token: GET /user is not a valid
  // capability probe for it. The commit-status request below is the fail-closed
  // authorization and repository-scoped validation boundary.
  const { token, source } = await resolveGithubToken({
    preferEnv: 'GH_TOKEN',
    envOnly: true,
    validate: false,
  });
  console.error(`[release:verify-canary-pair] token source: ${source}`);
  const sha = await verifyGreenCanaryPair(repo, token);
  console.log(`${CANARY_PAIR_STATUS_CONTEXT} PASS for content ${sha}`);
}

if (import.meta.main) await main();
