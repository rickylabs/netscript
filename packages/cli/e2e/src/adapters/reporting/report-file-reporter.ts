import { dirname } from '@std/path';
import { ensureDir } from '@std/fs';
import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

/** Reporter that writes the final JSON report to a file. */
export class ReportFileReporter implements Reporter {
  constructor(private readonly path: string) {}

  async emit(event: ReportEvent): Promise<void> {
    if (event.type !== 'suite-end') return;
    await ensureDir(dirname(this.path));
    await Deno.writeTextFile(this.path, `${JSON.stringify(event.report, null, 2)}\n`);
  }
}
