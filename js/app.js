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

  function renderHome() {
    $('#homeHeader').hidden = false;
    $('#homeMain').style.display = '';
    $('#detailTopbar').hidden = true;
    $('#unitsLabel').hidden = true;
    $('#unitList').hidden = true;
    $('#moduleGrid').style.display = '';

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
          '<span class="mc-icon" style="background:' + mod.accent + '">' +
            (mod.id === 'ai' ? '&#129504;' : mod.id === 'programming' ? '&#60;&#47;&#62;' : mod.id === 'database' ? '&#128451;' : '&#127760;') +
          '</span>' +
          '<span class="mc-code">' + mod.code + '</span>' +
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

    $('#homeHeader').hidden = true;
    $('#moduleGrid').style.display = 'none';
    $('#detailTopbar').hidden = false;
    $('#detailTitle').textContent = mod.title;
    $('#unitsLabel').hidden = false;
    $('#unitsLabel').textContent = data.units.length + ' Units';
    $('#unitList').hidden = false;

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
})();
