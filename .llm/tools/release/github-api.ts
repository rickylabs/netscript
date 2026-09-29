/**
 * github-api.ts — the GitHub REST transport and token resolution used by the
 * release tools (`release:cut`, `release:publish`, and the stable-publish canary
 * gate).
 *
 * The token is used only as an Authorization header. It never touches disk,
 * argv, or output; only its provenance label (for example `env:GH_TOKEN` or
 * `gh:wsl (octocat)`) is safe to log.
 *
 * Release mechanics own this module. It has no dependency on agent
 * orchestration code, so removing that code from NetScript leaves the release
 * path intact.
 */

import { GITHUB_API_BASE_URL } from './config/endpoints.ts';

// ---------------------------------------------------------------------------
// Operator environment (pure)
// ---------------------------------------------------------------------------

/** A shell-free process invocation that can be executed with `Deno.Command`. */
export interface CommandPlan {
  bin: string;
  args: string[];
}

function envOr(name: string, fallback: string): string {
  try {
    return Deno.env.get(name) ?? fallback;
  } catch {
    return fallback;
  }
}

/** WSL user whose `gh` login may hold the token. Override with `NETSCRIPT_WSL_USER`. */
export function wslUser(): string {
  return envOr('NETSCRIPT_WSL_USER', 'codex');
}

/** Home directory of {@link wslUser}. Override with `NETSCRIPT_WSL_HOME`. */
export function wslHome(): string {
  return envOr('NETSCRIPT_WSL_HOME', `/home/${wslUser()}`);
}

/** Resolve the current account name without making `--allow-env` mandatory. */
function currentUsername(): string | null {
  for (const name of ['USER', 'LOGNAME', 'USERNAME']) {
    try {
      const value = Deno.env.get(name)?.trim();
      if (value) return value;
    } catch {
      break;
    }
  }
  try {
    const uid = String(Deno.uid());
    const passwd = Deno.readTextFileSync('/etc/passwd');
    for (const line of passwd.split('\n')) {
      const fields = line.split(':');
      if (fields[2] === uid) return fields[0] || null;
    }
  } catch {
    // Unknown identity: the WSL gh source is skipped.
  }
  return null;
}

const WSL_GH_TOKEN_SCRIPT = 'export PATH="$HOME/.local/bin:$PATH"; gh auth token';

/**
 * Build the argv that asks `user`'s `gh` login for its token. Outside Linux this
 * goes through `wsl.exe`. On Linux it runs locally only when the current account
 * is `user`; otherwise the source does not apply and the result is null, so
 * resolution moves on to the next source.
 */
export function buildWslGhTokenCommand(
  user: string,
  opts: { os?: string; currentUser?: string | null } = {},
): CommandPlan | null {
  const os = opts.os ?? Deno.build.os;
  if (os !== 'linux') {
    return { bin: 'wsl.exe', args: ['-u', user, '--', 'bash', '-lc', WSL_GH_TOKEN_SCRIPT] };
  }
  const actual = 'currentUser' in opts ? opts.currentUser : currentUsername();
  return actual === user ? { bin: 'bash', args: ['-lc', WSL_GH_TOKEN_SCRIPT] } : null;
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

// ---------------------------------------------------------------------------
// Token resolution and REST (impure; token never logged)
// ---------------------------------------------------------------------------

/** Read a GitHub token from an env var the supervisor sets in-process. Never logged. */
export function readTokenFromEnv(envName: string): string | null {
  try {
    return Deno.env.get(envName) ?? null;
  } catch {
    return null;
  }
}

/** Env vars, in priority order, that may carry a GitHub token in this environment. */
export const GITHUB_TOKEN_ENV_CANDIDATES = [
  'GH_TOKEN',
  'GITHUB_TOKEN',
  'GH_PAT',
  'GITHUB_PAT',
  'PAT_TOKEN',
  'GITHUB_MCP_PAT',
] as const;

export interface ResolvedGithubToken {
  /** The bearer token. Use in-process only; never log, print, or persist. */
  token: string;
  /** Human-readable provenance, e.g. `gh:wsl (rickylabs)`. Safe to log. */
  source: string;
}

export interface ResolveTokenOptions {
  /** Env var to try before the standard candidates. */
  preferEnv?: string;
  /** WSL user whose `gh` login to consult. Default: codex. */
  wslUser?: string;
  /** Validate each candidate against GET /user before accepting. Default: true. */
  validate?: boolean;
  /** Bound on the GCM `git credential fill` fallback (anti-hang). Default: 20000ms. */
  gcmTimeoutMs?: number;
  /** Skip subprocess sources (gh / GCM) — env-only. Default: false. */
  envOnly?: boolean;
}

/**
 * Extract github.com's OAuth token from the gh CLI hosts file without invoking
 * a YAML tool or ever placing the credential in argv/log output.
 */
export function parseGithubHostsOauthToken(
  source: string,
  host = 'github.com',
): string | null {
  const lines = source.replaceAll('\r', '').split('\n');
  let hostIndent = -1;
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const hostMatch = /^([^:#][^:]*):\s*$/.exec(line.trim());
    if (hostMatch && indent === 0) {
      hostIndent = hostMatch[1].trim() === host ? indent : -1;
      continue;
    }
    if (hostIndent < 0 || indent <= hostIndent) continue;
    const tokenMatch = /^oauth_token:\s*(.*?)\s*$/.exec(line.trim());
    if (!tokenMatch) continue;
    const value = tokenMatch[1].trim();
    if (!value) return null;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1).trim() || null;
    }
    return value;
  }
  return null;
}

/** Read the durable gh hosts-file fallback in-process. Missing permission/file is non-fatal. */
async function readGithubHostsToken(path: string): Promise<string | null> {
  try {
    return parseGithubHostsOauthToken(await Deno.readTextFile(path));
  } catch {
    return null;
  }
}

/**
 * Confirm a candidate token actually works by calling GET /user. Returns the
 * authenticated login on success, or null on any non-2xx / network error. The
 * token is used only as the Authorization header.
 */
export async function validateGithubToken(token: string): Promise<string | null> {
  try {
    const res = await githubRequest('GET', '/user', token);
    const loginField = githubField(res.body, 'login');
    const login = res.ok && typeof loginField === 'string' ? loginField : null;
    return login;
  } catch (error) {
    if (isMissingGithubNetPermission(error)) {
      throw new Error(buildMissingGithubNetPermissionMessage(error), { cause: error });
    }
    return null;
  }
}

const GITHUB_API_HOST = new URL(GITHUB_API_BASE_URL).hostname;
export const GITHUB_NET_PERMISSION_FLAG: string = `--allow-net=${GITHUB_API_HOST}`;

/** Return whether an error is Deno's missing-net capability failure for the GitHub API host. */
export function isMissingGithubNetPermission(error: unknown): boolean {
  return error instanceof Deno.errors.NotCapable &&
    error.message.includes('Requires net access') &&
    error.message.includes(GITHUB_API_HOST);
}

/** Build the actionable diagnostic for a missing GitHub API net permission. */
export function buildMissingGithubNetPermissionMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `Cannot reach ${GITHUB_API_HOST}: missing ${GITHUB_NET_PERMISSION_FLAG}. ${detail}`;
}

/** Format one validated token-source attempt without exposing its credential. */
export function formatGithubTokenAttempt(source: string, login: string | null): string {
  return login ? `${source} (valid)` : `${source} (401)`;
}

/** Build the existing operator guidance for genuinely rejected GitHub credentials. */
export function buildGithubTokenResolutionError(tried: readonly string[], wslUser: string): string {
  const summary = tried.length ? tried.join(', ') : 'no candidate produced a token';
  return `No valid GitHub token resolved (tried: ${summary}). ` +
    `Authenticate once with \`gh auth login\` (WSL: \`wsl.exe -u ${wslUser} -- gh auth login\`) ` +
    `so \`gh auth token\` can supply a self-refreshing credential, or store a PAT via ` +
    `\`git credential approve\`, then retry.`;
}

/** Run a subprocess, returning trimmed stdout, or null on failure / missing --allow-run. */
async function runCapture(
  cmd: string,
  args: string[],
  opts: { cwd?: string } = {},
): Promise<string | null> {
  try {
    const status = await Deno.permissions.query({ name: 'run', command: cmd });
    if (status.state !== 'granted') return null;
    const out = await new Deno.Command(cmd, {
      args,
      cwd: opts.cwd,
      stdout: 'piped',
      stderr: 'null',
      stdin: 'null',
    }).output();
    if (!out.success) return null;
    const text = new TextDecoder().decode(out.stdout).trim();
    return text.length ? text : null;
  } catch {
    return null;
  }
}

/** Bounded, non-interactive GCM credential fill. Never hangs; returns the password line or null. */
async function gcmCredentialFill(timeoutMs: number): Promise<string | null> {
  try {
    const status = await Deno.permissions.query({ name: 'run', command: 'git' });
    if (status.state !== 'granted') return null;
    const child = new Deno.Command('git', {
      args: [
        '-c',
        'credential.interactive=false',
        '-c',
        'credential.guiPrompt=false',
        'credential',
        'fill',
      ],
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'null',
      env: { GCM_INTERACTIVE: 'Never', GIT_TERMINAL_PROMPT: '0' },
    }).spawn();
    const w = child.stdin.getWriter();
    await w.write(new TextEncoder().encode('protocol=https\nhost=github.com\n\n'));
    await w.close();
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch { /* already exited */ }
    }, timeoutMs);
    const out = await child.output();
    clearTimeout(timer);
    if (!out.success) return null;
    const text = new TextDecoder().decode(out.stdout);
    const line = text.split(/\r?\n/).find((l) => l.startsWith('password='));
    const pw = line ? line.slice('password='.length).trim() : '';
    return pw.length ? pw : null;
  } catch {
    return null;
  }
}

/**
 * Durably resolve a working GitHub token from whatever source is healthy in this
 * environment, validating each candidate against GET /user before accepting it.
 *
 * Tried in order: preferEnv → standard env candidates → `gh auth token`
 * (Windows, then WSL) → `~/.config/gh/hosts.yml` → bounded GCM
 * `git credential fill`. The first candidate
 * that authenticates wins. `gh auth token` is the durable source: a one-time
 * `gh auth login` yields a credential gh keeps fresh, so it survives token
 * expiry that kills static PATs.
 *
 * Throws with a precise, secret-free message listing what was tried when nothing
 * validates — the caller surfaces it so a human runs `gh auth login` once.
 */
export async function resolveGithubToken(
  opts: ResolveTokenOptions = {},
): Promise<ResolvedGithubToken> {
  const validate = opts.validate ?? true;
  const resolvedWslUser = opts.wslUser ?? wslUser();
  const tried: string[] = [];

  const accept = async (
    token: string | null,
    source: string,
  ): Promise<ResolvedGithubToken | null> => {
    if (!token) return null;
    if (!validate) return { token, source };
    const login = await validateGithubToken(token);
    tried.push(formatGithubTokenAttempt(source, login));
    return login ? { token, source: `${source} (${login})` } : null;
  };

  const envOrder = [
    ...(opts.preferEnv ? [opts.preferEnv] : []),
    ...GITHUB_TOKEN_ENV_CANDIDATES,
  ];
  const seen = new Set<string>();
  for (const name of envOrder) {
    if (seen.has(name)) continue;
    seen.add(name);
    const r = await accept(readTokenFromEnv(name), `env:${name}`);
    if (r) return r;
  }

  if (!opts.envOnly) {
    const ghWin = await runCapture('gh', ['auth', 'token']);
    let r = await accept(ghWin, 'gh:windows');
    if (r) return r;

    const ghWslPlan = buildWslGhTokenCommand(resolvedWslUser);
    const ghWsl = ghWslPlan ? await runCapture(ghWslPlan.bin, ghWslPlan.args) : null;
    r = await accept(ghWsl, 'gh:wsl');
    if (r) return r;

    const hostsPath = `${wslHome()}/.config/gh/hosts.yml`;
    const hostsToken = await readGithubHostsToken(hostsPath);
    r = await accept(hostsToken, 'gh:hosts-file');
    if (r) return r;

    const gcm = await gcmCredentialFill(opts.gcmTimeoutMs ?? 20000);
    r = await accept(gcm, 'gcm:windows');
    if (r) return r;
  }

  throw new Error(buildGithubTokenResolutionError(tried, resolvedWslUser));
}

/** Read one property from an unknown GitHub JSON response after object narrowing. */
export function githubField(value: unknown, key: string): unknown {
  return objectRecord(value)?.[key];
}

export interface GitHubResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

/**
 * Minimal GitHub REST call. `token` is used only as the Authorization header and
 * is never written to disk, argv, or output. `path` is appended to
 * `GITHUB_API_BASE_URL` (`config/endpoints.ts`).
 */
export async function githubRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<GitHubResponse> {
  const res = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'netscript-release-tools',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed: unknown = null;
  const text = await res.text();
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, ok: res.ok, body: parsed };
}

// ---------------------------------------------------------------------------
// Pull-request payloads (pure)
// ---------------------------------------------------------------------------

export interface PullRequestSpec {
  title: string;
  head: string;
  base: string;
  body: string;
  draft?: boolean;
}

/** Build the JSON body for `POST /repos/:owner/:repo/pulls`. */
export function buildPullRequestBody(s: PullRequestSpec): Record<string, unknown> {
  return {
    title: s.title,
    head: s.head,
    base: s.base,
    body: s.body,
    ...(s.draft ? { draft: true } : {}),
  };
}
