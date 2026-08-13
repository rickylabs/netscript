import { dirname } from '@std/path';
import { ensureDir } from '@std/fs';
import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

/** Reporter that writes the final JSON report to a file. */
export class ReportFileReporter implements Reporter {
  constructor(private readonly path: string) {}

  async emit(event: ReportEvent): Promise<void> {
    if (event.type !== 'suite-end') return;
    await ensureDir(dirname(this.path));
    const temp = `${this.path}.${crypto.randomUUID()}.tmp`;
    try {
      await Deno.writeTextFile(temp, `${JSON.stringify(event.report, null, 2)}\n`, {
        createNew: true,
      });
      await Deno.rename(temp, this.path);
    } finally {
      await Deno.remove(temp).catch(() => undefined);
    }
  }
}
