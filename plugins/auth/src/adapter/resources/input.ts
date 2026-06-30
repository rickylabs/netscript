/** Shared input for auth adapter install resources.
 *
 * @module
 */

/** Input accepted by the auth barrel install scaffolder. */
export interface AuthBarrelInput {
  /** Published auth core contract module re-exported by the userland barrel. */
  readonly coreContractsSpecifier: string;
}
