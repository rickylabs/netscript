// authored stories for "prompt-input"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var models = [
    { id: 'ops-copilot-l', label: 'Ops Copilot L', provider: 'NetScript' },
    { id: 'ops-copilot-s', label: 'Ops Copilot S', provider: 'NetScript' },
  ];
  window.__dsPreview = {
    Default: function () {
      return h(NS.PromptInput, {
        placeholder: 'Ask about a run, flow, or service…',
        models: models,
        model: 'ops-copilot-l',
        grounding: true,
        hint: 'Enter to send · Shift+Enter for newline',
      });
    },
    Compact: function () {
      return h(NS.PromptInput, {
        placeholder: 'Explain why triggers is backing up…',
        models: models,
        model: 'ops-copilot-s',
        research: true,
        compact: true,
      });
    },
  };
})();
