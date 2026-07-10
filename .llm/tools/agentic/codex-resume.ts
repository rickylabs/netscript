/** @deprecated Retained through one compatibility cycle; retirement requires reviewed #577-#582 completion. */
/**
 * codex-resume.ts — steer an existing Codex thread (never fork a rival).
 *
 * To correct or continue a running Codex slice you must RESUME its thread, never
 * fire a second `send-message-v2` at the same worktree (two live sends fork rival
 * agents that fight over the same files / git index). This tool enforces that:
 * it requires an explicit `--thread-id` and issues exactly one
 * `codex exec resume <thread-id> -- <message>` via the shared `wsl()` helper
 * (argv array — no PowerShell `<`/`$()` parse hazard; the follow-up text is safe
 * even with quotes/redirect chars). The follow-up message is LF-normalized.
 *
 * Modes:
 *   (default)    Resume the thread with the given message and stream output.
 *   --dry-run    Validate inputs and print the exact command; send nothing.
 *
 * Usage:
 *   deno run --allow-read --allow-run .llm/tools/agentic/codex-resume.ts \
 *     --thread-id <uuid> --message "<follow-up>" \
 *     [--message-file <win-path>] [--worktree <wsl path>] [--user codex] [--dry-run]
 *
 * Exit codes: 0 = ok / dry-run clean · 1 = resume failed · 2 = usage error.
 */

import { requireValue, sq, UUID, wsl, wslUser } from './agentic-lib.ts';

interface Options {
  threadId?: string;
  message?: string;
  messageFile?: string;
  worktree?: string;
  user: string;
  dryRun: boolean;
  profile?: string;
  profileHome?: string;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-run .llm/tools/agentic/codex-resume.ts \\',
    '    --thread-id <uuid> --message "<follow-up>" [options]',
    '',
    'Options:',
    '  --thread-id <uuid>    Existing Codex thread/session id to resume. Required.',
    '  --message <text>      Follow-up message. Required unless --message-file is given.',
    '  --message-file <path> Windows path to a file holding the follow-up message.',
    '  --worktree <path>     WSL worktree to cd into before resuming (optional).',
    '  --profile <name>      Named Codex profile layer for this child only.',
    '  --profile-home <dir>  Isolated CODEX_HOME containing the named profile.',
    '  --user <name>         WSL user. Default: codex.',
    '  --dry-run             Print the exact command without sending.',
    '  --help                Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = { user: wslUser(), dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--thread-id':
        o.threadId = requireValue(args, i, a);
        i++;
        break;
      case '--message':
        o.message = requireValue(args, i, a);
        i++;
        break;
      case '--message-file':
        o.messageFile = requireValue(args, i, a);
        i++;
        break;
      case '--worktree':
        o.worktree = requireValue(args, i, a);
        i++;
        break;
      case '--profile':
        o.profile = requireValue(args, i, a);
        i++;
        break;
      case '--profile-home':
        o.profileHome = requireValue(args, i, a);
        i++;
        break;
      case '--user':
        o.user = requireValue(args, i, a);
        i++;
        break;
      case '--dry-run':
        o.dryRun = true;
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

  if (!o.threadId || !new RegExp(`^${UUID}$`).test(o.threadId)) {
    console.error('--thread-id is required and must be a valid thread/session UUID.');
    Deno.exit(2);
  }
  if (Boolean(o.profile) !== Boolean(o.profileHome)) {
    console.error('--profile and --profile-home must be supplied together.');
    Deno.exit(2);
  }

  let message = o.message;
  if (o.messageFile) {
    message = await Deno.readTextFile(o.messageFile);
  }
  message = (message ?? '').replace(/\r/g, '').trim();
  if (!message) {
    console.error('--message (or --message-file) is required and must be non-empty.');
    Deno.exit(2);
  }

  const cd = o.worktree ? `cd ${sq(o.worktree)} && ` : '';
  const profile = o.profile && o.profileHome
    ? `export CODEX_HOME=${sq(o.profileHome)}; codex --profile ${sq(o.profile)}`
    : 'codex';
  const script =
    `${cd}export PATH="$HOME/.local/bin:$PATH"; ${profile} exec resume ${o.threadId} -- ${
      sq(message)
    }`;

  if (o.dryRun) {
    console.log(
      JSON.stringify({
        mode: 'dry-run',
        ok: true,
        threadId: o.threadId,
        worktree: o.worktree ?? null,
        messageBytes: new TextEncoder().encode(message).length,
        command: `wsl.exe -u ${o.user} -- bash -lc ${JSON.stringify(script)}`,
      }),
    );
    Deno.exit(0);
  }

  const r = await wsl(o.user, script);
  if (r.stdout) console.log(r.stdout);
  if (r.stderr) console.error(r.stderr);
  Deno.exit(r.code === 0 ? 0 : 1);
}

if (import.meta.main) await main();
