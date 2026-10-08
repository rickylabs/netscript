/** Released-consumer construction probe; never performs inference. @module */
import { AnthropicModelProvider } from 'jsr:@netscript/ai@0.0.7/anthropic';

const originalFetch = globalThis.fetch;
let requests = 0;
globalThis.fetch = () => {
  requests++;
  throw new Error('provider IO disabled by released-consumer probe');
};
try {
  const provider = new AnthropicModelProvider({ apiKey: 'test-unused-key' });
  const results = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1'].map((model) => {
    try { provider.createChatClient(model); return { model, constructs: true }; }
    catch (error) {
      return { model, constructs: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  console.log(JSON.stringify({ package: '@netscript/ai@0.0.7', results, providerRequests: requests, liveInference: false }));
  if (requests !== 0) throw new Error('construction made a provider request');
} finally { globalThis.fetch = originalFetch; }
