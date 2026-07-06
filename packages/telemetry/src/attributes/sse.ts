/**
 * Semantic Server-Sent Events attribute names.
 */
export const SSEAttributes = {
  SSE_CLIENT_ID: 'netscript.sse.client_id',
  SSE_EVENT_TYPE: 'netscript.sse.event_type',
  SSE_EVENTS_SENT: 'netscript.sse.events_sent',
  SSE_DURATION_MS: 'netscript.sse.duration_ms',
  SSE_WATCH_KEYS: 'netscript.sse.watch_keys',
  SSE_EVENT_DATA_SIZE: 'netscript.sse.event.data_size',
  SSE_EVENT_RELATED_TRACE: 'netscript.sse.event.related_trace',
  SSE_SUBSCRIPTION_CHANNEL: 'netscript.sse.subscription.channel',
  SSE_METRICS_ACTIVE_CONNECTIONS: 'netscript.sse.metrics.active_connections',
  SSE_METRICS_TOTAL_EVENTS_SENT: 'netscript.sse.metrics.total_events_sent',
  SSE_METRICS_AVG_EVENTS_PER_CONNECTION: 'netscript.sse.metrics.avg_events_per_connection',
} as const;
