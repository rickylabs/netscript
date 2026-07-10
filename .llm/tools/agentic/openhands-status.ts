/**
 * openhands-status.ts — read-only OpenHands run status for a PR/issue.
 *
 * After dispatching an OpenHands run, the supervisor needs the verdict without
 * hand-writing PowerShell. Two sources:
 *
 *   --source local  (default)  Read the committed run trace under
 *       .llm/tmp/run/openhands/pr-<n>/run-<id>/ — picks the newest run dir, reads
 *       metadata.json (verdict/model/outcomes) and the head of summary.md. No
 *       token, no network — the safe default.
 *   --source remote            Fetch the PR/issue comments via the GitHub REST
 *       API and parse the workflow-owned `## OpenHands Agent — X` status comment
 *       (the marker `<!-- openhands-agent-summary -->`). Needs a token from an
 *       env var (`--token-env`, default GH_TOKEN); used only as the Authorization
 *       header, never logged.
 *
 * Usage:
 *   deno run --allow-read .llm/tools/agentic/openhands-status.ts --pr 86 [--pretty]
 *   deno run --allow-read --allow-env --allow-net \
 *     .llm/tools/agentic/openhands-status.ts --source remote --repo rickylabs/netscript --pr 86
 *
 * Exit codes: 0 = status found · 1 = no status found · 2 = usage error ·
 * 4 = missing token (remote).
 */

import {
  githubRequest,
  OPENHANDS_MARKER,
  type OpenHandsStatus,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  readTokenFromEnv,
  requireValue,
} from './agentic-lib.ts';

interface Options {
  source: 'local' | 'remote';
  repo: string;
  pr?: number;
  issue?: number;
  repoRoot: string;
  traceDir?: string;
  tokenEnv: string;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/agentic/openhands-status.ts (--pr N | --issue N) [options]',
    '',
    'Options:',
    '  --source <local|remote>  local reads the committed trace (default, no token);',
    '                           remote fetches PR/issue comments via the API.',
    '  --repo <owner/name>      Repo for remote source. Default: rickylabs/netscript.',
    '  --pr <n> | --issue <n>   Target number. Required.',
    '  --repo-root <path>       Repo root for local trace lookup. Default: cwd.',
    '  --trace-dir <path>       Explicit run trace dir (skips newest-run discovery).',
    '  --token-env <name>       Env var with GitHub token (remote). Default: GH_TOKEN.',
    '  --pretty                 Human-readable output instead of JSON.',
    '  --help                   Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = {
    source: 'local',
    repo: 'rickylabs/netscript',
    repoRoot: Deno.cwd(),
    tokenEnv: 'GH_TOKEN',
    pretty: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--source': {
        const v = requireValue(args, i, a);
        if (v !== 'local' && v !== 'remote') throw new Error('--source must be local or remote');
        o.source = v;
        i++;
        break;
      }
      case '--repo':
        o.repo = requireValue(args, i, a);
        i++;
        break;
      case '--pr':
        o.pr = Number(requireValue(args, i, a));
        i++;
        break;
      case '--issue':
        o.issue = Number(requireValue(args, i, a));
        i++;
        break;
      case '--repo-root':
        o.repoRoot = requireValue(args, i, a);
        i++;
        break;
      case '--trace-dir':
        o.traceDir = requireValue(args, i, a);
        i++;
        break;
      case '--token-env':
        o.tokenEnv = requireValue(args, i, a);
        i++;
        break;
      case '--pretty':
        o.pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return o;
}

/** Find the newest run-* dir under .llm/tmp/run/openhands/pr-<n>/ (by name; ids are monotonic). */
async function newestTraceDir(repoRoot: string, number: number): Promise<string | null> {
  const base = `${repoRoot}/.llm/tmp/run/openhands/pr-${number}`;
  let entries: Deno.DirEntry[];
  try {
    entries = [];
    for await (const e of Deno.readDir(base)) entries.push(e);
  } catch {
    return null;
  }
  const runs = entries.filter((e) => e.isDirectory && e.name.startsWith('run-')).map((e) => e.name);
  if (runs.length === 0) return null;
  // run-<runId>-<attempt>: sort lexically with numeric awareness on the run id.
  runs.sort((a, b) => {
    const na = Number(a.replace(/^run-/, '').split('-')[0]);
    const nb = Number(b.replace(/^run-/, '').split('-')[0]);
    return nb - na;
  });
  return `${base}/${runs[0]}`;
}

async function localStatus(o: Options, number: number): Promise<number> {
  const dir = o.traceDir ?? await newestTraceDir(o.repoRoot, number);
  if (!dir) {
    console.log(
      o.pretty
        ? 'no local trace found'
        : JSON.stringify({ source: 'local', ok: false, found: false }),
    );
    return 1;
  }
  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = JSON.parse(await Deno.readTextFile(`${dir}/metadata.json`));
  } catch {
    metadata = null;
  }
  let summaryHead: string | null = null;
  try {
    const summary = await Deno.readTextFile(`${dir}/summary.md`);
    summaryHead = summary.split('\n').slice(0, 12).join('\n');
  } catch {
    summaryHead = null;
  }
  const payload = { source: 'local', ok: true, traceDir: dir, metadata, summaryHead };
  if (o.pretty) {
    console.log(`trace   : ${dir}`);
    if (metadata) {
      console.log(`verdict : ${metadata.verdict ?? '?'}`);
      console.log(`model   : ${metadata.model ?? '?'} (${metadata.provider ?? '?'})`);
      console.log(
        `outcome : bootstrap=${metadata.bootstrap_outcome ?? '?'} agent=${
          metadata.agent_outcome ?? '?'
        }`,
      );
      console.log(`run     : ${metadata.run_url ?? '?'}`);
    } else {
      console.log('metadata: (none)');
    }
    if (summaryHead) {
      console.log('--- summary head ---');
      console.log(summaryHead);
    }
  } else {
    console.log(JSON.stringify(payload));
  }
  return 0;
}

async function remoteStatus(o: Options, number: number): Promise<number> {
  const slug = parseRepoSlug(o.repo);
  const token = readTokenFromEnv(o.tokenEnv) ?? readTokenFromEnv('GITHUB_TOKEN');
  if (!token) {
    console.error(`No token in env ${o.tokenEnv} (or GITHUB_TOKEN) for remote source.`);
    return 4;
  }
  const res = await githubRequest(
    'GET',
    `/repos/${slug.owner}/${slug.repo}/issues/${number}/comments?per_page=100`,
    token,
  );
  if (!res.ok) {
    console.log(
      JSON.stringify({
        source: 'remote',
        ok: false,
        status: res.status,
        error: res.body?.message ?? res.body,
      }),
    );
    return 1;
  }
  const comments: Array<{ body?: string; html_url?: string; updated_at?: string }> =
    Array.isArray(res.body) ? res.body : [];
  const ohComments = comments.filter((c) => (c.body ?? '').includes(OPENHANDS_MARKER));
  if (ohComments.length === 0) {
    console.log(
      o.pretty
        ? 'no OpenHands status comment found'
        : JSON.stringify({ source: 'remote', ok: false, found: false }),
    );
    return 1;
  }
  const latest = ohComments[ohComments.length - 1];
  const status: OpenHandsStatus = parseOpenHandsStatusComment(latest.body ?? '');
  const payload = {
    source: 'remote',
    ok: true,
    commentUrl: latest.html_url ?? null,
    updatedAt: latest.updated_at ?? null,
    ...status,
  };
  if (o.pretty) {
    console.log(`comment : ${latest.html_url ?? '?'}`);
    console.log(
      `heading : ${status.heading ?? '?'} (verdict=${
        status.verdict ?? '?'
      }, final=${status.isFinal})`,
    );
    console.log(`model   : ${status.model ?? '?'} (${status.provider ?? '?'})`);
    console.log(`run     : ${status.runUrl ?? '?'}`);
  } else {
    console.log(JSON.stringify(payload));
  }
  return 0;
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }
  if (!o) return;

  const number = o.pr ?? o.issue;
  if (!number || !Number.isFinite(number)) {
    console.error('one of --pr or --issue (a number) is required. See --help.');
    Deno.exit(2);
  }

  const code = o.source === 'remote' ? await remoteStatus(o, number) : await localStatus(o, number);
  Deno.exit(code);
}

if (import.meta.main) await main();
