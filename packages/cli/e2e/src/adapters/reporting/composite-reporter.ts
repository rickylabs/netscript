import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

/** Reporter that fans events out to multiple reporters. */
export class CompositeReporter implements Reporter {
  constructor(private readonly reporters: readonly Reporter[]) {}

  async emit(event: ReportEvent): Promise<void> {
    for (const reporter of this.reporters) {
      await reporter.emit(event);
    }
  }
}
