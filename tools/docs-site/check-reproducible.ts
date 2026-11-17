/** Build twice and compare every output byte, including search fragments and Markdown twins. */
async function snapshot(root: URL, prefix = ''): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  for await (const entry of Deno.readDir(root)) {
    const path = `${prefix}${entry.name}`;
    const url = new URL(encodeURIComponent(entry.name) + (entry.isDirectory ? '/' : ''), root);
    if (entry.isDirectory) {
      for (const [childPath, hash] of await snapshot(url, `${path}/`)) files.set(childPath, hash);
    } else {
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', await Deno.readFile(url)));
      files.set(path, hash.toHex());
    }
  }
  return files;
}

if (import.meta.main) {
  if (Deno.args.length) {
    throw new Error('Unknown argument');
  }
  const cwd = new URL('../../docs/site/', import.meta.url);
  const build = async () => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['task', 'build'],
      cwd,
      stdin: 'null',
      stdout: 'inherit',
      stderr: 'inherit',
    }).output();
    if (!result.success) Deno.exit(result.code);
    return await snapshot(new URL('_site/', cwd));
  };
  const first = await build();
  const second = await build();
  const paths = [...new Set([...first.keys(), ...second.keys()])].sort();
  const changed = paths.filter((path) => first.get(path) !== second.get(path));
  if (!paths.some((path) => path.endsWith('.html')) || changed.length) {
    throw new Error(`Non-reproducible site: ${changed.join(', ') || 'empty output'}`);
  }
  console.log(JSON.stringify({
    outcome: 'PASS',
    scope: 'all-output',
    files: paths.length,
    html: paths.filter((path) => path.endsWith('.html')).length,
    search: paths.filter((path) => path.startsWith('pagefind/')).length,
    twins: paths.filter((path) => path.endsWith('.md')).length,
    differences: changed,
  }));
}
