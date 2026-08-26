/* Note Lab — Kindle-style reader */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var content = $('#readerContent');
  var page = $('#page');

  // ---- Resolve module + unit ----
  function qs(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  var modId = qs('m') || localStorage.getItem('nl:lastModule') || 'ai';
  var mod = window.NOTES_DATA[modId] || window.NOTES_DATA['ai'];
  var modMeta = null;
  window.MODULES.forEach(function (m) { if (m.id === mod.id) modMeta = m; });
  if (!modMeta) modMeta = { accent: '#e8590c', short: 'Notes' };

  var units = mod.units;
  var unitId = qs('u');
  var idx = units.findIndex(function (u) { return u.id === unitId; });
  if (idx < 0) {
    var last = null;
    try { last = JSON.parse(localStorage.getItem('nl:last:' + mod.id) || 'null'); } catch (e) {}
    idx = last ? Math.max(0, units.findIndex(function (u) { return u.id === last.unit; })) : 0;
  }
  var unit = units[idx];

  document.documentElement.style.setProperty('--accent', modMeta.accent);

  // ---- Settings (persisted) ----
  var settings = {
    theme: localStorage.getItem('nl:theme') || 'light',
    fs: parseInt(localStorage.getItem('nl:fs') || '19', 10),
    font: localStorage.getItem('nl:font') || 'serif'
  };

  function applySettings() {
    document.body.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--fs', settings.fs + 'px');
    page.style.fontFamily = settings.font === 'sans' ? 'var(--sans)' : 'var(--serif)';
    $('#fontPreview').style.fontSize = Math.min(settings.fs, 26) + 'px';
    document.querySelectorAll('.theme-dot').forEach(function (d) {
      d.classList.toggle('on', d.getAttribute('data-theme-val') === settings.theme);
    });
    document.querySelectorAll('#fontFamilyGroup .seg-btn').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-fontval') === settings.font);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = getComputedStyle(document.body).backgroundColor;

    localStorage.setItem('nl:theme', settings.theme);
    localStorage.setItem('nl:fs', settings.fs);
    localStorage.setItem('nl:font', settings.font);
  }
  applySettings();

  // ---- Keyword highlighting (?q= from search) ----
  function highlightTerm(raw) {
    var words = String(raw).toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    var walker = document.createTreeWalker(page, window.NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return window.NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|MARK)$/.test(p.tagName)) return window.NodeFilter.FILTER_REJECT;
        return window.NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    var count = 0;
    nodes.forEach(function (n) {
      if (count >= 60) return;
      var txt = n.nodeValue;
      var low = txt.toLowerCase();
      var pos = -1, len = 0;
      for (var i = 0; i < words.length; i++) {
        var p = low.indexOf(words[i]);
        if (p > -1 && (pos === -1 || p < pos)) { pos = p; len = words[i].length; }
      }
      if (pos === -1) return;

      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(txt.slice(0, pos)));
      var m = document.createElement('mark');
      m.className = 'kw-hit';
      m.textContent = txt.substr(pos, len);
      frag.appendChild(m);
      frag.appendChild(document.createTextNode(txt.slice(pos + len)));
      n.parentNode.replaceChild(frag, n);
      count++;
    });
    return count;
  }

  // ---- Render unit ----
  function renderUnit(i, scrollY) {
    i = Math.max(0, Math.min(units.length - 1, i));
    idx = i;
    unit = units[i];

    page.innerHTML =
      '<header class="chapter-head">' +
        '<p class="chapter-kicker">' + mod.short + '</p>' +
        '<h1 class="chapter-title" style="font-size:1em;margin:0">' + unit.title + '</h1>' +
        '<div class="chapter-rule"></div>' +
      '</header>' +
      window.NoteMD.render(unit.md) +
      '<div class="end-mark">&#10087; End of Unit ' + unit.num + '</div>' +
      (idx < units.length - 1
        ? '<div class="next-hint"><a class="next-link" id="nextLink">Next: ' + units[i + 1].title.replace(/^Unit\s*\d+\s*[-–—]?\s*/i, '') + ' &#8594;</a></div>'
        : '<div class="next-hint"><a class="next-link" href="index.html#m=' + mod.id + '">&#8592; Back to units</a></div>') +
      '<p class="page-credit">Built by <a href="https://github.com/kaungkhantko26" target="_blank" rel="noopener">Kaung Khant Ko</a></p>';

    var nl = $('#nextLink');
    if (nl) nl.addEventListener('click', function () { go(idx + 1); });

    // Keyword highlight from search (?q=)
    var kw = qs('q');
    var hitCount = 0;
    if (kw) hitCount = highlightTerm(kw);

    $('#readerTitle').textContent = unit.title + (hitCount ? ' \u00B7 ' + hitCount + ' matches' : '');
    $('#posLabel').textContent = (i + 1) + ' / ' + units.length;
    document.title = unit.title + ' — Note Lab';

    requestAnimationFrame(function () {
      if (hitCount) {
        var firstMark = page.querySelector('mark.kw-hit');
        if (firstMark) {
          firstMark.classList.add('flash');
          content.scrollTop = firstMark.offsetTop - content.clientHeight * 0.3;
          setTimeout(function () { firstMark.classList.remove('flash'); }, 1300);
        } else content.scrollTop = 0;
      } else if (scrollY != null) content.scrollTop = scrollY;
      else content.scrollTop = 0;
      updateProgress();
    });

    saveLast();
    renderDrawer();
  }

  function saveLast() {
    try {
      var ratio = Math.round((content.scrollTop / Math.max(1, content.scrollHeight - content.clientHeight)) * 100);
      ratio = Math.min(100, Math.max(0, ratio));
      localStorage.setItem('nl:last:' + mod.id, JSON.stringify({ unit: unit.id, pct: ratio }));
      localStorage.setItem('nl:lastModule', mod.id);
    } catch (e) {}
  }

  function go(i) {
    history.replaceState(null, '', 'reader.html?m=' + mod.id + '&u=' + units[Math.max(0, Math.min(units.length - 1, i))].id);
    renderUnit(i);
  }

  // ---- Progress ----
  function updateProgress() {
    var max = content.scrollHeight - content.clientHeight;
    var pct = max > 0 ? (content.scrollTop / max) * 100 : 100;
    $('#progressFill').style.width = pct + '%';
    saveLast();
  }

  var progressTick = false;
  content.addEventListener('scroll', function () {
    if (!progressTick) {
      progressTick = true;
      requestAnimationFrame(function () { updateProgress(); progressTick = false; });
    }
  }, { passive: true });

  // ---- Navigation ----
  $('#prevBtn').addEventListener('click', function () { go(idx - 1); });
  $('#nextBtn').addEventListener('click', function () { go(idx + 1); });

  // Swipe gestures
  var touchX = null, touchY = null;
  content.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  content.addEventListener('touchend', function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') go(idx + 1);
    if (e.key === 'ArrowLeft') go(idx - 1);
    if (e.key === 'Escape') closeAll();
  });

  // ---- TOC drawer ----
  function renderDrawer(filter) {
    var wrap = $('#drawerUnits');
    wrap.innerHTML = '';
    var f = (filter || '').toLowerCase();
    units.forEach(function (u, i) {
      if (f && u.title.toLowerCase().indexOf(f) === -1 && u.md.toLowerCase().indexOf(f) === -1) return;
      var b = document.createElement('button');
      b.className = 'drawer-unit' + (i === idx ? ' active' : '');
      b.innerHTML = '<span class="du-num">' + String(u.num).padStart(2, '0') + '</span><span>' + u.title + '</span>';
      b.addEventListener('click', function () { closeAll(); go(i); });
      wrap.appendChild(b);
    });
    if (!wrap.children.length) wrap.innerHTML = '<p style="padding:1rem;color:var(--muted);font-size:.9rem">No matches.</p>';
  }

  function openDrawer() {
    $('#drawer').classList.add('open');
    $('#drawerBackdrop').classList.add('open');
    renderDrawer();
    setTimeout(function () { $('#tocSearch').focus(); }, 260);
  }
  function openSheet() {
    $('#typoSheet').classList.add('open');
    $('#sheetBackdrop').classList.add('open');
  }
  function closeAll() {
    $('#drawer').classList.remove('open');
    $('#drawerBackdrop').classList.remove('open');
    $('#typoSheet').classList.remove('open');
    $('#sheetBackdrop').classList.remove('open');
  }

  $('#tocBtn').addEventListener('click', openDrawer);
  $('#typoBtn').addEventListener('click', openSheet);
  $('#drawerClose').addEventListener('click', closeAll);
  $('#drawerBackdrop').addEventListener('click', closeAll);
  $('#sheetBackdrop').addEventListener('click', closeAll);
  $('#tocSearch').addEventListener('input', function (e) { renderDrawer(e.target.value); });

  // ---- Typography controls ----
  $('#fontPlus').addEventListener('click', function () { settings.fs = Math.min(26, settings.fs + 1); applySettings(); });
  $('#fontMinus').addEventListener('click', function () { settings.fs = Math.max(15, settings.fs - 1); applySettings(); });
  document.querySelectorAll('.theme-dot').forEach(function (d) {
    d.addEventListener('click', function () { settings.theme = d.getAttribute('data-theme-val'); applySettings(); });
  });
  document.querySelectorAll('#fontFamilyGroup .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { settings.font = b.getAttribute('data-fontval'); applySettings(); });
  });

  // ---- Boot ----
  var resumeScroll = null;
  try {
    var pos = JSON.parse(localStorage.getItem('nl:pos:' + mod.id + ':' + unit.id) || 'null');
    resumeScroll = pos;
  } catch (e) {}

  // Save/restore exact scroll per unit
  var pendingSave = null;
  content.addEventListener('scroll', function () {
    if (pendingSave) clearTimeout(pendingSave);
    pendingSave = setTimeout(function () {
      try { localStorage.setItem('nl:pos:' + mod.id + ':' + unit.id, String(content.scrollTop)); } catch (e) {}
    }, 300);
  }, { passive: true });

  renderUnit(idx, resumeScroll);
})();
