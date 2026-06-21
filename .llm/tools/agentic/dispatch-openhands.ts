/**
 * dispatch-openhands.ts — validate and post an `@openhands-agent` trigger comment.
 *
 * The supervisor hands evaluation/implementation work to the OpenHands GitHub
 * Action by commenting `@openhands-agent model=… output=… iterations=…` on a PR
 * or issue. This tool enforces the handoff contract before dispatch (the prompt
 * MUST begin with `use harness` and carry a `## SKILL` chapter) and posts the
 * comment via the GitHub REST API.
 *
 * Token handling (classifier-enforced): the PAT is read from an env var the
 * supervisor sets in-process (`--token-env`, default GH_TOKEN -> GITHUB_TOKEN
 * fallback) and used ONLY as the Authorization header. It is never written to a
 * file, passed on argv, or echoed. `--dry-run` needs no token and makes no
 * network call.
 *
 * OpenHands concurrency note: many `@openhands-agent` comments on one PR cancel
 * all-but-one pending run. Dispatch one trigger per intended run. A PR-comment
 * trigger checks out the PR branch; an issue-comment trigger checks out the
 * default branch. Cloud-chained events need PAT_TOKEN, not GITHUB_TOKEN.
 *
 * Modes:
 *   (default)    Validate prompt -> build comment -> POST it.
 *   --dry-run    Validate + print the target, trigger line, and full comment body
 *                without posting and without needing a token.
 *
 * Usage:
 *   deno run --allow-read --allow-env --allow-net \
 *     .llm/tools/agentic/dispatch-openhands.ts \
 *     --repo rickylabs/netscript --pr 86 \
 *     --prompt-file <win-path> --model openrouter/qwen/qwen3.7-max \
 *     --output pr-comment --iterations 800 [--provider openrouter] \
 *     [--token-env GH_TOKEN] [--dry-run] [--pretty]
 *
 * Exit codes: 0 = ok / dry-run clean · 1 = post failed · 2 = usage error ·
 * 3 = prompt contract violation · 4 = missing token (non-dry-run).
 */

import {
  buildOpenHandsComment,
  githubRequest,
  parseRepoSlug,
  requireValue,
  resolveGithubToken,
  validateHandoffContract,
} from './agentic-lib.ts';

interface Options {
  repo: string;
  pr?: number;
  issue?: number;
  promptFile?: string;
  model?: string;
  output?: string;
  iterations?: string;
  provider?: string;
  tokenEnv: string;
  dryRun: boolean;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-env --allow-net \\',
    '    .llm/tools/agentic/dispatch-openhands.ts --repo owner/name (--pr N | --issue N) \\',
    '    --prompt-file <win path> [options]',
    '',
    'Options:',
    '  --repo <owner/name>   Target repo. Default: rickylabs/netscript.',
    '  --pr <n>              Target PR number (checks out PR branch).',
    '  --issue <n>           Target issue number (checks out default branch).',
    '  --prompt-file <path>  Windows path to the dispatch prompt (validated for contract). Required.',
    '  --model <id>          Literal LiteLLM model id (e.g. openrouter/qwen/qwen3.7-max).',
    '  --output <mode>       pr-comment | respond-comments | thread-replies | summary-only.',
    '  --iterations <n>      Max agent iterations (50-3000).',
    '  --provider <name>     Provider gateway override (e.g. openrouter).',
    '  --token-env <name>    Env var holding the GitHub token. Default: GH_TOKEN.',
    '  --dry-run             Validate + print comment without posting (no token needed).',
    '  --pretty              Human-readable output instead of JSON.',
    '  --help                Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = {
    repo: 'rickylabs/netscript',
    tokenEnv: 'GH_TOKEN',
    dryRun: false,
    pretty: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
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
      case '--prompt-file':
        o.promptFile = requireValue(args, i, a);
        i++;
        break;
      case '--model':
        o.model = requireValue(args, i, a);
        i++;
        break;
      case '--output':
        o.output = requireValue(args, i, a);
        i++;
        break;
      case '--iterations':
        o.iterations = requireValue(args, i, a);
        i++;
        break;
      case '--provider':
        o.provider = requireValue(args, i, a);
        i++;
        break;
      case '--token-env':
        o.tokenEnv = requireValue(args, i, a);
        i++;
        break;
      case '--dry-run':
        o.dryRun = true;
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

  if (!o.promptFile) {
    console.error('--prompt-file is required. See --help.');
    Deno.exit(2);
  }
  const number = o.pr ?? o.issue;
  if (!number || !Number.isFinite(number)) {
    console.error('one of --pr or --issue (a number) is required. See --help.');
    Deno.exit(2);
  }
  let slug;
  try {
    slug = parseRepoSlug(o.repo);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }

  // 1) Validate the dispatch-prompt contract.
  const content = await Deno.readTextFile(o.promptFile);
  const check = validateHandoffContract(content);
  if (!check.ok) {
    console.log(
      o.pretty
        ? `FAIL prompt contract: ${check.problems.join('; ')}`
        : JSON.stringify({ stage: 'validate', ok: false, problems: check.problems }),
    );
    Deno.exit(3);
  }

  // 2) Build the trigger comment.
  const comment = buildOpenHandsComment({
    model: o.model,
    outputMode: o.output,
    iterations: o.iterations,
    provider: o.provider,
    prompt: content,
  });
  const triggerLine = comment.split('\n')[0];
  const endpoint = `/repos/${slug.owner}/${slug.repo}/issues/${number}/comments`;

  // 3a) Dry-run: print without posting; no token required.
  if (o.dryRun) {
    if (o.pretty) {
      console.log('DRY-RUN ok');
      console.log(`  target   : ${slug.owner}/${slug.repo} #${number} (${o.pr ? 'pr' : 'issue'})`);
      console.log(`  trigger  : ${triggerLine}`);
      console.log(`  endpoint : POST ${endpoint}`);
      console.log(`  bytes    : ${new TextEncoder().encode(comment).length}`);
      console.log('  --- comment body ---');
      console.log(comment);
    } else {
      console.log(JSON.stringify({
        mode: 'dry-run',
        ok: true,
        repo: o.repo,
        number,
        kind: o.pr ? 'pr' : 'issue',
        triggerLine,
        endpoint,
        commentBytes: new TextEncoder().encode(comment).length,
        comment,
      }));
    }
    Deno.exit(0);
  }

  // 3b) Real post: resolve a validated token from any healthy source; never logged.
  let token: string;
  try {
    const resolved = await resolveGithubToken({ preferEnv: o.tokenEnv });
    console.error(`[dispatch-openhands] token source: ${resolved.source}`);
    token = resolved.token;
  } catch (e) {
    console.error((e as Error).message);
    Deno.exit(4);
    return;
  }
  const res = await githubRequest('POST', endpoint, token, { body: comment });
  if (!res.ok) {
    console.log(
      JSON.stringify({ ok: false, status: res.status, error: res.body?.message ?? res.body }),
    );
    Deno.exit(1);
  }
  const url = res.body?.html_url ?? null;
  console.log(
    o.pretty
      ? `POSTED ${triggerLine} -> ${url}`
      : JSON.stringify({ ok: true, status: res.status, commentUrl: url, triggerLine }),
  );
  Deno.exit(0);
}

if (import.meta.main) await main();
