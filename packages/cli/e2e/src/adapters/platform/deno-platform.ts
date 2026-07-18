import type { ExecutionPlatform } from '../../domain/platform.ts';
import { EXECUTION_PLATFORMS } from '../../domain/platform.ts';
import type { PlatformPort } from '../../ports/platform.ts';

/** Reads the current execution platform from the Deno runtime. */
export class DenoPlatform implements PlatformPort {
  current(): ExecutionPlatform {
    switch (Deno.build.os) {
      case 'linux':
        return EXECUTION_PLATFORMS.LINUX;
      case 'windows':
        return EXECUTION_PLATFORMS.WINDOWS;
      case 'darwin':
        return EXECUTION_PLATFORMS.DARWIN;
      default:
        throw new Error(`Unsupported E2E execution platform: ${Deno.build.os}.`);
    }
  }
}
