import { ServiceDeployTarget } from './service-deploy-target.ts';

/**
 * Linux (systemd) bare-metal service deploy target. Declares the canonical 6-op
 * surface (`plan`/`emit`/`up`/`down`/`status`/`logs`) and retains the legacy
 * `build`/`install`/`uninstall` verb aliases via {@link ServiceDeployTarget};
 * `rollback`/`secrets` stay declared-unsupported until #341 (LD-4). The systemd
 * execution is delivered by `SystemdOsServiceAdapter` on the public deploy path;
 * this descriptor is the Archetype-7 registry identity for the `linux-service`
 * key reserved by `KnownDeployTargetKey`.
 */
export class LinuxServiceDeployTarget extends ServiceDeployTarget {
  override readonly key = 'linux-service';
  override readonly label = 'Linux service';
}
