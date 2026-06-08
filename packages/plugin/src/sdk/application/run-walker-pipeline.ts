import type { EmitterPort, RegistryEmission } from '../discovery/ports/emitter-port.ts';
import type { ExtractorPort } from '../discovery/ports/extractor-port.ts';
import type { WalkerPort } from '../discovery/ports/walker-port.ts';

/** Options for running the SDK walker pipeline. */
export interface RunWalkerPipelineOptions {
  /** Root directory to walk. */
  readonly root: string;
  /** Source walker used to discover files. */
  readonly walker: WalkerPort;
  /** Extractor used to identify contribution declarations. */
  readonly extractor: ExtractorPort;
  /** Emitter used to produce registry files. */
  readonly emitter: EmitterPort;
}

/** Run the plugin SDK discovery pipeline. */
export async function runWalkerPipeline(
  options: RunWalkerPipelineOptions,
): Promise<readonly RegistryEmission[]> {
  const files = await options.walker.walk(options.root);
  const contributions = await options.extractor.extract(files);
  return await options.emitter.emit(contributions);
}
