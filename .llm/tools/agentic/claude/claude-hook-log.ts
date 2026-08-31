/**
 * claude-hook-log.ts — append a Claude Code hook event to a per-run JSONL log.
 *
 * Reads the hook payload from stdin as JSON, tags it with an ISO timestamp and the
 * current Claude session id, and appends one JSON line below the Claude session
 * launch root at `.llm/tmp/claude/hooks/<run-id>/events.jsonl` (run id from
 * NETSCRIPT_RUN_ID, else "unscoped"). CLAUDE_PROJECT_DIR supplies that root;
 * direct non-Claude invocations fall back to Deno.cwd(). The script reads stdin
 * only when executed as the main module.
 *
 * Usage:
 *   <hook-json> | deno run --no-lock --no-prompt \
 *     --allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID \
 *     --allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks \
 *     ${CLAUDE_PROJECT_DIR}/.llm/tools/agentic/claude/claude-hook-log.ts
 *   deno run .llm/tools/agentic/claude/claude-hook-log.ts --help
 *
 * Perms: read the three named env keys and write only the launch-root hook-log
 * subtree. No runtime read permission is required. Exit 0 on success.
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
  const projectRoot = Deno.env.get('CLAUDE_PROJECT_DIR') ?? Deno.cwd();
  const runId = Deno.env.get('NETSCRIPT_RUN_ID') ?? 'unscoped';
  const sessionId = Deno.env.get('CLAUDE_SESSION_ID') ?? null;
  const outDir = `${projectRoot}/.llm/tmp/claude/hooks/${runId}`;
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
        'Reads a hook JSON payload from stdin and appends a timestamped line below',
        '<CLAUDE_PROJECT_DIR | cwd>/.llm/tmp/claude/hooks/<run-id>/events.jsonl.',
        'Claude supplies its session launch root as CLAUDE_PROJECT_DIR; the cwd',
        'fallback is for direct non-Claude invocations only.',
        '',
        'Usage:',
        '  <hook-json> | deno run --no-lock --no-prompt \\',
        '    --allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID \\',
        '    --allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks \\',
        '    ${CLAUDE_PROJECT_DIR}/.llm/tools/agentic/claude/claude-hook-log.ts',
        '',
        'Perms: the three named env keys and the launch-root hook-log subtree;',
        'no runtime read permission is required.',
      ].join('\n'),
    );
    Deno.exit(0);
  }
  await main();
}
