/** Target-side preparation required before registering packaged backend services. */
export interface DeploymentBootstrapPort {
  /** Provision the installation identity and relocate the selected service definitions. */
  prepare(installDir: string, serviceNames: readonly string[]): Promise<void>;
}
