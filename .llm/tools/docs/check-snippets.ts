import {
  runSnippetProcess,
  SNIPPET_CHECK_TIMEOUT_MS,
  SNIPPET_LAUNCHER_GRACE_MS,
} from './snippet-process.ts';

// Keep this launcher free of registry imports: the incident stalled while loading @std/text,
// before extraction or the compiler's own deadline could run.
if (import.meta.main) {
  try {
    const result = await runSnippetProcess(Deno.execPath(), [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '--allow-env',
      new URL('./check-snippets-worker.ts', import.meta.url).href,
      ...Deno.args,
    ], {
      source: 'docs snippets bootstrap (.llm/tools/docs/check-snippets-worker.ts:1)',
      cwd: Deno.cwd(),
      timeoutMs: SNIPPET_CHECK_TIMEOUT_MS,
      terminationGraceMs: SNIPPET_LAUNCHER_GRACE_MS,
    });
    if (result.stdout) console.log(result.stdout.trimEnd());
    if (result.stderr) console.error(result.stderr.trimEnd());
    Deno.exit(result.code);
  } catch (error) {
    console.error(`docs snippets: FAIL ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
