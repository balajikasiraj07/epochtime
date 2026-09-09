/*!
 * EpochTime.live embeddable widget
 * Usage:
 *   <div class="epochtime-widget" data-theme="light"></div>
 *   <script src="https://epochtime.live/widget.js" async></script>
 * Options (data-* attributes): data-theme="light|dark", data-format="seconds|millis"
 * Free to embed. Please keep the attribution link.
 */
(function () {
  'use strict';
  var ORIGIN = 'https://epochtime.live';
  if (window.EpochTimeWidget) return;

  function build(el) {
    if (el.getAttribute('data-et-ready')) return;
    el.setAttribute('data-et-ready', '1');

    var dark = (el.getAttribute('data-theme') || 'light').toLowerCase() === 'dark';
    var fmt = (el.getAttribute('data-format') || 'seconds').toLowerCase();
    var bg = dark ? '#12141a' : '#ffffff';
    var fg = dark ? '#e8edf4' : '#1a1a1a';
    var muted = dark ? '#9aa4b2' : '#555555';
    var accent = dark ? '#4d9de0' : '#1a6fc4';
    var border = dark ? '#2a2f3a' : '#e2e2e2';
    var green = dark ? '#3ecf6b' : '#267326';

    el.innerHTML = '';
    el.style.cssText = 'display:inline-block;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:' + bg + ';color:' + fg + ';border:1px solid ' + border + ';border-radius:12px;padding:16px 20px;min-width:230px;box-sizing:border-box;line-height:1.3;box-shadow:0 1px 3px rgba(0,0,0,.08);text-align:left';

    var label = document.createElement('div');
    label.textContent = 'Current Unix Timestamp';
    label.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:1px;color:' + muted + ';margin:0 0 6px';

    var value = document.createElement('div');
    value.style.cssText = 'font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:30px;font-weight:700;color:' + green + ';letter-spacing:.5px';

    var human = document.createElement('div');
    human.style.cssText = 'font-size:12px;color:' + muted + ';margin-top:6px';

    var foot = document.createElement('div');
    foot.style.cssText = 'font-size:11px;margin-top:10px;color:' + muted;
    var link = document.createElement('a');
    link.href = ORIGIN + '/?utm_source=widget&utm_medium=embed';
    link.textContent = 'EpochTime.live';
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.cssText = 'color:' + accent + ';text-decoration:none;font-weight:600';
    foot.appendChild(document.createTextNode('Live via '));
    foot.appendChild(link);

    el.appendChild(label);
    el.appendChild(value);
    el.appendChild(human);
    el.appendChild(foot);

    function tick() {
      var ms = Date.now();
      value.textContent = fmt === 'millis' ? ms : Math.floor(ms / 1000);
      human.textContent = new Date(ms).toUTCString();
    }
    tick();
    setInterval(tick, fmt === 'millis' ? 100 : 1000);
  }

  function init() {
    var els = document.querySelectorAll('.epochtime-widget');
    for (var i = 0; i < els.length; i++) build(els[i]);
  }

  window.EpochTimeWidget = { init: init, build: build };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
