/** The version-1 inventory fields consumed by project wiring diagnostics. */
export interface PluginRegistryInventory {
  readonly version: 1;
  readonly generator: 'public.generate.plugins';
  readonly status: 'current' | 'drift' | 'inspection-failure';
  readonly exitCode: 0 | 1;
  readonly producers: readonly {
    readonly generator: string;
    readonly version: string;
    readonly outputs: readonly string[];
  }[];
  readonly outputs: readonly {
    readonly generator: string;
    readonly path: string;
    readonly ownership: 'generated';
    readonly digest: string;
  }[];
  readonly inputs: readonly {
    readonly generator: string;
    readonly path: string;
    readonly ownership: 'authored';
    readonly digest: string;
  }[];
  readonly drift: readonly {
    readonly path: string;
    readonly kind: 'missing' | 'extra' | 'ownership' | 'bytes' | 'inspection-failure';
    readonly message?: string;
  }[];
}
