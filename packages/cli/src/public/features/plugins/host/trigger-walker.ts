import type {
  EmitterPort,
  ExtractorPort,
  RegistryEmission,
  WalkerPort,
} from '@netscript/plugin/sdk';

/** Options for triggering the plugin discovery walker. */
export interface TriggerWalkerOptions {
  /** Project root passed to the walker. */
  readonly projectRoot: string;
  /** SDK walker port. */
  readonly walker: WalkerPort;
  /** SDK extractor port. */
  readonly extractor: ExtractorPort;
  /** SDK emitter port. */
  readonly emitter: EmitterPort;
}

/** Resolve walker emissions for the current project root. */
export async function resolveWalkerEmissions(
  options: TriggerWalkerOptions,
): Promise<readonly RegistryEmission[]> {
  const files = await options.walker.walk(options.projectRoot);
  const contributions = await options.extractor.extract(files);
  return await options.emitter.emit(contributions);
}
