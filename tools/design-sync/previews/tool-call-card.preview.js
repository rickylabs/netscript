// authored stories for "tool-call-card"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Running: function () {
      return h(NS.ToolCallCard, {
        name: 'netscript.runs.query',
        status: 'running',
        args: '{ "flow": "order.fulfillment", "state": "running" }',
      });
    },
    Done: function () {
      return h(NS.ToolCallCard, {
        name: 'netscript.workers.queueDepth',
        status: 'done',
        defaultOpen: true,
        args: '{ "service": "workers" }',
        result: '{ "depth": 812, "inflight": 24, "oldestAgeMs": 4100 }',
      });
    },
    Error: function () {
      return h(NS.ToolCallCard, {
        name: 'netscript.triggers.dispatch',
        status: 'error',
        defaultOpen: true,
        args: '{ "trigger": "nightly.reindex" }',
        result: 'Error: trigger "nightly.reindex" not registered',
      });
    },
  };
})();
