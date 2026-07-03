/**
 * gh-token.ts — durable GitHub-token health + one-time store-everywhere.
 *
 * The supervisor's GitHub access kept breaking because the only credential was a
 * single env PAT that rotated/expired, and no MCP/`gh` login was wired into the
 * background session. This tool makes the credential durable so future sessions
 * stop hunting for it:
 *
 *   check  — resolve a token from any healthy source (env candidates → `gh auth
 *            token` Windows/WSL → bounded GCM `git credential fill`), validate it
 *            against GET /user, and report ONLY the source + login. Never prints
 *            the token. Exit 0 if a valid token resolves, 1 otherwise.
 *
 *   store  — read ONE PAT from stdin (never argv, never a file), validate it,
 *            then persist it to every durable place this environment resolves
 *            from: Windows GCM (`git credential approve`) and WSL `gh`
 *            (`gh auth login --with-token`). After this, `check` (and every suite
 *            tool via resolveGithubToken) finds it automatically each session.
 *
 * Token handling (classifier-enforced): the PAT is only ever read from stdin or
 * an env var, held in-process, piped to `git`/`gh` over their stdin, and never
 * written to a tracked file, passed on argv, logged, or echoed.
 *
 * Usage:
 *   deno run --allow-run --allow-env --allow-net .llm/tools/agentic/gh-token.ts check
 *   <pat-source> | deno run --allow-run --allow-env --allow-net \
 *     .llm/tools/agentic/gh-token.ts store [--wsl-user codex] [--skip-wsl] [--skip-gcm]
 *
 * Exit codes: 0 = ok · 1 = no valid token / store failure · 2 = usage error ·
 * 3 = stdin token did not validate.
 */

import { resolveGithubToken, validateGithubToken, wslUser } from './agentic-lib.ts';

type Sub = 'check' | 'store';

interface Options {
  sub: Sub;
  wslUser: string;
  skipWsl: boolean;
  skipGcm: boolean;
}

function usage(): never {
  console.error(
    [
      'gh-token.ts — durable GitHub-token health + store-everywhere',
      '',
      '  check                       resolve+validate a token; print source+login only',
      '  store                       read ONE PAT from stdin, validate, persist to GCM + WSL gh',
      '',
      '  --wsl-user <name>           WSL user whose gh login to write/read. Default: codex.',
      '  --skip-wsl                  store: do not write to WSL gh.',
      '  --skip-gcm                  store: do not write to Windows GCM.',
    ].join('\n'),
  );
  Deno.exit(2);
}

function parseArgs(args: string[]): Options {
  if (args.length === 0) usage();
  const sub = args[0];
  if (sub !== 'check' && sub !== 'store') usage();
  const o: Options = { sub, wslUser: wslUser(), skipWsl: false, skipGcm: false };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--wsl-user':
        o.wslUser = args[++i] ?? usage();
        break;
      case '--skip-wsl':
        o.skipWsl = true;
        break;
      case '--skip-gcm':
        o.skipGcm = true;
        break;
      default:
        console.error(`Unknown argument: ${a}`);
        usage();
    }
  }
  return o;
}

/** Read all of stdin, trimmed. Used to take a PAT without it touching argv/disk. */
async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf).trim();
}

/** Pipe `input` to a subprocess over stdin; return success + captured stderr. */
async function runWithStdin(
  cmd: string,
  args: string[],
  input: string,
): Promise<{ ok: boolean; stderr: string }> {
  const child = new Deno.Command(cmd, {
    args,
    stdin: 'piped',
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  const w = child.stdin.getWriter();
  await w.write(new TextEncoder().encode(input));
  await w.close();
  const out = await child.output();
  return { ok: out.success, stderr: new TextDecoder().decode(out.stderr).trim() };
}

async function doCheck(o: Options): Promise<number> {
  try {
    const { source } = await resolveGithubToken({ wslUser: o.wslUser });
    console.log(`OK — valid GitHub token resolved from ${source}`);
    return 0;
  } catch (e) {
    console.error((e as Error).message);
    return 1;
  }
}

async function doStore(o: Options): Promise<number> {
  const pat = await readStdin();
  if (!pat) {
    console.error('No token on stdin. Pipe the PAT in, e.g. `type pat.txt | … store`.');
    return 2;
  }
  // Validate before persisting so we never store a dead credential.
  const login = await validateGithubToken(pat);
  if (!login) {
    console.error('The provided PAT did not authenticate against GET /user — not stored.');
    return 3;
  }
  console.log(`Token validated as ${login}. Persisting to durable stores…`);

  const results: string[] = [];
  let failed = false;

  // 1. Windows Git Credential Manager — `git credential approve`.
  if (!o.skipGcm) {
    const body = `protocol=https\nhost=github.com\nusername=x-access-token\npassword=${pat}\n\n`;
    const r = await runWithStdin('git', ['credential', 'approve'], body);
    if (r.ok) {
      results.push('GCM (Windows git): stored');
    } else {
      failed = true;
      results.push(`GCM (Windows git): FAILED ${r.stderr}`);
    }
  }

  // 2. WSL gh — `gh auth login --with-token` (gh keeps it fresh thereafter).
  if (!o.skipWsl) {
    const r = await runWithStdin('wsl.exe', [
      '-u',
      o.wslUser,
      '--',
      'bash',
      '-lc',
      'export PATH="$HOME/.local/bin:$PATH"; gh auth login --hostname github.com --with-token',
    ], pat + '\n');
    if (r.ok) {
      results.push(`WSL gh (${o.wslUser}): logged in`);
    } else {
      failed = true;
      results.push(`WSL gh (${o.wslUser}): FAILED ${r.stderr}`);
    }
  }

  for (const line of results) console.log(`  - ${line}`);
  if (failed) {
    console.error('One or more stores failed; see above.');
    return 1;
  }
  console.log('Stored everywhere. Future sessions auto-resolve via gh-token.ts check.');
  return 0;
}

async function main(): Promise<void> {
  const o = parseArgs(Deno.args);
  const code = o.sub === 'check' ? await doCheck(o) : await doStore(o);
  Deno.exit(code);
}

await main();
