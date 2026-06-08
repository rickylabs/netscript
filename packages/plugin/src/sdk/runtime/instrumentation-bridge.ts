/** Bridge between plugin runtime and telemetry instrumentation. */
export interface InstrumentationBridge {
  /** Register a plugin or contribution name with instrumentation. */
  readonly register: (name: string) => void;
}

/** Create a recording instrumentation bridge. */
export function createInstrumentationBridge(): InstrumentationBridge & {
  readonly names: readonly string[];
} {
  const names: string[] = [];
  return {
    names,
    register: (name: string) => {
      names.push(name);
    },
  };
}
