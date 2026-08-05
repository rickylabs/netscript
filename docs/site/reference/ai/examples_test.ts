import { assertEquals } from "@std/assert";
import { getModelProvider, type RetrieverPort, type RetrievalResult } from "../../../../packages/ai/mod.ts";
import { OllamaModelProvider } from "../../../../packages/ai/ollama.ts";
import "../../../../packages/ai/ollama.ts"; // Side effect: registers the provider
import { withRetryingChatClient, type AiRetryPolicy, AiRateLimitError } from "../../../../packages/ai/mod.ts";
import { createAgentLoop, tokenBudgetHistory } from "../../../../packages/ai/agent.ts";
import type { ChatClientPort, ChatModelProviderPort, ToolRegistryPort } from "../../../../packages/ai/agent.ts";
import type { Message } from "../../../../packages/ai/src/contracts/mod.ts";

// 1. Ollama reachability example test
Deno.test("Ollama reachability example", async () => {
  const provider = getModelProvider("ollama", { models: ["llama3.2"] }) as OllamaModelProvider;
  
  // Stub checkReachable to avoid network requests during test runs
  const originalCheck = provider.checkReachable;
  provider.checkReachable = () => Promise.resolve({ reachable: true, detail: "mocked" });
  
  const health = await provider.checkReachable();
  assertEquals(health.reachable, true);
  provider.checkReachable = originalCheck;
});

// 2. Opt-in Rate-Limit Retries example test
Deno.test("Opt-in Rate-Limit Retries example", async () => {
  const mockClient: ChatClientPort = {
    kind: "text",
    name: "mock-client",
    async *stream() {
      yield { type: "text", delta: "Hello!" };
    }
  };
  
  const retryPolicy: AiRetryPolicy = {
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 3000,
    factor: 2,
  };
  
  const retryingClient = withRetryingChatClient(mockClient, retryPolicy);
  const stream = retryingClient.stream({
    messages: [{ role: "user", content: "Hello!" }],
  });
  
  const events = [];
  for await (const event of stream) {
    events.push(event);
  }
  
  assertEquals(events.length, 1);
  assertEquals(events[0].type, "text");
});

// 3. Manage Token Budgets in Agent Loops example test
Deno.test("Manage Token Budgets in Agent Loops example", () => {
  const mockProvider: ChatModelProviderPort = {
    id: "mock",
    createChatClient: () => ({
      kind: "text",
      name: "mock",
      stream: async function*() {}
    })
  };
  
  const mockTools: ToolRegistryPort = {
    register: () => {},
    unregister: () => {},
    has: () => false,
    get: () => undefined,
    list: () => [],
    resolveHandler: () => undefined,
  };

  const loop = createAgentLoop({
    modelProvider: mockProvider,
    tools: mockTools,
    history: tokenBudgetHistory({
      budget: 4000,
      estimator: (message: Readonly<Message>) => {
        const text = typeof message.content === "string" 
          ? message.content 
          : JSON.stringify(message.content);
        return Math.ceil(text.length / 3.8);
      },
    }),
  });
  
  assertEquals(typeof loop.run, "function");
});

// 4. Citation-Ready RAG Retrieval example test
Deno.test("Citation-Ready RAG Retrieval example", async () => {
  class LocalDocumentRetriever implements RetrieverPort {
    async retrieve(query: string, k: number): Promise<readonly RetrievalResult[]> {
      const textSegment = "NetScript is built on Deno and uses V8 sandboxing.";
      const score = 0.89;
      
      return [{
        id: "doc-v8-segment-1",
        content: textSegment,
        score,
        matchedBy: "hybrid",
        provenance: {
          sourceId: "netscript-sandbox-docs",
          title: "NetScript Sandboxing Architecture",
          span: {
            start: 27,
            end: 48,
            text: "V8 sandboxing",
          },
        },
      }];
    }
  }

  const retriever = new LocalDocumentRetriever();
  const docs = await retriever.retrieve("sandboxing", 1);
  assertEquals(docs.length, 1);
  assertEquals(docs[0].provenance.span.end, 48);
});
