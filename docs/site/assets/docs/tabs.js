// Progressive code tabs, runtime persistence, comparison and clipboard actions.

(function () {
  function setup(root) {
    const tabs = Array.prototype.slice.call(root.querySelectorAll('.ns-tabbed__tab'));
    const panels = Array.prototype.slice.call(root.querySelectorAll('.ns-tabbed__panel'));
    if (!tabs.length || !panels.length) return;

    function activate(index) {
      tabs.forEach(function (tab, i) {
        const on = i === index;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach(function (panel, i) {
        if (i === index) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        activate(i);
        if (root.hasAttribute('data-ns-runtime-group')) {
          const label = tab.getAttribute('data-ns-runtime');
          if (label) {
            try {
              localStorage.setItem('ns-runtime', label);
            } catch { /* storage unavailable: selection just won't persist */ }
            syncRuntimeGroups(label, root);
          }
        }
      });
      tab.addEventListener('keydown', function (e) {
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = (i - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        activate(next);
        tabs[next].focus();
      });
    });

    root.classList.add('is-enhanced');
    root._nsActivate = activate;
    activate(0);
  }

  function syncRuntimeGroups(label, except) {
    const groups = Array.prototype.slice.call(
      document.querySelectorAll('.ns-tabbed[data-ns-runtime-group]'),
    );
    groups.forEach(function (group) {
      if (group === except || typeof group._nsActivate !== 'function') return;
      const tabs = Array.prototype.slice.call(group.querySelectorAll('.ns-tabbed__tab'));
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute('data-ns-runtime') === label) {
          group._nsActivate(i);
          break;
        }
      }
    });
  }

  function restoreRuntime() {
    let label = null;
    try {
      label = localStorage.getItem('ns-runtime');
    } catch {
      return;
    }
    if (!label) return;
    syncRuntimeGroups(label, null);
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll('.ns-tabbed')).forEach(setup);
    restoreRuntime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
  function setup(root) {
    const select = root.querySelector('[data-ns-comparison-select]');
    if (!select) return;

    function activate(key) {
      Array.prototype.slice.call(root.querySelectorAll('[data-ns-competitor]')).forEach(
        function (node) {
          if (node.getAttribute('data-ns-competitor') === key) {
            node.removeAttribute('hidden');
          } else {
            node.setAttribute('hidden', '');
          }
        },
      );
      const option = select.options[select.selectedIndex];
      const label = option ? option.textContent : 'Competitor';
      Array.prototype.slice.call(root.querySelectorAll('[data-ns-competitor-label]')).forEach(
        function (node) {
          node.textContent = label;
        },
      );
    }

    select.addEventListener('change', function () {
      activate(select.value);
    });
    root.classList.add('is-enhanced');
    activate(select.value);
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll('[data-ns-comparison]')).forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
  function copyText(text, btn) {
    const done = function () {
      const prev = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('is-copied');
      setTimeout(function () {
        btn.textContent = prev;
        btn.classList.remove('is-copied');
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  }
  function init() {
    const pres = Array.prototype.slice.call(
      document.querySelectorAll('.ns-prose pre, .ns-tabbed__panel pre'),
    );
    pres.forEach(function (pre) {
      if (pre.querySelector('.ns-copy-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ns-copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      pre.classList.add('ns-pre--copyable');
      pre.appendChild(btn);
      btn.addEventListener('click', function () {
        const code = pre.querySelector('code');
        copyText((code || pre).innerText, btn);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Keyboard users can enter code/table scrolling regions even when they contain no controls.
for (const region of document.querySelectorAll('.ns-prose pre, .ns-prose table')) {
  region.tabIndex = 0;
}
