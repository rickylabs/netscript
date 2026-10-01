import { assertEquals } from '@std/assert';
import { readOpenCodeOutput } from './opencode-answer.ts';

const encoder = new TextEncoder();
const answer = JSON.stringify({
  type: 'text',
  part: { type: 'text', text: 'Verdict: PASS — fixture' },
});
function child(chunks: readonly Uint8Array[], code = 0) {
  return {
    status: Promise.resolve({ success: code === 0, code, signal: null }),
    stdout: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  };
}
const ignore = (bytes: Uint8Array) => Promise.resolve(bytes.length);

for (const capture of [false, true]) {
  for (
    const [format, value] of [
      ['default', ''],
      ['default', ' \t\n\r'],
      ['json', ''],
      ['json', ' \t\n'],
      [
        'json',
        JSON.stringify({
          type: 'step_finish',
          part: { text: 'metadata is not an answer', tokens: { output: 10 } },
        }),
      ],
      [
        'json',
        JSON.stringify({
          type: 'tool_use',
          part: { type: 'tool', state: { output: 'tool output is not an answer' } },
        }),
      ],
      [
        'json',
        JSON.stringify({
          type: 'reasoning',
          part: { type: 'reasoning', text: 'thinking is not the final answer' },
        }),
      ],
      ['json', JSON.stringify({ type: 'text', part: { type: 'text', text: ' \n\t' } })],
    ] as const
  ) {
    Deno.test(`rc0 without an answer fails: capture=${capture}, format=${format}, case=${value.slice(0, 35)}`, async () => {
      const result = await readOpenCodeOutput(child([encoder.encode(value)]), {
        capture,
        format,
        writeStdout: ignore,
      });
      assertEquals(result.code, 3);
      assertEquals(result.failure, 'empty-answer');
      assertEquals(result.stdout, capture ? value : undefined);
    });
  }
}

Deno.test('JSON text survives every byte split, trailing unterminated line and partial stdout writes', async () => {
  const bytes = encoder.encode(answer);
  for (let split = 0; split <= bytes.length; split++) {
    const forwarded: number[] = [];
    const result = await readOpenCodeOutput(child([bytes.slice(0, split), bytes.slice(split)]), {
      capture: false,
      format: 'json',
      writeStdout: (chunk) => {
        forwarded.push(chunk[0]!);
        return Promise.resolve(1);
      },
    });
    assertEquals(result.code, 0);
    assertEquals(result.failure, undefined);
    assertEquals(new Uint8Array(forwarded), bytes);
  }
});

Deno.test('plain and JSON answers preserve capture and native nonzero status', async () => {
  for (
    const [format, text] of [['default', 'fixture answer\n'], ['json', answer + '\n']] as const
  ) {
    for (const code of [0, 7]) {
      const result = await readOpenCodeOutput(child([encoder.encode(text)], code), {
        capture: true,
        format,
        writeStdout: ignore,
      });
      assertEquals(result.code, code);
      assertEquals(result.stdout, text);
      assertEquals(result.failure, undefined);
    }
  }
  const result = await readOpenCodeOutput(child([], 9), {
    capture: true,
    format: 'default',
    writeStdout: ignore,
  });
  assertEquals(result, { code: 9, stdout: '' });
});

Deno.test('malformed, oversized, invalid UTF8 and non-text JSON cannot establish an answer', async () => {
  for (
    const bytes of [
      encoder.encode('not JSON\n' + answer),
      encoder.encode('x'.repeat(1024 * 1024 + 1)),
      new Uint8Array([0xff]),
      encoder.encode('[]'),
    ]
  ) {
    const result = await readOpenCodeOutput(child([bytes]), {
      capture: true,
      format: 'json',
      writeStdout: ignore,
    });
    assertEquals(result.code, 3);
    assertEquals(result.failure, 'output-malformed');
  }
});

Deno.test('a pipe held open after rc0 is cancelled and cannot hang or certify partial output', async () => {
  let cancelled = false;
  const stdout = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('partial answer'));
    },
    cancel() {
      cancelled = true;
    },
  });
  const result = await readOpenCodeOutput({
    stdout,
    status: Promise.resolve({ success: true, code: 0, signal: null }),
  }, { capture: true, format: 'default', writeStdout: ignore, drainTimeoutMs: 30 });
  assertEquals(cancelled, true);
  assertEquals(result.code, 3);
  assertEquals(result.failure, 'output-incomplete');
});

Deno.test('a failed stdout write cancels the pipe and fails explicitly', async () => {
  const result = await readOpenCodeOutput(child([encoder.encode('fixture answer')]), {
    capture: false,
    format: 'default',
    writeStdout: () => Promise.resolve(0),
  });
  assertEquals(result.code, 3);
  assertEquals(result.failure, 'output-incomplete');
});
