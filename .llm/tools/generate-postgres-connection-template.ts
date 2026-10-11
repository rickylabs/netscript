/** Inline the maintained pure TypeScript modules for both Deno and Prisma's Node config loader. */
export async function renderPostgresConnectionTemplate(): Promise<string> {
  const root = new URL('../../', import.meta.url);
  const sources = [
    'packages/database/adapters/connection-strings/tokenize-ado-net.ts',
    'packages/database/adapters/postgres-connection-string-error.ts',
    'packages/database/adapters/postgres-connection-string.ts',
  ];
  const localImports = new Set([
    './connection-strings/tokenize-ado-net.ts',
    './postgres-connection-string-error.ts',
  ]);
  const sections: string[] = [];
  for (const path of sources) {
    const source = await Deno.readTextFile(new URL(path, root));
    const inline = source.replace(
      /^import \{[^}]*\} from '([^']+)';\n/gm,
      (_statement, specifier: string) => {
        if (!localImports.has(specifier)) throw new Error(`Unexpected import in ${path}.`);
        return '';
      },
    ).replace(/^export (?=(?:class|type|function)\b)/gm, '');
    if (/^(?:import|export)\b/m.test(inline)) {
      throw new Error(`Connection template requires dependency-free declarations: ${path}.`);
    }
    sections.push(`// Source: ${path}\n${inline.trim()}`);
  }
  return `// @generated from @netscript/database/connection-strings/postgres.
// Do not edit. Run deno task gen:assets-barrel to refresh the shared implementation.

${sections.join('\n\n')}
`;
}
