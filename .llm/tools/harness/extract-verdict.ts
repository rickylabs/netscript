/**
 * extract-verdict.ts — read an evaluator verdict out of a Claude Code `stream-json` transcript,
 * and REFUSE to return a silent pass.
 *
 * ## Why this exists
 *
 * Claude Code's terminal `result` event carries an **empty `result` string** on some
 * model/transport combinations (observed on the OpenRouter open-model evaluator lane,
 * `qwen/qwen3.7-max`), while still reporting:
 *
 * ```json
 * { "type": "result", "subtype": "success", "is_error": false, "result": "" }
 * ```
 *
 * The verdict is not missing — it is in the assistant `message.content[].text` blocks. A harness
 * that reads the obvious, conventional `result` field therefore gets an **empty string that looks
 * like a successful run**.
 *
 * An evaluator that returns nothing and is read as "no findings" is worse than no evaluator: it
 * manufactures the exact false confidence that generator-≠-evaluator exists to prevent.
 *
 * ## The rules this encodes
 *
 * 1. Read the verdict from **assistant text blocks**, never from `result`.
 * 2. An **empty** evaluator output is a HARD ERROR, never a pass.
 * 3. Output that contains **no verdict token** is also a failure to evaluate — a confident-sounding
 *    essay with no verdict is not a verdict.
 *
 * Status (`is_error`, `subtype: success`, exit 0) is NOT evidence. Evidence is output you can point
 * at.
 *
 * Usage:
 *   deno run --allow-read .llm/tools/harness/extract-verdict.ts <stream-json-log> [--json]
 *
 * Exit: 0 = a verdict token was found; 1 = empty or verdict-less output (loudly).
 */

/** The only tokens that count as an evaluator having actually decided something. */
export const VERDICT_TOKENS = [
  'PASS',
  'FAIL_FIX',
  'FAIL_RESCOPE',
  'FAIL_DEBT',
  'FAIL_PLAN',
] as const;

export type VerdictToken = typeof VERDICT_TOKENS[number];

export interface VerdictExtraction {
  /** Concatenated assistant text blocks — the real evaluator output. */
  readonly text: string;
  /** The verdict token found, if any. */
  readonly verdict?: VerdictToken;
  /** Whatever the terminal `result` event claimed, for comparison. Often empty — do not trust it. */
  readonly resultField?: string;
  /** What the transcript claimed about its own success. Not evidence. */
  readonly reportedSuccess?: boolean;
  /** Non-empty when the extraction must be treated as a failed evaluation. */
  readonly failure?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Pull the assistant text out of a Claude Code `stream-json` transcript.
 *
 * Deliberately does NOT fall back to `result`: falling back would re-open the exact hole this tool
 * closes, by letting an empty-but-successful-looking run pass through.
 */
export function extractVerdict(transcript: string): VerdictExtraction {
  const chunks: string[] = [];
  let resultField: string | undefined;
  let reportedSuccess: boolean | undefined;

  for (const line of transcript.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let event: unknown;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue; // non-JSON noise on the stream is not fatal
    }
    if (!isRecord(event)) continue;

    if (event.type === 'assistant' && isRecord(event.message)) {
      const content = event.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (isRecord(block) && block.type === 'text' && typeof block.text === 'string') {
            chunks.push(block.text);
          }
        }
      }
    }

    if (event.type === 'result') {
      if (typeof event.result === 'string') resultField = event.result;
      if (typeof event.is_error === 'boolean') reportedSuccess = !event.is_error;
    }
  }

  const text = chunks.join('\n').trim();

  if (text.length === 0) {
    return {
      text,
      resultField,
      reportedSuccess,
      failure:
        'EMPTY EVALUATOR OUTPUT. No assistant text blocks were produced. This is a FAILED evaluation, ' +
        'not a pass — regardless of what `subtype` or `is_error` claimed.',
    };
  }

  const verdict = VERDICT_TOKENS.find((token) =>
    new RegExp(`(^|[^A-Z_])${token}([^A-Z_]|$)`).test(text)
  );

  if (!verdict) {
    return {
      text,
      resultField,
      reportedSuccess,
      failure:
        `NO VERDICT TOKEN in ${text.length} chars of evaluator output. Expected one of: ` +
        `${VERDICT_TOKENS.join(', ')}. An answer that never renders a verdict is a failure to evaluate.`,
    };
  }

  return { text, verdict, resultField, reportedSuccess };
}

async function main(): Promise<void> {
  const args = Deno.args.filter((arg) => arg !== '--json');
  const asJson = Deno.args.includes('--json');
  const path = args[0];

  if (!path) {
    console.error('usage: extract-verdict.ts <stream-json-log> [--json]');
    Deno.exit(2);
  }

  const extraction = extractVerdict(await Deno.readTextFile(path));

  if (asJson) {
    console.log(JSON.stringify({
      verdict: extraction.verdict ?? null,
      textLength: extraction.text.length,
      resultFieldLength: extraction.resultField?.length ?? null,
      reportedSuccess: extraction.reportedSuccess ?? null,
      failure: extraction.failure ?? null,
    }));
  }

  if (extraction.failure) {
    console.error(`\n✗ ${extraction.failure}`);
    if (extraction.reportedSuccess) {
      console.error(
        '  NOTE: the transcript reported SUCCESS (is_error=false). Status is not evidence.',
      );
    }
    Deno.exit(1);
  }

  if (!asJson) {
    console.log(extraction.text);
    console.error(`\n✓ verdict: ${extraction.verdict} (${extraction.text.length} chars)`);
    if ((extraction.resultField?.length ?? 0) === 0) {
      console.error(
        '  NOTE: the `result` field was EMPTY — reading it instead of the assistant text blocks ' +
          'would have produced a silent, empty pass.',
      );
    }
  }
}

if (import.meta.main) await main();
