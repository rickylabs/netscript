/**
 * JSON reporter: writes the scored run summary as pretty JSON to an output
 * sink. The round-trip (summary -> JSON -> parsed) is the unit-test anchor for
 * the reporting layer.
 *
 * @module
 */

import type { RunSummary } from '../../domain/report.ts';
import type { OutputSink } from '../../ports/output-sink.ts';
import type { Reporter } from '../../ports/reporter.ts';

/** Serializes a {@link RunSummary} as indented JSON. */
export class JsonReporter implements Reporter {
  readonly #sink: OutputSink;

  constructor(sink: OutputSink) {
    this.#sink = sink;
  }

  async report(summary: RunSummary): Promise<void> {
    await this.#sink.write(JSON.stringify(summary, null, 2));
  }
}
