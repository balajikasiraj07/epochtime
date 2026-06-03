// ── Color Conversion Engine ──────────────────────────────────────────────

// ── HEX ↔ RGB ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 4) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0,2), 16),
      g: parseInt(hex.slice(2,4), 16),
      b: parseInt(hex.slice(4,6), 16),
      a: 1
    };
  }
  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0,2), 16),
      g: parseInt(hex.slice(2,4), 16),
      b: parseInt(hex.slice(4,6), 16),
      a: +(parseInt(hex.slice(6,8), 16) / 255).toFixed(2)
    };
  }
  return null;
}

function rgbToHex({ r, g, b, a = 1 }) {
  const toH = n => Math.round(n).toString(16).padStart(2, '0');
  const hex = `#${toH(r)}${toH(g)}${toH(b)}`;
  return a < 1 ? hex + toH(Math.round(a * 255)) : hex;
}

// ── RGB ↔ HSL ─────────────────────────────────────────────────────────────

function rgbToHsl({ r, g, b, a = 1 }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslToRgb({ h, s, l, a = 1 }) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const f = n => l - Math.min(l, 1 - l) * s * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
    a
  };
}

// ── RGB ↔ HSV ─────────────────────────────────────────────────────────────

function rgbToHsv({ r, g, b, a = 1 }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, v = max;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100), a };
}

function hsvToRgb({ h, s, v, a = 1 }) {
  s /= 100; v /= 100;
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i) {
    case 0: [r,g,b] = [v,t,p]; break; case 1: [r,g,b] = [q,v,p]; break;
    case 2: [r,g,b] = [p,v,t]; break; case 3: [r,g,b] = [p,q,v]; break;
    case 4: [r,g,b] = [t,p,v]; break; case 5: [r,g,b] = [v,p,q]; break;
  }
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255), a };
}

// ── RGB ↔ CMYK ────────────────────────────────────────────────────────────

function rgbToCmyk({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - r - k) / (1 - k) * 100),
    m: Math.round((1 - g - k) / (1 - k) * 100),
    y: Math.round((1 - b - k) / (1 - k) * 100),
    k: Math.round(k * 100)
  };
}

function cmykToRgb({ c, m, y, k }) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
    a: 1
  };
}

// ── Parse input ───────────────────────────────────────────────────────────

function parseColor(input) {
  input = input.trim();

  // HEX
  if (/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input)) {
    return hexToRgb(input.startsWith('#') ? input : '#' + input);
  }

  // rgb() / rgba()
  const rgbM = input.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbM) return { r: +rgbM[1], g: +rgbM[2], b: +rgbM[3], a: rgbM[4] !== undefined ? +rgbM[4] : 1 };

  // hsl() / hsla()
  const hslM = input.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (hslM) return hslToRgb({ h: +hslM[1], s: +hslM[2], l: +hslM[3], a: hslM[4] !== undefined ? +hslM[4] : 1 });

  // hsv()
  const hsvM = input.match(/hsv\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  if (hsvM) return hsvToRgb({ h: +hsvM[1], s: +hsvM[2], v: +hsvM[3] });

  // cmyk()
  const cmykM = input.match(/cmyk\s*\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  if (cmykM) return cmykToRgb({ c: +cmykM[1], m: +cmykM[2], y: +cmykM[3], k: +cmykM[4] });

  // CSS named color — render to canvas
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = input;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (r === 0 && g === 0 && b === 0 && a === 0 && input.toLowerCase() !== 'transparent') return null;
    return { r, g, b, a: +(a / 255).toFixed(2) };
  } catch { return null; }
}

// ── Contrast ratio (WCAG) ─────────────────────────────────────────────────

function luminance({ r, g, b }) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1), l2 = luminance(rgb2);
  return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
}

// ── Tints & Shades ────────────────────────────────────────────────────────

function getTints(rgb, count = 6) {
  const hsl = rgbToHsl(rgb);
  return Array.from({ length: count }, (_, i) => {
    const l = Math.round(hsl.l + (100 - hsl.l) * (i + 1) / (count + 1));
    return hslToRgb({ ...hsl, l });
  });
}

function getShades(rgb, count = 6) {
  const hsl = rgbToHsl(rgb);
  return Array.from({ length: count }, (_, i) => {
    const l = Math.round(hsl.l * (count - i - 1) / (count));
    return hslToRgb({ ...hsl, l });
  });
}

// ── UI ────────────────────────────────────────────────────────────────────

let currentRgb = { r: 79, g: 142, b: 247, a: 1 }; // default blue

function setColor(rgb) {
  if (!rgb) return;
  currentRgb = rgb;
  render(rgb);
}

function render(rgb) {
  const hsl  = rgbToHsl(rgb);
  const hsv  = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hex  = rgbToHex(rgb);

  // Preview
  const preview = document.getElementById('colorPreview');
  preview.style.background = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;

  // Sync color picker
  document.getElementById('colorPicker').value = '#' + hex.replace('#','').slice(0,6);

  // Output values
  setText('out-hex',  hex.toUpperCase());
  setText('out-rgb',  rgb.a < 1
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`
    : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  setText('out-hsl',  rgb.a < 1
    ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${rgb.a})`
    : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
  setText('out-hsv',  `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`);
  setText('out-cmyk', `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`);
  setText('out-r',  rgb.r); setText('out-g', rgb.g); setText('out-b', rgb.b);
  setText('out-a',  rgb.a);

  // Contrast
  const onWhite = contrastRatio(rgb, {r:255,g:255,b:255});
  const onBlack = contrastRatio(rgb, {r:0,g:0,b:0});
  setText('contrast-white', onWhite + ':1');
  setText('contrast-black', onBlack + ':1');
  document.getElementById('contrast-white-rating').textContent = wcagRating(onWhite);
  document.getElementById('contrast-black-rating').textContent = wcagRating(onBlack);

  // Tints & shades
  renderSwatches('tintsRow',  getTints(rgb));
  renderSwatches('shadesRow', getShades(rgb));

  // URL
  history.replaceState(null, '', '?c=' + encodeURIComponent(hex));
}

function wcagRating(ratio) {
  if (ratio >= 7)   return 'AAA ✓';
  if (ratio >= 4.5) return 'AA ✓';
  if (ratio >= 3)   return 'AA Large ✓';
  return 'Fail ✗';
}

function renderSwatches(id, colors) {
  const row = document.getElementById(id);
  row.innerHTML = '';
  colors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'swatch';
    div.style.background = `rgb(${c.r},${c.g},${c.b})`;
    div.title = rgbToHex(c).toUpperCase();
    div.onclick = () => {
      document.getElementById('colorInput').value = rgbToHex(c).toUpperCase();
      setColor(c);
    };
    row.appendChild(div);
  });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Event handlers ────────────────────────────────────────────────────────

function onInputChange() {
  const val = document.getElementById('colorInput').value.trim();
  if (!val) return;
  const rgb = parseColor(val);
  if (rgb) {
    setColor(rgb);
    document.getElementById('inputError').hidden = true;
  } else {
    document.getElementById('inputError').hidden = false;
  }
}

function onPickerChange() {
  const hex = document.getElementById('colorPicker').value;
  document.getElementById('colorInput').value = hex.toUpperCase();
  setColor(hexToRgb(hex));
}

function copyOutput(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`[onclick="copyOutput('${id}')"]`);
    if (!btn) return;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

(function init() {
  const params = new URLSearchParams(location.search);
  const c = params.get('c');
  if (c) {
    const rgb = parseColor(c);
    if (rgb) { currentRgb = rgb; document.getElementById('colorInput').value = c; }
  } else {
    document.getElementById('colorInput').value = '#4F8EF7';
  }
  render(currentRgb);

  document.getElementById('colorInput').addEventListener('input', onInputChange);
  document.getElementById('colorInput').addEventListener('change', onInputChange);
  document.getElementById('colorPicker').addEventListener('input', onPickerChange);
})();
