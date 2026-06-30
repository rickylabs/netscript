/**
 * @module templates/plugins/generate-plugin-service-context
 *
 * Generator for the host-owned plugin service context bootstrap module.
 */

import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../adapters/templates/template-asset.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';

/** Generate `services/_shared/plugin-service-context.ts`. */
export function generatePluginServiceContext(): string {
  return readTemplateAssetSync(TEMPLATE_KEYS.pluginsServiceContext)
    .replace(
      "'@netscript/plugin/sdk'",
      `'${netscriptJsrSpecifier('plugin', '/sdk')}'`,
    )
    .replace(
      "'@netscript/plugin/loader'",
      `'${netscriptJsrSpecifier('plugin', '/loader')}'`,
    )
    .replace(
      "'@netscript/kv'",
      `'${netscriptJsrSpecifier('kv')}'`,
    )
    .replace(
      "'@netscript/contracts'",
      `'${netscriptJsrSpecifier('contracts')}'`,
    );
}
