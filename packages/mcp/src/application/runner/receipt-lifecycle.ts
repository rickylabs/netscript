import type { ToolFlow } from '../../domain/tool-types.ts';

/** Internal receipt settlement callback attached to one composed flow. */
export type FlowReceiptRecorder = (input: unknown, succeeded: boolean) => Promise<void>;

const FLOW_RECEIPT_RECORDER = Symbol('netscript.mcp.flow-receipt-recorder');

/** Attach receipt settlement to a flow without changing the public flow contract. */
export function withFlowReceipt(
  flow: ToolFlow,
  recorder: FlowReceiptRecorder,
): ToolFlow {
  const composed: ToolFlow = (input) => flow(input);
  Object.defineProperty(composed, FLOW_RECEIPT_RECORDER, { value: recorder });
  return composed;
}

/** Settle a composed flow's receipt after the runner determines its final outcome. */
export async function settleFlowReceipt(
  flow: ToolFlow,
  input: unknown,
  succeeded: boolean,
): Promise<void> {
  const recorder = Reflect.get(flow, FLOW_RECEIPT_RECORDER);
  if (typeof recorder === 'function') await recorder(input, succeeded);
}
