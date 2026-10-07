import { assert, assertEquals } from 'jsr:@std/assert@^1';
import {
  buildGithubTokenResolutionError,
  buildMissingGithubNetPermissionMessage,
  buildPullRequestBody,
  buildWslGhTokenCommand,
  formatGithubTokenAttempt,
  GITHUB_NET_PERMISSION_FLAG,
  isMissingGithubNetPermission,
  parseGithubHostsOauthToken,
} from './github-api.ts';
import { formatReleasePrCreationError } from './cut.ts';

Deno.test('gh hosts fallback extracts only github.com oauth_token without exposing siblings', () => {
  const synthetic = [
    'example.com:',
    '    oauth_token: not-the-token',
    'github.com:',
    '    git_protocol: https',
    '    users:',
    '        octocat:',
    '    oauth_token: "synthetic-secret"',
    '    user: octocat',
  ].join('\n');
  assertEquals(parseGithubHostsOauthToken(synthetic), 'synthetic-secret');
  assertEquals(parseGithubHostsOauthToken(synthetic, 'missing.example'), null);
  assertEquals(parseGithubHostsOauthToken('github.com:\n    oauth_token:'), null);
});

Deno.test('missing GitHub net permission is classified and rendered without auth advice', () => {
  const permissionError = new Deno.errors.NotCapable(
    'Requires net access to "api.github.com:443", run again with the --allow-net flag',
  );
  assert(isMissingGithubNetPermission(permissionError));
  assert(!isMissingGithubNetPermission(new Deno.errors.NotCapable('Requires read access')));
  assert(!isMissingGithubNetPermission(new Error('Requires net access to api.github.com')));

  const message = buildMissingGithubNetPermissionMessage(permissionError);
  const rendered = formatReleasePrCreationError(new Error(message));
  assert(rendered.startsWith('release:cut could not create the release PR:'));
  assert(rendered.includes(GITHUB_NET_PERMISSION_FLAG));
  assert(rendered.includes(permissionError.message));
  assert(!rendered.includes('401'));
  assert(!rendered.includes('gh auth login'));
});

Deno.test('genuinely rejected GitHub credentials retain 401 diagnostics and auth remedy', () => {
  const attempt = formatGithubTokenAttempt('env:GH_TOKEN', null);
  assertEquals(attempt, 'env:GH_TOKEN (401)');
  const message = buildGithubTokenResolutionError([attempt], 'codex');
  assert(message.includes('(401)'));
  assert(message.includes('gh auth login'));
});

Deno.test('WSL gh token source goes through wsl.exe outside Linux', () => {
  assertEquals(buildWslGhTokenCommand('codex', { os: 'windows' }), {
    bin: 'wsl.exe',
    args: [
      '-u',
      'codex',
      '--',
      'bash',
      '-lc',
      'export PATH="$HOME/.local/bin:$PATH"; gh auth token',
    ],
  });
});

Deno.test('WSL gh token source runs locally on Linux only as the matching account', () => {
  assertEquals(buildWslGhTokenCommand('codex', { os: 'linux', currentUser: 'codex' }), {
    bin: 'bash',
    args: ['-lc', 'export PATH="$HOME/.local/bin:$PATH"; gh auth token'],
  });
  assertEquals(buildWslGhTokenCommand('codex', { os: 'linux', currentUser: 'node' }), null);
  assertEquals(buildWslGhTokenCommand('codex', { os: 'linux', currentUser: null }), null);
});

Deno.test('buildPullRequestBody carries the core fields and omits draft when unset', () => {
  const b = buildPullRequestBody({
    title: 'S3',
    head: 'feat/x',
    base: 'feat/umbrella',
    body: 'why',
  });
  assertEquals(b.title, 'S3');
  assertEquals(b.head, 'feat/x');
  assertEquals(b.base, 'feat/umbrella');
  assertEquals(b.body, 'why');
  assert(!('draft' in b), 'no draft key when unset');
});
Deno.test('buildPullRequestBody sets draft when requested', () => {
  assertEquals(
    buildPullRequestBody({ title: 't', head: 'h', base: 'b', body: '', draft: true }).draft,
    true,
  );
});
