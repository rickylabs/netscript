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
