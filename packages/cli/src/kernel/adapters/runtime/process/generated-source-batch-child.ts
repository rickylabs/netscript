/** Trusted formatting child: private temporary files only, never consumer paths or config imports. */
import { DenoProcess } from './deno-process.ts';
import type { ProcessPort } from '../../../ports/process-port.ts';
import {
  GENERATED_FORMAT_ARGS,
  MAX_BATCH_CHARACTERS,
  MAX_BATCH_PROTOCOL_BYTES,
  SUPPORTED_EXTENSIONS,
} from './generated-source-format-policy.ts';

interface Source {
  readonly extension: string;
  readonly content: string;
}

/** Canonicalize a validated batch with exactly one formatter process and guaranteed staging cleanup. */
export async function formatStagedSourceBatch(
  files: readonly Source[],
  process: ProcessPort,
  temporaryDirectory?: string,
): Promise<readonly string[]> {
  const stagingRoot = await Deno.makeTempDir({ dir: temporaryDirectory });
  try {
    // Deno accepts forward-slash separators on every supported platform; names contain no paths.
    const paths = files.map((file, index) => `${stagingRoot}/${index}.${file.extension}`);
    for (let index = 0; index < files.length; index++) {
      await Deno.writeTextFile(paths[index], files[index].content);
    }
    const result = await process.exec('deno', ['fmt', ...GENERATED_FORMAT_ARGS, ...paths], {
      cwd: stagingRoot,
    });
    if (result.code !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`);
    }
    const contents: string[] = [];
    let total = 0;
    for (const path of paths) {
      if ((await Deno.stat(path)).size > 16 * 1024 * 1024) {
        throw new Error('Formatted source exceeds its bounded byte capacity.');
      }
      const content = await Deno.readTextFile(path);
      total += content.length;
      if (content.length > 16 * 1024 * 1024 || total > MAX_BATCH_CHARACTERS) {
        throw new Error('Formatted source batch exceeds its bounded capacity.');
      }
      contents.push(content);
    }
    return contents;
  } finally {
    await Deno.remove(stagingRoot, { recursive: true });
  }
}

async function readSources(): Promise<readonly Source[]> {
  let size = 0;
  const bounded = Deno.stdin.readable.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > MAX_BATCH_PROTOCOL_BYTES) {
          throw new Error('Formatting request exceeds capacity.');
        }
        controller.enqueue(chunk);
      },
    }),
  );
  const input: unknown = JSON.parse(await new Response(bounded).text());
  if (!Array.isArray(input) || input.length === 0 || input.length > 256) {
    throw new Error('Invalid source formatting batch.');
  }
  let total = 0;
  const files: Source[] = [];
  for (const entry of input) {
    if (typeof entry !== 'object' || entry === null) throw new Error('Invalid source entry.');
    const source = entry as Record<string, unknown>;
    if (
      typeof source.extension !== 'string' || !SUPPORTED_EXTENSIONS.has(source.extension) ||
      typeof source.content !== 'string' || source.content.length > 16 * 1024 * 1024
    ) {
      throw new Error('Invalid source entry.');
    }
    total += source.content.length;
    if (total > MAX_BATCH_CHARACTERS) throw new Error('Formatting request exceeds capacity.');
    files.push({ extension: source.extension, content: source.content });
  }
  return files;
}

async function main(): Promise<void> {
  try {
    const native = new DenoProcess();
    let formatterProcesses = 0;
    const process: ProcessPort = {
      exec: (command, args, options) => {
        formatterProcesses++;
        return native.exec(command, args, options);
      },
    };
    const contents = await formatStagedSourceBatch(await readSources(), process, Deno.args[0]);
    console.log(JSON.stringify({ contents, formatterProcesses }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exitCode = 1;
    return;
  }
}

if (import.meta.main) await main();
