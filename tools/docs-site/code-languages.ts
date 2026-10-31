/** One public language vocabulary for component headers and fenced-code validation. */
export const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JavaScript',
  json: 'JSON',
  jsonc: 'JSON with comments',
  python: 'Python',
  py: 'Python',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  md: 'Markdown',
  markdown: 'Markdown',
  dotenv: 'Environment',
  yaml: 'YAML',
  yml: 'YAML',
  css: 'CSS',
  diff: 'Diff',
  sql: 'SQL',
  xml: 'XML',
  html: 'HTML',
  text: 'Plain text',
  plaintext: 'Plain text',
  'no-highlight': 'Plain text',
  prisma: 'Prisma',
  tree: 'File tree',
};

/** Unknown fence languages are build errors, rather than silent uncoloured output. */
export function assertCodeLanguage(language: string, registered: readonly string[]): void {
  if (!registered.includes(language) || !Object.hasOwn(LANGUAGE_LABELS, language)) {
    throw new Error(`Unregistered code fence language: ${language}`);
  }
}

/** A filename may be declared explicitly or identified from the first source comment. */
export function codeFilename(source: string): string | undefined {
  return source.match(
    /(?:\/\/|#)\s+([\w./()-]+\.(?:tsx?|jsx?|jsonc?|prisma|sql|sh|cs|py|go|yaml|yml|ps1|css|html|xml))\b/,
  )?.[1];
}
