/** AI adapter resources.
 *
 * @module
 */

export { type BarrelInput, barrelScaffolder, DEFAULT_BARREL_INPUT } from './barrel/barrel.ts';
export { DEFAULT_MODELS_INPUT, type ModelsInput, modelsScaffolder } from './models/models.ts';
export {
  type ChatRouteInput,
  chatRouteScaffolder,
  DEFAULT_CHAT_ROUTE_INPUT,
} from './chat-route/chat-route.ts';
export {
  DEFAULT_STREAM_PROXY_INPUT,
  type StreamProxyInput,
  streamProxyScaffolder,
} from './stream-proxy/stream-proxy.ts';
export { DEFAULT_TOOL_INPUT, toolResource, toolScaffolder } from './tool/tool.ts';
export { agentResource, agentScaffolder, DEFAULT_AGENT_INPUT } from './agent/agent.ts';
export { type McpToolInput, mcpToolScaffolder } from './mcp-tool/mcp-tool.ts';
export {
  DEFAULT_THREAD_STORE_INPUT,
  threadStoreResource,
  threadStoreScaffolder,
} from './thread-store/thread-store.ts';
export {
  type AiResourceInput,
  exportStem,
  fileStem,
  parseResourceInput,
  requiredResourceId,
} from './input.ts';
