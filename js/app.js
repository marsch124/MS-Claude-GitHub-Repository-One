/*
 * Triathlon Glossary — app logic.
 *
 * No framework, no build step. The built-in list lives in js/terms.js.
 * Terms you add yourself are saved in this browser's localStorage under
 * STORAGE_KEY, so they persist on your phone and merge with the built-ins.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'triGlossary.customTerms.v1';
  var THEME_KEY = 'triGlossary.theme.v1';

  var hasWindow = typeof window !== 'undefined';
  var BUILTIN = (hasWindow && window.TRIATHLON_TERMS) || [];
  var CATEGORIES = (hasWindow && window.TRIATHLON_CATEGORIES) || [];

  // ---- Custom (user-added) term storage -------------------------------

  function loadCustom() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustom(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ---- Pure helpers (also unit-tested in tests/) ----------------------

  // Merge built-ins with custom terms; custom terms with the same term text
  // (case-insensitive) override the built-in, and are marked custom.
  function mergeTerms(builtin, custom) {
    var byKey = {};
    var order = [];
    function add(t, isCustom) {
      var key = String(t.term || '').trim().toLowerCase();
      if (!key) return;
      if (!(key in byKey)) order.push(key);
      byKey[key] = {
        term: t.term,
        full: t.full || '',
        def: t.def || '',
        category: t.category || 'General',
        custom: !!isCustom,
      };
    }
    builtin.forEach(function (t) { add(t, false); });
    custom.forEach(function (t) { add(t, true); });
    return order.map(function (k) { return byKey[k]; });
  }

  // Filter by a search string (matches term, expansion and definition) and
  // an optional category. Returns a new sorted array.
  function filterTerms(terms, query, category) {
    var q = String(query || '').trim().toLowerCase();
    return terms.filter(function (t) {
      if (category && category !== 'All' && t.category !== category) return false;
      if (!q) return true;
      var hay = (t.term + ' ' + t.full + ' ' + t.def).toLowerCase();
      return hay.indexOf(q) !== -1;
    }).sort(function (a, b) {
      return a.term.toLowerCase().localeCompare(b.term.toLowerCase());
    });
  }

  // Expose pure helpers for tests (Node) without touching the DOM there.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mergeTerms: mergeTerms, filterTerms: filterTerms };
  }
  if (hasWindow) {
    window.__triGlossary = { mergeTerms: mergeTerms, filterTerms: filterTerms };
  }

  // ---- The rest only runs in the browser ------------------------------
  if (typeof document === 'undefined') return;

  // ---- DOM references -------------------------------------------------

  var $ = function (sel) { return document.querySelector(sel); };

  var els = {};

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ---- Rendering ------------------------------------------------------

  var state = {
    query: '',
    category: 'All',
    custom: loadCustom(),
  };

  function allTerms() {
    return mergeTerms(BUILTIN, state.custom);
  }

  function render() {
    var terms = filterTerms(allTerms(), state.query, state.category);
    var list = els.list;
    list.innerHTML = '';

    els.count.textContent =
      terms.length + (terms.length === 1 ? ' term' : ' terms') +
      (state.query || state.category !== 'All' ? ' found' : '');

    if (terms.length === 0) {
      list.appendChild(el('p', { class: 'empty', text: 'No terms match. Try a different search — or add it yourself with the + button.' }));
      return;
    }

    terms.forEach(function (t) {
      var head = [el('span', { class: 'term-name', text: t.term })];
      if (t.full) head.push(el('span', { class: 'term-full', text: t.full }));
      if (t.custom) head.push(el('span', { class: 'badge', text: 'yours' }));

      var card = el('article', { class: 'card' }, [
        el('div', { class: 'card-head' }, head),
        el('span', { class: 'chip', text: t.category }),
        el('p', { class: 'def', text: t.def }),
      ]);

      if (t.custom) {
        var del = el('button', { class: 'delete', title: 'Delete this term', 'aria-label': 'Delete ' + t.term }, ['×']);
        del.addEventListener('click', function () { deleteCustom(t.term); });
        card.appendChild(del);
      }
      list.appendChild(card);
    });
  }

  function deleteCustom(termName) {
    if (!window.confirm('Delete "' + termName + '"? This only removes your own entry.')) return;
    var key = termName.trim().toLowerCase();
    state.custom = state.custom.filter(function (t) {
      return String(t.term || '').trim().toLowerCase() !== key;
    });
    saveCustom(state.custom);
    render();
  }

  // ---- Add-term dialog ------------------------------------------------

  function openDialog() {
    els.form.reset();
    els.formError.textContent = '';
    els.dialog.showModal();
    els.fTerm.focus();
  }

  function closeDialog() {
    els.dialog.close();
  }

  function submitForm(ev) {
    ev.preventDefault();
    var term = els.fTerm.value.trim();
    var def = els.fDef.value.trim();
    if (!term || !def) {
      els.formError.textContent = 'Please fill in at least the term and its explanation.';
      return;
    }
    var key = term.toLowerCase();
    // Replace an existing custom entry with the same name, if any.
    state.custom = state.custom.filter(function (t) {
      return String(t.term || '').trim().toLowerCase() !== key;
    });
    state.custom.push({
      term: term,
      full: els.fFull.value.trim(),
      def: def,
      category: els.fCat.value || 'General',
    });
    saveCustom(state.custom);
    closeDialog();
    // Surface the new term: clear filters so the user sees it landed.
    state.query = '';
    els.search.value = '';
    render();
  }

  // ---- Theme ----------------------------------------------------------

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    if (!current) {
      // Fall back to what the system currently shows.
      current = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ---- Wiring ---------------------------------------------------------

  function buildCategoryControls() {
    // Filter buttons
    var opts = ['All'].concat(CATEGORIES);
    opts.forEach(function (c) {
      var btn = el('button', { class: 'filter' + (c === 'All' ? ' active' : ''), 'data-cat': c, text: c });
      btn.addEventListener('click', function () {
        state.category = c;
        Array.prototype.forEach.call(els.filters.children, function (b) {
          b.classList.toggle('active', b.getAttribute('data-cat') === c);
        });
        render();
      });
      els.filters.appendChild(btn);
    });

    // Dropdown in the add form
    CATEGORIES.forEach(function (c) {
      els.fCat.appendChild(el('option', { value: c, text: c }));
    });
  }

  function init() {
    els.list = $('#list');
    els.count = $('#count');
    els.search = $('#search');
    els.filters = $('#filters');
    els.dialog = $('#addDialog');
    els.form = $('#addForm');
    els.formError = $('#formError');
    els.fTerm = $('#f-term');
    els.fFull = $('#f-full');
    els.fDef = $('#f-def');
    els.fCat = $('#f-cat');

    buildCategoryControls();

    els.search.addEventListener('input', function () {
      state.query = els.search.value;
      render();
    });

    $('#addBtn').addEventListener('click', openDialog);
    $('#cancelBtn').addEventListener('click', function (e) { e.preventDefault(); closeDialog(); });
    els.form.addEventListener('submit', submitForm);
    els.dialog.addEventListener('click', function (e) {
      // Click on the backdrop (outside the form) closes the dialog.
      if (e.target === els.dialog) closeDialog();
    });

    $('#themeBtn').addEventListener('click', toggleTheme);

    render();
  }

  initTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Offline: register the service worker ---------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () { /* offline is a nice-to-have */ });
    });
  }
})();
