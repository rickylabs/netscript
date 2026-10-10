type GenerateResult = Readonly<{ success: boolean; code: number; stderr: Uint8Array }>;

/** Retry only Prisma generation; provider tests and assertion failures are never retried. */
export async function retryPrismaGenerate(run: () => Promise<GenerateResult>): Promise<void> {
  let diagnostic = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await run();
      if (result.success) return;
      diagnostic = `exit ${result.code}: ${new TextDecoder().decode(result.stderr.slice(-8192))}`;
    } catch (error) {
      diagnostic = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(
    `Prisma fixture generation failed after 2 attempts (120 seconds each): ${diagnostic}`,
  );
}

/** Drain child stderr while retaining at most the final 8 KiB. */
export async function stderrTail(stream: ReadableStream<Uint8Array>): Promise<string> {
  let tail = new Uint8Array(0);
  for await (const chunk of stream) {
    const incoming = chunk.slice(-8192);
    const retained = tail.slice(-Math.max(0, 8192 - incoming.length));
    const next = new Uint8Array(Math.min(8192, tail.length + incoming.length));
    if (incoming.length === 8192) next.set(incoming);
    else {
      next.set(retained);
      next.set(incoming, retained.length);
    }
    tail = next;
  }
  return new TextDecoder().decode(tail);
}
