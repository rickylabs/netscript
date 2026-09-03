/** Marker that starts the root README Quickstart execution contract. */
export const README_QUICKSTART_START_MARKER = '<!-- readme-quickstart:start -->';

/** Marker that ends the root README Quickstart execution contract. */
export const README_QUICKSTART_END_MARKER = '<!-- readme-quickstart:end -->';

/** One executable command extracted from the root README. */
export interface ReadmeQuickstartCommand {
  readonly command: string;
  readonly line: number;
}

/** The only runtime values the README command contract permits replacing. */
export interface ReadmeQuickstartSubstitutions {
  readonly port?: number;
  readonly version: string;
}

/** Ordered command contract expected by the `readme.quickstart` suite. */
export const README_QUICKSTART_EXPECTED_COMMANDS = [
  'deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>',
  'netscript init my-app --db postgres --service --yes',
  'cd my-app/aspire',
  'aspire restore',
  'aspire start',
  'aspire wait postgres --status healthy --timeout 60',
  'cd ..',
  'netscript db init --name init',
  'netscript db generate',
  'netscript db seed',
  'curl http://localhost:<port>/health',
] as const;

/** Extract ordered executable lines from marked bash fences in README Markdown. */
export function parseReadmeQuickstartCommands(
  markdown: string,
): readonly ReadmeQuickstartCommand[] {
  const lines = markdown.split(/\r?\n/);
  const start = markerIndex(lines, README_QUICKSTART_START_MARKER);
  const end = markerIndex(lines, README_QUICKSTART_END_MARKER);
  if (end <= start) {
    throw new Error('README Quickstart end marker must follow its start marker.');
  }

  const commands: ReadmeQuickstartCommand[] = [];
  let inBashFence = false;
  for (let index = start + 1; index < end; index++) {
    const trimmed = lines[index].trim();
    if (!inBashFence && trimmed === '```bash') {
      inBashFence = true;
      continue;
    }
    if (inBashFence && trimmed === '```') {
      inBashFence = false;
      continue;
    }
    if (!inBashFence || trimmed.length === 0 || trimmed.startsWith('#')) continue;

    const command = trimmed.replace(/\s+#.*$/, '').trimEnd();
    if (command.length > 0) commands.push(Object.freeze({ command, line: index + 1 }));
  }
  if (inBashFence) {
    throw new Error(`README Quickstart bash fence opened before line ${end + 1} is not closed.`);
  }
  return Object.freeze(commands);
}

/** Apply only the two placeholders authorized by the root README walk contract. */
export function substituteReadmeQuickstartCommand(
  command: string,
  substitutions: ReadmeQuickstartSubstitutions,
  line: number,
): string {
  let substituted = command.replace('<version>', substitutions.version);
  if (substituted.includes('<port>')) {
    if (substitutions.port === undefined) {
      throw new Error(`README line ${line} cannot substitute <port>: no port receipt exists.`);
    }
    substituted = substituted.replace('<port>', String(substitutions.port));
  }
  const unknown = substituted.match(/<[^>]+>/)?.[0];
  if (unknown) {
    throw new Error(`README line ${line} contains unsupported placeholder ${unknown}.`);
  }
  return substituted;
}

/** Convert the current quote-free README command vocabulary into process argv. */
export function readmeQuickstartArgv(command: string, line: number): readonly string[] {
  if (/['"\\]/.test(command)) {
    throw new Error(`README line ${line} uses unsupported shell quoting: ${command}`);
  }
  const argv = command.split(/\s+/).filter((part) => part.length > 0);
  if (argv.length === 0) throw new Error(`README line ${line} is empty.`);
  return Object.freeze(argv);
}

/** Select the first explicit HTTP(S) service port from an Aspire describe receipt. */
export function explicitServicePort(urls: readonly string[]): number {
  for (const candidate of urls) {
    const url = new URL(candidate);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.port === '') continue;
    const port = Number(url.port);
    if (Number.isSafeInteger(port) && port > 0 && port <= 65_535) return port;
  }
  throw new Error(`service receipt contained no explicit HTTP port: ${urls.join(', ')}`);
}

function markerIndex(lines: readonly string[], marker: string): number {
  const matches = lines.flatMap((line, index) => line.trim() === marker ? [index] : []);
  if (matches.length !== 1) {
    throw new Error(`README Quickstart requires exactly one ${marker}; found ${matches.length}.`);
  }
  return matches[0];
}
