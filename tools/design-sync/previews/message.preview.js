// authored stories for "message"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    User: function () {
      return h(NS.Message, {
        message: {
          role: 'user',
          author: { name: 'Ada Reeves', initials: 'AR' },
          time: '14:02',
          body: 'Why is **triggers** backing up this afternoon?',
        },
      });
    },
    Assistant: function () {
      return h(NS.Message, {
        message: {
          role: 'assistant',
          author: { name: 'Ops Copilot', initials: 'AI', agent: true },
          time: '14:02',
          model: 'ops-copilot-l',
          body:
            'Dispatch latency for `triggers` climbed after 12:00 — the `nightly.reindex` trigger is retrying [1]. Queue depth is up 3x [2].',
          blocks: [
            {
              type: 'chart',
              title: 'triggers queue depth',
              unit: 'jobs',
              variant: 'column',
              data: [
                { label: '11', value: 120 },
                { label: '12', value: 380, tone: 'warning' },
                { label: '13', value: 640, tone: 'destructive' },
              ],
            },
          ],
          tools: [
            {
              name: 'netscript.triggers.dispatch',
              status: 'error',
              args: '{ "trigger": "nightly.reindex" }',
              result: 'Error: index lock held by streams',
            },
          ],
          followups: ['Show the failing trace', 'Pause nightly.reindex'],
        },
      });
    },
    Typing: function () {
      return h(NS.Message, {
        message: {
          role: 'assistant',
          author: { name: 'Ops Copilot', initials: 'AI', agent: true },
          pending: true,
        },
      });
    },
  };
})();
