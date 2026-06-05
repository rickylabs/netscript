/** Background processor contributed by a plugin. */
export interface BackgroundProcessorContribution {
  /** Logical processor name. */
  readonly name: string;
  /** Processor entrypoint path. */
  readonly entrypoint: string;
  /** Optional processor concurrency. */
  readonly concurrency?: number;
}
