# Research

Read existing component and site renderer; consult NetScript MCP find_guidance/search_docs before authoring. Current public API inspection confirms defineSaga/on/correlate, defineWebhook/enqueueJob, defineScheduledTrigger, defineJob/defineTask, defineStreamSchema/createServiceStreamProducer, createServiceClient with apiVersion, and Fresh definePage().withForm with RuntimeFormState.

Reserved saga signal/query methods must not be presented as executable features. Python processes inherit worker OS access; Deno permissions are not a general Python sandbox. Stream consumer retention failures need explicit recovery; do not promise automatic infinite replay. SDK context does not supply accessToken by default. UI submits validated input to an authenticated backend; UI never owns access enforcement.

Official alternative sources: Nest queues, workflows and observability MCP; Hono RPC; Encore typed services/PubSub/MCP; Next forms/auth/MCP; SvelteKit form actions. These stacks have real typed clients, workflows or MCP. Compare integration seams, never invent absence or numeric advantages.

Current source inspection found the producer-facing defineStreamSchema return type differs from the upstream shape accepted by Fresh StreamDB. The shared example uses upstream createStateSchema, which is supported by both sides and passes the consumer check. No framework API is cast or suppressed. Examples explicitly state store, interpreter, auth, mounting, transaction and lifecycle responsibilities.
