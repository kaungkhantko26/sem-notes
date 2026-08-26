/* Minimal safe Markdown renderer for Note Lab */
(function () {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
    return s;
  }

  function render(md) {
    var lines = md.split('\n');
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      // Horizontal rule
      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      // Heading
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var lvl = Math.min(h[1].length + 1, 5); // h1 is page title, shift down
        out.push('<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>');
        i++;
        continue;
      }

      // Table
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]*-[-\s|:]*$/.test(lines[i + 1]) && lines[i + 1].indexOf('-') !== -1 && line.indexOf('|') !== -1) {
        var splitRow = function (r) {
          r = r.trim().replace(/^\|/, '').replace(/\|$/, '');
          return r.split('|').map(function (c) { return c.trim(); });
        };
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim()) {
          rows.push(splitRow(lines[i])); i++;
        }
        var t = '<div class="table-wrap"><table><thead><tr>';
        head.forEach(function (c) { t += '<th>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>';
          head.forEach(function (_, ci) { t += '<td>' + inline(r[ci] || '') + '</td>'; });
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t);
        continue;
      }

      // Blockquote
      if (/^>\s?/.test(line)) {
        var buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, '')); i++;
        }
        out.push('<blockquote>' + render(buf.join('\n')) + '</blockquote>');
        continue;
      }

      // Unordered list
      if (/^\s*[-*+]\s+/.test(line)) {
        var ul = '<ul>';
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          ul += '<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>'; i++;
        }
        out.push(ul + '</ul>');
        continue;
      }

      // Ordered list
      if (/^\s*\d+[.)]\s+/.test(line)) {
        var ol = '<ol>';
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          ol += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; i++;
        }
        out.push(ol + '</ol>');
        continue;
      }

      // Paragraph (merge consecutive non-empty lines)
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|>\s?|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      out.push('<p>' + inline(para.join(' ')) + '</p>');
    }

    return out.join('\n');
  }

  window.NoteMD = { render: render };
})();
