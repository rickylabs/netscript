/**
 * claude-hook-log.ts — append a Claude Code hook event to a per-run JSONL log.
 *
 * Reads the hook payload from stdin as JSON, tags it with an ISO timestamp and the
 * current Claude session id, and appends one JSON line to
 * `.llm/tmp/claude/hooks/<run-id>/events.jsonl` (run id from NETSCRIPT_RUN_ID,
 * else "unscoped"). Intended to be wired as a Claude Code hook command; it reads
 * stdin only when executed as the main module.
 *
 * Usage:
 *   <hook-json> | deno run --allow-env --allow-read --allow-write \
 *     .llm/tools/agentic/claude/claude-hook-log.ts
 *   deno run .llm/tools/agentic/claude/claude-hook-log.ts --help
 *
 * Perms: --allow-env (NETSCRIPT_RUN_ID, CLAUDE_SESSION_ID) · --allow-read /
 * --allow-write (.llm/tmp/claude/hooks/**). Exit 0 on success.
 */

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    length += value.length;
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function main(): Promise<void> {
  const decoder = new TextDecoder();
  const input = decoder.decode(await readAll(Deno.stdin.readable));
  const now = new Date().toISOString();
  const runId = Deno.env.get('NETSCRIPT_RUN_ID') ?? 'unscoped';
  const sessionId = Deno.env.get('CLAUDE_SESSION_ID') ?? null;
  const outDir = `.llm/tmp/claude/hooks/${runId}`;
  const outPath = `${outDir}/events.jsonl`;

  await Deno.mkdir(outDir, { recursive: true });

  let parsed: unknown = null;
  try {
    parsed = input.trim().length > 0 ? JSON.parse(input) : null;
  } catch {
    parsed = { raw: input };
  }

  await Deno.writeTextFile(
    outPath,
    `${JSON.stringify({ ts: now, sessionId, event: parsed })}\n`,
    { append: true, create: true },
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(
      [
        'claude-hook-log.ts — append a Claude Code hook event to a per-run JSONL log',
        '',
        'Reads a hook JSON payload from stdin and appends a timestamped line to',
        '.llm/tmp/claude/hooks/<NETSCRIPT_RUN_ID | unscoped>/events.jsonl.',
        '',
        'Usage:',
        '  <hook-json> | deno run --allow-env --allow-read --allow-write \\',
        '    .llm/tools/agentic/claude/claude-hook-log.ts',
        '',
        'Perms: --allow-env --allow-read --allow-write',
      ].join('\n'),
    );
    Deno.exit(0);
  }
  await main();
}
