import { AstExtractor } from '../discovery/ast-extractor.ts';
import { FilesystemWalker } from '../discovery/filesystem-walker.ts';
import { RegistryEmitter } from '../discovery/registry-emitter.ts';
import { runWalkerPipeline } from '../application/run-walker-pipeline.ts';
import type { RegistryEmission } from '../discovery/ports/emitter-port.ts';

/** Start a one-shot SDK walker with default alpha adapters. */
export function startWalker(root: string): Promise<readonly RegistryEmission[]> {
  return runWalkerPipeline({
    root,
    walker: new FilesystemWalker(),
    extractor: new AstExtractor(),
    emitter: new RegistryEmitter(),
  });
}
