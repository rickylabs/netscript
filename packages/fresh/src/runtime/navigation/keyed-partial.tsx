import { Partial } from 'fresh/runtime';
import type { ComponentChild, KeyedPartialProps } from './types.ts';

/**
 * Render a Fresh partial whose native reconciliation key follows its name.
 *
 * Fresh normalizes serialized marker keys by replacing colons with
 * underscores. The VNode key remains the caller-provided name, so every name
 * change still remounts the boundary and refreshes Fresh's partial registry.
 *
 * @param props - Named partial content and application mode.
 * @returns A keyed Fresh partial VNode.
 *
 * @example
 * ```tsx
 * import type { ComponentChild } from '@netscript/fresh/navigation';
 *
 * declare const orderId: string;
 * declare const order: { readonly id: string };
 * declare function OrderSummary(props: { readonly order: { readonly id: string } }): ComponentChild;
 *
 * <KeyedPartial name={`order-${orderId}`}>
 *   <OrderSummary order={order} />
 * </KeyedPartial>;
 * ```
 */
export function KeyedPartial(props: KeyedPartialProps): ComponentChild {
  return (
    <Partial key={props.name} name={props.name} mode={props.mode}>
      {props.children}
    </Partial>
  );
}
