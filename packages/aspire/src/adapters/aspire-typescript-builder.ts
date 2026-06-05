import { MemoryAspireBuilder } from '../testing/mod.ts';

/** SDK-neutral builder adapter for TypeScript AppHost composition tests. */
export class AspireTypeScriptBuilder extends MemoryAspireBuilder {
  /** Return a serializable AppHost operation list. */
  toOperations(): readonly Record<string, unknown>[] {
    return [
      ...this.resources.map((resource) => ({
        type: 'resource',
        resource,
      })),
      ...this.references.map((reference) => ({
        type: 'reference',
        reference,
      })),
    ];
  }
}
