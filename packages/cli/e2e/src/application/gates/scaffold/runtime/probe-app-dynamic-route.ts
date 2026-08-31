/** HTTP-semantic evidence returned by one generated dynamic-route request. */
export interface DynamicRouteResponseEvidence {
  readonly mode: 'plain' | 'partial';
  readonly nonce: string;
  readonly status: number;
  readonly body: string;
}

/** Stable semantic rejection classes used by the probe and its focused tests. */
export type DynamicRouteResponseFailure =
  | 'status'
  | 'path-marker'
  | 'href-marker'
  | 'binding-not-proven';

/** Result of checking one response without performing network I/O. */
export type DynamicRouteResponseValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly failure: DynamicRouteResponseFailure; readonly message: string };

/** Validate one generated dynamic-route response with element/attribute-scoped markers. */
export function validateDynamicRouteResponse(
  evidence: DynamicRouteResponseEvidence,
): DynamicRouteResponseValidation {
  if (evidence.status !== 200) {
    return {
      ok: false,
      failure: 'status',
      message: `${evidence.mode} dynamic route returned HTTP ${evidence.status}`,
    };
  }

  const pathMarker = `data-order-id="${evidence.nonce}"`;
  if (!evidence.body.includes(pathMarker)) {
    return {
      ok: false,
      failure: 'path-marker',
      message: `${evidence.mode} dynamic route did not render ${pathMarker}`,
    };
  }

  const hrefMarker = `href="/examples/orders/${evidence.nonce}"`;
  if (!evidence.body.includes(hrefMarker)) {
    return {
      ok: false,
      failure: 'href-marker',
      message: `${evidence.mode} dynamic route did not render ${hrefMarker}`,
    };
  }

  return {
    ok: false,
    failure: 'binding-not-proven',
    message: `${evidence.mode} dynamic route binding is not implemented`,
  };
}
