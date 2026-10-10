import { checkAspireSurface } from '../../../../kernel/adapters/service/aspire-surface-checker.ts';
import { renderAspireSurface } from '../../../../kernel/adapters/service/aspire-surface-renderer.ts';
import type { AspireSurfaceReport } from '../../../../kernel/domain/aspire-generated-surface.ts';
import type { GenerateAspireDependencies } from './generate-aspire.ts';

/** Inspect the same selected and rendered surface as generateAspire without a writer dependency. */
export async function checkAspire(
  projectRoot: string,
  dependencies: Pick<GenerateAspireDependencies, 'fs' | 'templateAdapter' | 'formatter'>,
): Promise<AspireSurfaceReport> {
  return await checkAspireSurface(
    projectRoot,
    () =>
      renderAspireSurface(projectRoot, dependencies.fs, dependencies.templateAdapter, {
        formatter: dependencies.formatter,
      }),
  );
}
