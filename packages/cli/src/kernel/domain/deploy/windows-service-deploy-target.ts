import { ServiceDeployTarget } from './service-deploy-target.ts';

/**
 * Windows (Servy) bare-metal service deploy target. Declares the canonical 6-op
 * surface (`plan`/`emit`/`up`/`down`/`status`/`logs`) and retains the legacy
 * `build`/`install`/`uninstall` verb aliases via {@link ServiceDeployTarget};
 * `rollback`/`secrets` stay declared-unsupported until #341 (LD-4).
 */
export class WindowsServiceDeployTarget extends ServiceDeployTarget {
  override readonly key = 'windows-service';
  override readonly label = 'Windows service';
}
