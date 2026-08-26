/* Note Lab — home page */
(function () {
  var $ = function (s) { return document.querySelector(s); };

  // Theme
  var theme = localStorage.getItem('nl:theme') || 'light';
  document.body.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.body).backgroundColor;

  function store() {
    try { return JSON.parse(localStorage.getItem('nl:last:' + this.id) || 'null'); }
    catch (e) { return null; }
  }

  var ICONS = {
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.4"/><path d="M12 3v6.6M12 14.4V21M3 12h6.6M14.4 12H21M5.6 5.6l3.8 3.8m5.2 5.2 3.8 3.8m0-12.8-3.8 3.8m-5.2 5.2-3.8 3.8"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7L4 12l5 5M15 7l5 5-5 5"/></svg>',
    db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v13c0 1.55 3.1 2.8 7 2.8s7-1.25 7-2.8v-13"/><path d="M5 12c0 1.55 3.1 2.8 7 2.8s7-1.25 7-2.8"/></svg>',
    net: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3.2 3.6 3.2 13.4 0 17M12 3.5c-3.2 3.6-3.2 13.4 0 17"/></svg>'
  };

  function showView(name) {
    $('#viewHome').hidden = name !== 'home';
    $('#viewDetail').hidden = name !== 'detail';
  }

  function renderHome() {
    showView('home');
    document.title = 'Note Lab — 2nd Sem Notes';

    var grid = $('#moduleGrid');
    grid.innerHTML = '';
    window.MODULES.forEach(function (mod) {
      var data = window.NOTES_DATA[mod.id];
      var units = data ? data.units : [];
      var last = store.call(mod);
      var lastUnit = last && units.find ? units.find(function (u) { return u.id === last.unit; }) : null;

      var card = document.createElement('button');
      card.className = 'module-card';
      card.style.setProperty('--accent', mod.accent);
      card.innerHTML =
        '<div class="mc-top">' +
          '<span class="mc-icon">' + (ICONS[mod.icon] || '') + '</span>' +
          '<span class="mc-chip"><i class="dot"></i>' + mod.code + '</span>' +
        '</div>' +
        '<div class="mc-title">' + mod.short + '</div>' +
        (units.length && !(units.length === 1 && units[0].md.indexOf('coming soon') !== -1)
          ? '<div class="mc-meta">' + units.length + ' unit' + (units.length > 1 ? 's' : '') + '</div>' +
            (lastUnit ? '<span class="mc-continue">&#9654; Continue: Unit ' + lastUnit.num + '</span>'
                       : '<span class="mc-continue">Start reading &#8594;</span>')
          : '<span class="badge-soon">Coming soon</span>');

      card.addEventListener('click', function () { location.hash = '#m=' + mod.id; });
      grid.appendChild(card);
    });
  }

  function renderDetail(modId) {
    var mod = null;
    window.MODULES.forEach(function (m) { if (m.id === modId) mod = m; });
    if (!mod) { location.hash = ''; return; }

    var data = window.NOTES_DATA[mod.id] || { units: [] };
    var last = store.call(mod);

    showView('detail');
    $('#detailTitle').textContent = mod.title;
    $('#unitsLabel').textContent = data.units.length + ' Unit' + (data.units.length === 1 ? '' : 's');

    var list = $('#unitList');
    list.innerHTML = '';
    data.units.forEach(function (u) {
      var item = document.createElement('button');
      item.className = 'unit-item' + (last && last.unit === u.id ? ' reading-now' : '');
      item.style.setProperty('--accent', mod.accent);
      item.innerHTML =
        '<span class="unit-num">' + String(u.num).padStart(2, '0') + '</span>' +
        '<span class="unit-name">' + u.title.replace(/^Unit\s*\d+\s*[-–—]?\s*/i, '') +
          (last && last.unit === u.id ? '<span class="unit-sub">Last read' + (last.pct ? ' — ' + last.pct + '%' : '') + '</span>' : '') +
        '</span>' +
        '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      item.addEventListener('click', function () {
        location.href = 'reader.html?m=' + mod.id + '&u=' + u.id;
      });
      list.appendChild(item);
    });

    document.title = mod.short + ' — Note Lab';
    window.scrollTo(0, 0);
  }

  function route() {
    var h = location.hash.match(/#m=([a-z]+)/);
    if (h) renderDetail(h[1]); else renderHome();
  }

  $('#backBtn').addEventListener('click', function () { location.hash = ''; });
  window.addEventListener('hashchange', route);
  route();

  // Subtle 3D tilt on module cards (desktop pointers only)
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var grid = $('#moduleGrid');

  function resetTilt() {
    grid.querySelectorAll('.module-card').forEach(function (c) {
      c.classList.remove('tilting');
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    });
  }

  if (finePointer && !reducedMotion) {
    grid.addEventListener('pointermove', function (e) {
      var card = e.target.closest('.module-card');
      resetTilt();
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5;
      var py = (e.clientY - r.top) / r.height - .5;
      card.classList.add('tilting');
      card.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
    });
    grid.addEventListener('pointerleave', resetTilt);
  }
})();
