/** Run-local publication-content scan; it never inspects or tears down runtime resources. */
const RUN = '.llm/runs/orch-divybot-832--sdk-get-context';
const SCOPE = [RUN, 'packages/sdk', 'packages/plugin-auth-core/src/sdk'];
const SAFE_DOC_HOSTS = new Set([
  'github.com',
  'jsr.io',
  'orpc.dev',
  'registry.npmjs.org',
  'example.invalid',
  'example.com',
]);
const RULES: readonly (readonly [string, RegExp])[] = [
  ['secret', /(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}/],
  ['secret', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['secret', /Bearer\s+(?!synthetic-[ab]\b)[A-Za-z0-9._~+\/-]{24,}/],
  ['operator-path', /\/(?:home|Users)\/[^\s/'"<>]+\/|\/mnt\/[a-z]\/|[A-Z]:\\Users\\/],
  ['network-address', /\b(?:\d{1,3}\.){3}\d{1,3}\b|\[[0-9a-fA-F:]*:[0-9a-fA-F:]+\]/],
  [
    'session-identity',
    /(?:session|thread|agent|assignment)[_-]?(?:id)?[\s"':=]+["']?(?:[0-9a-f]{8}-[0-9a-f-]{20,}|[0-9a-f]{24,})/i,
  ],
  [
    'usage',
    /(?:tokensUsed|tokensRemaining|tokenBudget|total_tokens|input_tokens|output_tokens|cost_usd|timeUsedSeconds)["'\s:=]+\d/i,
  ],
];

interface Finding {
  readonly category: string;
  readonly file: string;
  readonly line: number;
}

function categories(line: string): string[] {
  const found = new Set<string>();
  for (const [category, regex] of RULES) if (regex.test(line)) found.add(category);
  for (const match of line.matchAll(/https?:\/\/[^\s'"`<>)]*/g)) {
    const hostname = URL.parse(match[0])?.hostname;
    if (hostname === undefined || !SAFE_DOC_HOSTS.has(hostname)) found.add('network-address');
  }
  return [...found];
}

async function git(...args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) throw new Error(`git read failed, exit ${result.code}`);
  return new TextDecoder().decode(result.stdout);
}

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function selfTest(): void {
  const examples: readonly (readonly [string, string])[] = [
    ['secret', 'gh' + 'p_' + 'x'.repeat(32)],
    ['operator-path', '/' + 'home/' + 'synthetic-owner/private-file'],
    ['network-address', '10' + '.23.45.67'],
    ['session-identity', 'session' + 'Id: ' + 'a'.repeat(32)],
    ['usage', 'tokens' + 'Used: 123'],
  ];
  for (const [category, text] of examples) {
    if (!categories(text).includes(category)) throw new Error(`scan control missed ${category}`);
  }
  if (categories('A synthetic no-store policy description.').length !== 0) {
    throw new Error('innocuous scan control failed');
  }
}

const args = new Map<string, string>();
for (let index = 0; index < Deno.args.length; index += 2) {
  const key = Deno.args[index];
  const value = Deno.args[index + 1];
  if (!['--slice', '--base', '--head', '--output'].includes(key) || !value) {
    throw new Error('Expected --slice <name> --base <sha> --head <sha|STAGED> --output <path>');
  }
  args.set(key, value);
}
const slice = args.get('--slice');
const base = args.get('--base');
const head = args.get('--head');
const output = args.get('--output');
if (!slice || !base || !head || !output) throw new Error('All four options are required');
if (!/^[0-9a-f]{40}$/.test(base) || (head !== 'STAGED' && !/^[0-9a-f]{40}$/.test(head))) {
  throw new Error('Use full immutable commit SHAs or the explicit STAGED review mode');
}
selfTest();
const staged = head === 'STAGED';
const paths = (await git(
  ...(staged ? ['ls-files', '--cached'] : ['ls-tree', '-r', '--name-only', head]),
  '--',
  RUN,
)).trim().split('\n').filter(Boolean);
const findings: Finding[] = [];
const files: { path: string; sha256: string }[] = [];
for (const path of paths) {
  // The generated content-only receipt cannot include observed values; exclude only self-reference.
  if (path === output) continue;
  if (path.endsWith('.local.json')) throw new Error('Private raw report is tracked');
  const content = await git('show', staged ? `:${path}` : `${head}:${path}`);
  files.push({ path, sha256: await sha256(content) });
  for (const [line, text] of content.split('\n').entries()) {
    for (const category of categories(text)) {
      findings.push({ category, file: path, line: line + 1 });
    }
  }
}
const patch = await git(
  'diff',
  ...(staged ? ['--cached', base] : [base, head]),
  '--no-ext-diff',
  '--unified=0',
  '--',
  ...SCOPE,
);
for (const [line, text] of patch.split('\n').entries()) {
  if (!text.startsWith('+') || text.startsWith('+++')) continue;
  for (const category of categories(text.slice(1))) {
    findings.push({ category, file: '<added-source-and-run-patch>', line: line + 1 });
  }
}
if (files.length === 0) throw new Error('Empty committed/index run selection is not a scan');
const report = {
  schemaVersion: 1,
  gate: slice,
  kind: 'publication-content-scan-not-runtime-resource-check',
  baselineCommit: base,
  candidate: head,
  scanSelfControls: { negativeCategories: 5, innocuousControl: true },
  categories: [...new Set(RULES.map(([category]) => category))],
  safeDocumentationHosts: [...SAFE_DOC_HOSTS],
  patchSha256: await sha256(patch),
  files,
  findings,
  exclusions: [output],
  limitation:
    'Pattern scan plus manual review required; no secret-store, network or runtime access.',
  outcome: findings.length === 0 ? 'PASS' : 'FAIL',
};
await Deno.writeTextFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ gate: slice, files: files.length, findings: findings.length }));
Deno.exit(findings.length === 0 ? 0 : 1);
