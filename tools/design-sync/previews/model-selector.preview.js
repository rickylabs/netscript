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
  // The open dropdown floats below the trigger; the card cell clips it. A
  // sized stage gives the popover room to render in-card (object style —
  // React rejects string style props).
  function stage(node) {
    return h(
      'div',
      {
        style: {
          position: 'relative',
          transform: 'translateZ(0)',
          height: '280px',
          overflow: 'hidden',
        },
      },
      node,
    );
  }
  window.__dsPreview = {
    Default: function () {
      return h(NS.ModelSelector, { value: 'ops-copilot-l', models: models });
    },
    Open: function () {
      return stage(h(NS.ModelSelector, { value: 'ops-copilot-s', models: models, open: true }));
    },
  };
})();
