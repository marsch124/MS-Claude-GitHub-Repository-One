// charts.js — tiny, dependency-free SVG charts.
// Self-contained so the app works offline with zero external libraries.

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, children = []) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.appendChild(c);
  return node;
};
const txt = (s, attrs) => { const t = el('text', attrs); t.textContent = s; return t; };

function frame(w, h) {
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'chart', role: 'img' });
  return svg;
}

const PAD = { l: 40, r: 14, t: 12, b: 30 };

/** Horizontal bar chart from [{label, value, count?}]. */
export function barChart(data, { w = 320, unit = '', max = null } = {}) {
  if (!data.length) return emptyChart(w);
  const rowH = 34;
  const h = PAD.t + PAD.b + data.length * rowH;
  const svg = frame(w, h);
  const maxV = max ?? Math.max(...data.map((d) => d.value), 1);
  const x0 = 96;
  const barW = w - x0 - PAD.r;
  data.forEach((d, i) => {
    const y = PAD.t + i * rowH;
    const labelText = d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label;
    const lt = txt(labelText, { x: x0 - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end', class: 'chart-label' });
    if (labelText !== d.label) lt.appendChild(el('title', {}, [txt(d.label)]));
    svg.appendChild(lt);
    svg.appendChild(el('rect', { x: x0, y: y + 6, width: barW, height: rowH - 16, rx: 5, class: 'chart-track' }));
    const width = Math.max(2, (d.value / maxV) * barW);
    svg.appendChild(el('rect', { x: x0, y: y + 6, width, height: rowH - 16, rx: 5, class: 'chart-bar' }));
    const label = unit === '★' ? `${d.value}★` : `${d.value}${unit}`;
    svg.appendChild(txt(d.count ? `${label} (${d.count})` : label,
      { x: x0 + width + 6, y: y + rowH / 2 + 4, class: 'chart-value' }));
  });
  return svg;
}

/** Scatter plot from [{x, y, name}] with axis titles. y assumed 1–5 rating. */
export function scatterChart(points, { w = 320, h = 220, xLabel = '', yLabel = 'Rating', xUnit = '' } = {}) {
  if (!points.length) return emptyChart(w);
  const svg = frame(w, h);
  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const spanX = maxX - minX || 1;
  const plotW = w - PAD.l - PAD.r;
  const plotH = h - PAD.t - PAD.b;
  const sx = (x) => PAD.l + ((x - minX) / spanX) * plotW;
  const sy = (y) => PAD.t + (1 - (y - 1) / 4) * plotH; // rating 1..5

  // y gridlines + labels at each star
  for (let r = 1; r <= 5; r++) {
    const y = sy(r);
    svg.appendChild(el('line', { x1: PAD.l, y1: y, x2: w - PAD.r, y2: y, class: 'chart-grid' }));
    svg.appendChild(txt(`${r}★`, { x: PAD.l - 6, y: y + 4, 'text-anchor': 'end', class: 'chart-tick' }));
  }
  // x axis min/max labels
  svg.appendChild(txt(`${round(minX)}${xUnit}`, { x: PAD.l, y: h - 8, class: 'chart-tick' }));
  svg.appendChild(txt(`${round(maxX)}${xUnit}`, { x: w - PAD.r, y: h - 8, 'text-anchor': 'end', class: 'chart-tick' }));
  svg.appendChild(txt(xLabel, { x: PAD.l + plotW / 2, y: h - 8, 'text-anchor': 'middle', class: 'chart-axis-title' }));

  for (const p of points) {
    const c = el('circle', { cx: sx(p.x), cy: sy(p.y), r: 6, class: 'chart-dot' });
    c.appendChild(el('title', {}, [txt(`${p.name}: ${round(p.x)}${xUnit}, ${p.y}★`)]));
    svg.appendChild(c);
  }
  return svg;
}

function emptyChart(w) {
  const svg = frame(w, 80);
  svg.appendChild(txt('Not enough data yet — log a few finished batches.',
    { x: w / 2, y: 44, 'text-anchor': 'middle', class: 'chart-empty' }));
  return svg;
}

const round = (n) => Math.round(n * 10) / 10;
