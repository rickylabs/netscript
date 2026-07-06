// authored stories for "model-selector"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var models = [
    {
      id: 'ops-copilot-l',
      label: 'Ops Copilot L',
      provider: 'NetScript',
      desc: 'Deep incident reasoning',
    },
    {
      id: 'ops-copilot-s',
      label: 'Ops Copilot S',
      provider: 'NetScript',
      desc: 'Fast triage + summaries',
    },
    {
      id: 'trace-analyst',
      label: 'Trace Analyst',
      provider: 'NetScript',
      desc: 'Distributed-trace expert',
    },
  ];
  window.__dsPreview = {
    Default: function () {
      return h(NS.ModelSelector, { value: 'ops-copilot-l', models: models });
    },
    Open: function () {
      return h(NS.ModelSelector, { value: 'ops-copilot-s', models: models, open: true });
    },
  };
})();
