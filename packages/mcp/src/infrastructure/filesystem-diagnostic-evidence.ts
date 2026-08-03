import { dirname, join } from '@std/path';
import type {
  DiagnosticEvidencePort,
  DiagnosticEvidenceReceipt,
} from '../domain/diagnostic-evidence-port.ts';

/** Project-local JSON receipts and JSONL drift log. */
export class FilesystemDiagnosticEvidence implements DiagnosticEvidencePort {
  readonly #directory: string;
  readonly #driftPath: string;

  /** Bind evidence storage to one project root. */
  constructor(projectRoot: string) {
    this.#directory = join(projectRoot, '.netscript', 'agent', 'diagnostics');
    this.#driftPath = join(projectRoot, '.netscript', 'agent', 'drift.jsonl');
  }

  /** Read the newest JSON receipt for a resource. */
  async read(resource: string): Promise<DiagnosticEvidenceReceipt | undefined> {
    try {
      return JSON.parse(
        await Deno.readTextFile(this.#receiptPath(resource)),
      ) as DiagnosticEvidenceReceipt;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return undefined;
      throw error;
    }
  }

  /** Replace the JSON receipt for a resource. */
  async write(receipt: DiagnosticEvidenceReceipt): Promise<void> {
    await Deno.mkdir(this.#directory, { recursive: true });
    await Deno.writeTextFile(
      this.#receiptPath(receipt.resource),
      `${JSON.stringify(receipt, null, 2)}\n`,
    );
  }

  /** Append one JSON line to the project drift log. */
  async appendDrift(entry: string): Promise<void> {
    await Deno.mkdir(dirname(this.#driftPath), { recursive: true });
    await Deno.writeTextFile(this.#driftPath, `${entry}\n`, { append: true, create: true });
  }

  #receiptPath(resource: string): string {
    const safe = encodeURIComponent(resource).replaceAll('%', '_');
    return join(this.#directory, `${safe}.json`);
  }
}
