import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

const encoder = new TextEncoder();

/** Streaming NDJSON reporter. */
export class NdjsonReporter implements Reporter {
  async emit(event: ReportEvent): Promise<void> {
    await Deno.stdout.write(encoder.encode(`${JSON.stringify(event)}\n`));
  }
}
