import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from './deploy-target-port.ts';

/** Windows service deploy target descriptor and adapter identity. */
export class WindowsServiceDeployTarget implements DeployTargetPort {
  readonly key = 'windows-service';
  readonly label = 'Windows service';
  readonly operations: readonly DeployTargetOperation[] = ['build', 'install', 'uninstall'];

  /** Build is currently delegated to the public deploy build command pipeline. */
  build(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return Promise.resolve(this.#result('build', request));
  }

  /** Install is currently delegated to the public deploy install command pipeline. */
  install(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return Promise.resolve(this.#result('install', request));
  }

  /** Uninstall is currently delegated to the public deploy uninstall command pipeline. */
  uninstall(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return Promise.resolve(this.#result('uninstall', request));
  }

  #result(operation: DeployTargetOperation, request: DeployTargetRequest): DeployTargetResult {
    return {
      target: this.key,
      operation,
      message: `${this.label} ${operation} registered for ${request.projectRoot}`,
    };
  }
}
