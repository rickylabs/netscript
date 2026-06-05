import { dirname } from '@std/path';
import { ensureDir } from '@std/fs';
import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

/** Reporter that appends all events as NDJSON to a log file. */
export class LogFileReporter implements Reporter {
  constructor(private readonly path: string) {}

  async emit(event: ReportEvent): Promise<void> {
    await ensureDir(dirname(this.path));
    await Deno.writeTextFile(this.path, `${JSON.stringify(event)}\n`, { append: true });
  }
}
