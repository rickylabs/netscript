import { SagaConfigScaffolder, SagaDefinitionScaffolder } from './saga-scaffolders.ts';
import type { SagasScaffoldInput } from './input.ts';
import type { SagasItemScaffolder } from './sagas-item-scaffolder.ts';

/** Create all first-party sagas item scaffolders. */
export function createSagasItemScaffolders(): readonly SagasItemScaffolder<SagasScaffoldInput>[] {
  return Object.freeze([
    new SagaDefinitionScaffolder(),
    new SagaConfigScaffolder(),
  ]);
}
