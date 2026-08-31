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
 * file, passed on argv, or echoed. A non-formal `--dry-run` needs no token and
 * makes no network call. Formal `--phase` mode always resolves a token and the
 * live PR head, including for dry-run output.
 *
 * OpenHands concurrency note: many `@openhands-agent` comments on one PR cancel
 * all-but-one pending run. Dispatch one trigger per intended run. A PR-comment
 * trigger checks out the PR branch; an issue-comment trigger checks out the
 * default branch. Cloud-chained events need PAT_TOKEN, not GITHUB_TOKEN.
 *
 * Verdict output contract: by default the dispatched prompt gets a standard
 * epilogue (appendVerdictContractEpilogue) instructing the agent to post the
 * formal verdict PR comment EARLY and to end both the PR comment and its summary
 * file with a machine-readable `OPENHANDS_VERDICT: <token>` line — the line
 * watch-openhands-verdict.ts greps for. Pass --no-verdict-contract for
 * non-eval dispatches (implementation asks) that should not carry it.
 *
 * Modes:
 *   (default)    Validate prompt -> build comment -> POST it.
 *   --dry-run    Validate + print the target, trigger line, and full comment body
 *                without posting. Formal mode still reads the live PR head.
 *
 * Usage:
 *   deno run --allow-read --allow-env --allow-net \
 *     .llm/tools/agentic/openhands/dispatch-openhands.ts \
 *     --repo rickylabs/netscript --pr 86 \
 *     --prompt-file <win-path> --model <open-model-id> \
 *     --output pr-comment --iterations 800 [--provider openrouter] \
 *     [--phase plan|impl] \
 *     [--token-env GH_TOKEN] [--dry-run] [--pretty]
 *
 * Exit codes: 0 = ok / dry-run clean · 1 = post failed · 2 = usage error ·
 * 3 = prompt contract violation · 4 = missing token (non-dry-run).
 */

import {
  appendVerdictContractEpilogue,
  buildOpenHandsComment,
  githubField,
  githubRequest,
  type GitHubResponse,
  type OpenHandsDispatchPhase,
  parseRepoSlug,
  requireValue,
  type ResolvedGithubToken,
  resolveGithubToken,
  validateHandoffContract,
} from '../lib/agentic-lib.ts';
import { requestedLaunchIdentity } from '../runtime/launch-route-identity.ts';
import { OPEN_EVALUATOR_MODEL_IDS, OPENROUTER_MODEL_IDS } from '../config/models.ts';

interface Options {
  repo: string;
  pr?: number;
  issue?: number;
  promptFile?: string;
  model?: string;
  output?: string;
  iterations?: string;
  provider?: string;
  effort?: string;
  phase?: OpenHandsDispatchPhase;
  tokenEnv: string;
  verdictContract: boolean;
  dryRun: boolean;
  pretty: boolean;
}

export interface DispatchOpenHandsDependencies {
  readTextFile(path: string): Promise<string>;
  resolveGithubToken(options: { preferEnv: string }): Promise<ResolvedGithubToken>;
  githubRequest(
    method: string,
    path: string,
    token: string,
    body?: unknown,
  ): Promise<GitHubResponse>;
}

export interface DispatchOpenHandsOutput {
  log(value: string): void;
  error(value: string): void;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-env --allow-net \\',
    '    .llm/tools/agentic/openhands/dispatch-openhands.ts --repo owner/name (--pr N | --issue N) \\',
    '    --prompt-file <win path> [options]',
    '',
    'Options:',
    '  --repo <owner/name>   Target repo. Default: rickylabs/netscript.',
    '  --pr <n>              Target PR number (checks out PR branch).',
    '  --issue <n>           Target issue number (checks out default branch).',
    '  --prompt-file <path>  Windows path to the dispatch prompt (validated for contract). Required.',
    `  --model <id>          Literal LiteLLM model id (e.g. openrouter/${OPENROUTER_MODEL_IDS.planEvaluator}).`,
    '  --output <mode>       pr-comment | respond-comments | thread-replies | summary-only.',
    '  --iterations <n>      Max agent iterations (50-3000).',
    '  --provider <name>     Provider gateway override (e.g. openrouter).',
    '  --effort <level>      Required low|medium|high|xhigh|max effort identity.',
    '  --phase <phase>       Formal evaluator phase: plan | impl. PR-only; resolves live head.',
    '  --token-env <name>    Env var holding the GitHub token. Default: GH_TOKEN.',
    '  --no-verdict-contract Skip the verdict output-contract epilogue (for non-eval',
    '                        dispatches, e.g. implementation asks). Default: appended.',
    '  --dry-run             Validate + print without posting; formal mode still reads live head.',
    '  --pretty              Human-readable output instead of JSON.',
    '  --help                Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = {
    repo: 'rickylabs/netscript',
    tokenEnv: 'GH_TOKEN',
    verdictContract: true,
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
      case '--effort':
        o.effort = requireValue(args, i, a);
        i++;
        break;
      case '--phase': {
        const phase = requireValue(args, i, a);
        if (phase !== 'plan' && phase !== 'impl') throw new Error('--phase must be plan or impl');
        o.phase = phase;
        i++;
        break;
      }
      case '--token-env':
        o.tokenEnv = requireValue(args, i, a);
        i++;
        break;
      case '--no-verdict-contract':
        o.verdictContract = false;
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

/** Execute one dispatch CLI request through injected file, token, and GitHub ports. */
export async function runDispatchOpenHands(
  args: string[],
  dependencies: DispatchOpenHandsDependencies,
  output: DispatchOpenHandsOutput,
): Promise<number> {
  let o: Options | null;
  try {
    o = parseArgs(args);
  } catch (e) {
    output.error(e instanceof Error ? e.message : String(e));
    return 2;
  }
  if (!o) return 0;

  if (!o.promptFile) {
    output.error('--prompt-file is required. See --help.');
    return 2;
  }
  let requested;
  try {
    requested = requestedLaunchIdentity(o);
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
  const openRouterModel = requested.model.replace(/^openrouter\//, '');
  if (!OPEN_EVALUATOR_MODEL_IDS.some((model) => model === openRouterModel)) {
    output.error(
      `OpenHands evaluator model must be one of: ${
        OPEN_EVALUATOR_MODEL_IDS.map((model) => `openrouter/${model}`).join(', ')
      }`,
    );
    return 2;
  }
  const number = o.pr ?? o.issue;
  if (!number || !Number.isFinite(number)) {
    output.error('one of --pr or --issue (a number) is required. See --help.');
    return 2;
  }
  if (o.phase && !o.pr) {
    output.error('Formal OpenHands dispatch requires --pr; issue targets are non-formal only.');
    return 2;
  }
  if (o.phase && !o.verdictContract) {
    output.error('Formal OpenHands dispatch requires the verdict output contract.');
    return 2;
  }
  let slug;
  try {
    slug = parseRepoSlug(o.repo);
  } catch (e) {
    output.error(e instanceof Error ? e.message : String(e));
    return 2;
  }

  // 1) Validate the dispatch-prompt contract.
  const content = await dependencies.readTextFile(o.promptFile);
  const check = validateHandoffContract(content);
  if (!check.ok) {
    output.log(
      o.pretty
        ? `FAIL prompt contract: ${check.problems.join('; ')}`
        : JSON.stringify({ stage: 'validate', ok: false, problems: check.problems }),
    );
    return 3;
  }

  // 2) Prepare everything that cannot affect formal head currency.
  const prompt = o.verdictContract ? appendVerdictContractEpilogue(content) : content;
  const endpoint = `/repos/${slug.owner}/${slug.repo}/issues/${number}/comments`;
  let token: string | undefined;
  let head: string | undefined;

  // 3) Formal mode resolves the live PR head as the final external operation before emission.
  if (o.phase) {
    try {
      const resolved = await dependencies.resolveGithubToken({ preferEnv: o.tokenEnv });
      output.error(`[dispatch-openhands] token source: ${resolved.source}`);
      token = resolved.token;
    } catch (e) {
      output.error((e as Error).message);
      return 4;
    }
    const livePr = await dependencies.githubRequest(
      'GET',
      `/repos/${slug.owner}/${slug.repo}/pulls/${o.pr}`,
      token,
    );
    if (!livePr.ok) {
      output.log(JSON.stringify({
        ok: false,
        status: livePr.status,
        error: githubField(livePr.body, 'message') ?? livePr.body,
      }));
      return 1;
    }
    const liveHead = githubField(githubField(livePr.body, 'head'), 'sha');
    head = typeof liveHead === 'string' ? liveHead : '';
  }

  // 4) Emit the trigger only after the formal head read has completed.
  const triggerComment = buildOpenHandsComment({
    model: o.model,
    outputMode: o.output,
    iterations: o.iterations,
    provider: o.provider,
    effort: o.effort,
    phase: o.phase,
    head,
    prompt,
  });
  const comment =
    `${triggerComment}\n\n<!-- route-identity requested provider=${requested.provider} model=${requested.model} effort=${requested.effort}; observed provider=pending model=pending effort=pending -->`;
  const triggerLine = comment.split('\n')[0];

  // 5a) Dry-run: non-formal mode needs no token; formal mode used one for the live PR read.
  if (o.dryRun) {
    if (o.pretty) {
      output.log('DRY-RUN ok');
      output.log(
        `  target   : ${slug.owner}/${slug.repo} #${number} (${o.pr ? 'pr' : 'issue'})`,
      );
      output.log(`  trigger  : ${triggerLine}`);
      output.log(`  endpoint : POST ${endpoint}`);
      output.log(`  contract : verdict epilogue ${o.verdictContract ? 'appended' : 'skipped'}`);
      output.log(`  bytes    : ${new TextEncoder().encode(comment).length}`);
      output.log('  --- comment body ---');
      output.log(comment);
    } else {
      output.log(JSON.stringify({
        mode: 'dry-run',
        ok: true,
        repo: o.repo,
        number,
        kind: o.pr ? 'pr' : 'issue',
        triggerLine,
        verdictContract: o.verdictContract,
        endpoint,
        commentBytes: new TextEncoder().encode(comment).length,
        comment,
      }));
    }
    return 0;
  }

  // 5b) Non-formal posts resolve a token only after building their tuple-free comment.
  if (!token) {
    try {
      const resolved = await dependencies.resolveGithubToken({ preferEnv: o.tokenEnv });
      output.error(`[dispatch-openhands] token source: ${resolved.source}`);
      token = resolved.token;
    } catch (e) {
      output.error((e as Error).message);
      return 4;
    }
  }
  const res = await dependencies.githubRequest('POST', endpoint, token, { body: comment });
  if (!res.ok) {
    output.log(
      JSON.stringify({
        ok: false,
        status: res.status,
        error: githubField(res.body, 'message') ?? res.body,
      }),
    );
    return 1;
  }
  const htmlUrl = githubField(res.body, 'html_url');
  const url = typeof htmlUrl === 'string' ? htmlUrl : null;
  output.log(
    o.pretty
      ? `POSTED ${triggerLine} -> ${url}`
      : JSON.stringify({ ok: true, status: res.status, commentUrl: url, triggerLine }),
  );
  return 0;
}

if (import.meta.main) {
  const code = await runDispatchOpenHands(
    Deno.args,
    {
      readTextFile: (path) => Deno.readTextFile(path),
      resolveGithubToken,
      githubRequest,
    },
    { log: console.log, error: console.error },
  );
  Deno.exit(code);
}
