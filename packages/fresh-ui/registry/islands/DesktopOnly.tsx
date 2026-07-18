/**
 * @component DesktopOnly
 * @layer 2
 * @depends theme-seed
 * @description Hydration-safe desktop gate using the NetScript desktop RPC binding seam.
 */

import { DEFAULT_DESKTOP_RPC_BINDING } from '@netscript/sdk/desktop';
import type { ComponentChildren, VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/** Props for the desktop-only island. */
export interface DesktopOnlyProps {
  /** Content mounted only after a desktop binding is detected in the webview. */
  readonly children?: ComponentChildren;
  /** Optional browser/Aspire content. Defaults to no rendered output. */
  readonly fallback?: ComponentChildren;
  /** Binding name to detect. Defaults to the merged NetScript desktop RPC binding. */
  readonly bindingName?: string;
}

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
  return value !== null && typeof value === 'object';
}

/** Return whether the current webview exposes one named Deno Desktop binding. */
export function isDesktopBindingAvailable(
  bindingName: string = DEFAULT_DESKTOP_RPC_BINDING,
  host: object = globalThis,
): boolean {
  const bindings = Reflect.get(host, 'bindings');
  return isRecord(bindings) && typeof Reflect.get(bindings, bindingName) === 'function';
}

/** Mount children only in a hydrated Deno Desktop webview; browser/Aspire output is inert. */
export default function DesktopOnly({
  children,
  fallback = null,
  bindingName = DEFAULT_DESKTOP_RPC_BINDING,
}: DesktopOnlyProps): VNode | null {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setDesktop(isDesktopBindingAvailable(bindingName));
  }, [bindingName]);

  return desktop ? <>{children}</> : fallback === null ? null : <>{fallback}</>;
}
