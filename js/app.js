// app.js — screens, navigation and wiring for FermentLog.
import {
  VEGETABLES, LID_TYPES, WEIGHT_TYPES, PROBLEMS, COMMON_ADDITIONS,
  computeBrinePercent, isBrineInRange, daysBetween, batchStatus, statusLabel,
  overallRating, summarizeStats, newBatch, ratingStars,
} from './model.js';
import * as db from './db.js';
import { barChart, scatterChart } from './charts.js';

const app = document.getElementById('app');
const $ = (sel, root = document) => root.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtBrine = (b) => { const v = computeBrinePercent(b.saltGrams, b.waterMl); return v == null ? '—' : `${v.toFixed(1)}%`; };

let editing = null; // working copy of a batch being created/edited

// ---------- Router ----------
async function render() {
  const hash = location.hash || '#/';
  app.classList.add('fade');
  if (hash === '#/' || hash === '') await renderList();
  else if (hash === '#/new') renderForm(newBatch());
  else if (hash === '#/insights') await renderInsights();
  else if (hash === '#/settings') renderSettings();
  else if (hash.startsWith('#/edit/')) await editExisting(hash.slice(7));
  else if (hash.startsWith('#/batch/')) await renderDetail(hash.slice(8));
  else await renderList();
  requestAnimationFrame(() => app.classList.remove('fade'));
  syncNav(hash);
}

function syncNav(hash) {
  document.querySelectorAll('.tabbar a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === hash ||
      (a.getAttribute('href') === '#/' && (hash === '' || hash === '#/')));
  });
}

// ---------- Batches list ----------
async function renderList() {
  const batches = await db.getAllBatches();
  const wrap = h(`<section class="screen"><header class="topbar"><h1>My ferments</h1></header></section>`);
  if (!batches.length) {
    wrap.appendChild(h(`<div class="empty">
      <div class="empty-emoji">🥕</div>
      <h2>No batches yet</h2>
      <p>Start your first jar and begin learning what makes the best ferment.</p>
      <a class="btn primary" href="#/new">＋ New batch</a>
    </div>`));
  } else {
    const list = h('<div class="cards"></div>');
    for (const b of batches) list.appendChild(batchCard(b));
    wrap.appendChild(list);
  }
  swap(wrap);
}

function batchCard(b) {
  const status = batchStatus(b);
  const days = daysBetween(b.startDate, b.movedToFridgeDate || null);
  const rating = overallRating(b);
  const thumb = b.photos && b.photos[0]
    ? `<img class="thumb" src="${b.photos[0]}" alt="">`
    : `<div class="thumb placeholder">🫙</div>`;
  const card = h(`<a class="card" href="#/batch/${b.id}">
    ${thumb}
    <div class="card-body">
      <div class="card-title">${esc(b.name || b.vegetable || 'Untitled batch')}</div>
      <div class="card-meta">
        <span class="pill pill-${status}">${statusLabel(status)}</span>
        <span>${esc(b.vegetable)}</span>
        <span>${fmtBrine(b)}</span>
        ${days != null ? `<span>${days} d</span>` : ''}
      </div>
      <div class="card-rating">${rating != null ? ratingStars(rating) : '<span class="muted">no verdict yet</span>'}</div>
    </div>
  </a>`);
  return card;
}

// ---------- New / Edit form ----------
async function editExisting(id) {
  const b = await db.getBatch(id);
  if (!b) return location.assign('#/');
  renderForm(structuredClone(b), true);
}

function renderForm(batch, isEdit = false) {
  editing = batch;
  const veg = VEGETABLES.map((v) => `<option ${v === batch.vegetable ? 'selected' : ''}>${v}</option>`).join('');
  const lids = LID_TYPES.map((v) => `<option ${v === batch.lidType ? 'selected' : ''}>${v}</option>`).join('');
  const weights = WEIGHT_TYPES.map((v) => `<option ${v === batch.weightType ? 'selected' : ''}>${v}</option>`).join('');
  const addChips = COMMON_ADDITIONS.map((a) =>
    `<label class="chip"><input type="checkbox" value="${a}" ${batch.additions?.includes(a) ? 'checked' : ''}>${a}</label>`).join('');

  const form = h(`<section class="screen">
    <header class="topbar"><a class="back" href="${isEdit ? `#/batch/${batch.id}` : '#/'}">‹</a><h1>${isEdit ? 'Edit batch' : 'New batch'}</h1></header>
    <form id="batchForm" class="form">
      <fieldset><legend>Basics</legend>
        <label>Name <input name="name" value="${esc(batch.name)}" placeholder="e.g. Spicy carrot #1"></label>
        <label>Vegetable <select name="vegetable">${veg}</select></label>
        <label>Start date <input type="date" name="startDate" value="${batch.startDate}"></label>
      </fieldset>

      <fieldset><legend>Conditions</legend>
        <div class="row">
          <label>Salt (g) <input type="number" step="0.1" min="0" name="saltGrams" value="${batch.saltGrams}"></label>
          <label>Water (ml) <input type="number" step="1" min="0" name="waterMl" value="${batch.waterMl}"></label>
        </div>
        <div id="brineHint" class="hint"></div>
        <div class="row">
          <label>Room temp (°C) <input type="number" step="0.5" name="roomTempC" value="${batch.roomTempC}"></label>
          <label>Jar size (ml) <input type="number" step="1" min="0" name="jarSizeMl" value="${batch.jarSizeMl}"></label>
        </div>
        <div class="field-label">Additions</div>
        <div class="chips">${addChips}</div>
      </fieldset>

      <fieldset><legend>Equipment</legend>
        <label>Vessel <input name="vesselType" value="${esc(batch.vesselType)}" placeholder="Glass jar, crock…"></label>
        <div class="row">
          <label>Weight <select name="weightType">${weights}</select></label>
          <label>Lid <select name="lidType">${lids}</select></label>
        </div>
      </fieldset>

      <fieldset><legend>Photos & notes</legend>
        <div class="photos" id="photos"></div>
        <label class="btn ghost file">📷 Add photo<input type="file" accept="image/*" id="photoInput" hidden></label>
        <label>Notes <textarea name="notes" rows="3" placeholder="Anything worth remembering…">${esc(batch.notes)}</textarea></label>
      </fieldset>

      <div class="actions">
        <button type="submit" class="btn primary">${isEdit ? 'Save changes' : 'Start batch'}</button>
        ${isEdit ? '<button type="button" id="deleteBtn" class="btn danger">Delete</button>' : ''}
      </div>
    </form>
  </section>`);
  swap(form);

  const f = $('#batchForm', form);
  const updateBrine = () => {
    const v = computeBrinePercent($('[name=saltGrams]', f).value, $('[name=waterMl]', f).value);
    const hint = $('#brineHint', form);
    if (v == null) { hint.textContent = ''; return; }
    const ok = isBrineInRange(v);
    hint.innerHTML = `Brine: <strong>${v.toFixed(1)}%</strong> ${ok ? '<span class="ok">✓ in the 2–3% sweet spot</span>' : '<span class="warn">↕ typical veg range is 2–3%</span>'}`;
    hint.className = `hint ${ok ? 'good' : 'caution'}`;
  };
  $('[name=saltGrams]', f).addEventListener('input', updateBrine);
  $('[name=waterMl]', f).addEventListener('input', updateBrine);
  updateBrine();

  renderPhotos(form);
  $('#photoInput', form).addEventListener('change', (e) => addPhoto(e, form));
  if (isEdit) $('#deleteBtn', form).addEventListener('click', () => confirmDelete(batch.id));

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    Object.assign(editing, {
      name: fd.get('name').trim(),
      vegetable: fd.get('vegetable'),
      startDate: fd.get('startDate'),
      saltGrams: numOrEmpty(fd.get('saltGrams')),
      waterMl: numOrEmpty(fd.get('waterMl')),
      roomTempC: numOrEmpty(fd.get('roomTempC')),
      jarSizeMl: numOrEmpty(fd.get('jarSizeMl')),
      vesselType: fd.get('vesselType').trim(),
      weightType: fd.get('weightType'),
      lidType: fd.get('lidType'),
      notes: fd.get('notes').trim(),
      additions: [...f.querySelectorAll('.chips input:checked')].map((c) => c.value),
    });
    await db.saveBatch(editing);
    location.assign(`#/batch/${editing.id}`);
  });
}

function renderPhotos(root) {
  const box = $('#photos', root);
  box.innerHTML = '';
  (editing.photos || []).forEach((src, i) => {
    const item = h(`<div class="photo"><img src="${src}" alt=""><button type="button" class="photo-del" aria-label="Remove">✕</button></div>`);
    $('.photo-del', item).addEventListener('click', () => { editing.photos.splice(i, 1); renderPhotos(root); });
    box.appendChild(item);
  });
}

async function addPhoto(e, root) {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await shrinkImage(file, 1000, 0.75);
  editing.photos = editing.photos || [];
  editing.photos.push(dataUrl);
  renderPhotos(root);
  e.target.value = '';
}

// Downscale + JPEG-compress so on-device storage stays small.
function shrinkImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Batch detail ----------
async function renderDetail(id) {
  const b = await db.getBatch(id);
  if (!b) return location.assign('#/');
  const status = batchStatus(b);
  const days = daysBetween(b.startDate, b.movedToFridgeDate || null);
  const rating = overallRating(b);
  const brineOk = isBrineInRange(computeBrinePercent(b.saltGrams, b.waterMl));

  const photos = (b.photos || []).map((s) => `<img class="detail-photo" src="${s}" alt="">`).join('');
  const additions = (b.additions || []).length ? (b.additions).map((a) => `<span class="tag">${esc(a)}</span>`).join('') : '<span class="muted">none</span>';

  const checkIns = (b.checkIns || []).length
    ? (b.checkIns).map((c) => `<li><span class="ci-date">${c.date}</span> ${esc(c.tasteNote || '')}</li>`).join('')
    : '<li class="muted">No check-ins yet.</li>';

  const el = h(`<section class="screen">
    <header class="topbar">
      <a class="back" href="#/">‹</a>
      <h1>${esc(b.name || b.vegetable)}</h1>
      <a class="edit" href="#/edit/${b.id}">Edit</a>
    </header>

    <div class="detail">
      <div class="pill pill-${status} big">${statusLabel(status)}${days != null ? ` · day ${days}` : ''}</div>
      ${photos ? `<div class="detail-photos">${photos}</div>` : ''}

      <div class="stat-grid">
        <div class="stat"><span>Vegetable</span><strong>${esc(b.vegetable)}</strong></div>
        <div class="stat"><span>Brine</span><strong class="${brineOk ? 'ok' : ''}">${fmtBrine(b)}</strong></div>
        <div class="stat"><span>Room temp</span><strong>${b.roomTempC ?? '—'}°C</strong></div>
        <div class="stat"><span>Started</span><strong>${b.startDate}</strong></div>
        <div class="stat"><span>Lid</span><strong>${esc(b.lidType || '—')}</strong></div>
        <div class="stat"><span>Weight</span><strong>${esc(b.weightType || '—')}</strong></div>
      </div>

      <div class="detail-block"><h3>Additions</h3><div class="tags">${additions}</div></div>
      ${b.notes ? `<div class="detail-block"><h3>Notes</h3><p>${esc(b.notes)}</p></div>` : ''}

      <div class="detail-block">
        <h3>Timeline</h3>
        <ul class="checkins">${checkIns}</ul>
        <form id="ciForm" class="ci-form">
          <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required>
          <input name="tasteNote" placeholder="Taste test note…" required>
          <button class="btn ghost small">Add</button>
        </form>
        ${status !== 'done' ? `
          ${!b.movedToFridgeDate ? '<button id="fridgeBtn" class="btn ghost">🧊 Move to fridge</button>' : ''}
        ` : ''}
      </div>

      <div class="detail-block">
        <h3>Outcome ${rating != null ? `<span class="head-rating">${ratingStars(rating)}</span>` : ''}</h3>
        <div id="outcomeArea"></div>
      </div>
    </div>
  </section>`);
  swap(el);

  $('#ciForm', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    b.checkIns = b.checkIns || [];
    b.checkIns.push({ date: fd.get('date'), tasteNote: fd.get('tasteNote').trim() });
    b.checkIns.sort((x, y) => x.date.localeCompare(y.date));
    await db.saveBatch(b);
    renderDetail(id);
  });
  const fridge = $('#fridgeBtn', el);
  if (fridge) fridge.addEventListener('click', async () => {
    b.movedToFridgeDate = new Date().toISOString().slice(0, 10);
    await db.saveBatch(b);
    renderDetail(id);
  });
  renderOutcome($('#outcomeArea', el), b, id);
}

function renderOutcome(container, b, id) {
  const o = b.outcome;
  if (o && o.recorded) {
    const probs = (o.problems || []).length ? (o.problems).map((p) => `<span class="tag warn-tag">${esc(p)}</span>`).join('') : '<span class="muted">none</span>';
    container.innerHTML = `
      <div class="outcome-view">
        <div class="verdict ${o.success ? 'good' : 'bad'}">${o.success ? '✓ Success' : '✕ Didn’t work out'}</div>
        <div class="stat-grid small">
          <div class="stat"><span>Taste</span><strong>${ratingStars(o.taste)}</strong></div>
          <div class="stat"><span>Sourness</span><strong>${ratingStars(o.sourness)}</strong></div>
          <div class="stat"><span>Crunch</span><strong>${ratingStars(o.crunch)}</strong></div>
          <div class="stat"><span>Overall</span><strong>${ratingStars(o.overall)}</strong></div>
        </div>
        <div class="detail-block"><h4>Problems</h4><div class="tags">${probs}</div></div>
        <button class="btn ghost small" id="reeditOutcome">Edit outcome</button>
      </div>`;
    $('#reeditOutcome', container).addEventListener('click', () => renderOutcomeForm(container, b, id));
    return;
  }
  container.innerHTML = `<p class="muted">No verdict recorded yet.</p><button class="btn primary" id="recordBtn">Record outcome</button>`;
  $('#recordBtn', container).addEventListener('click', () => renderOutcomeForm(container, b, id));
}

function renderOutcomeForm(container, b, id) {
  const o = b.outcome || {};
  const stars = (name, val) => `
    <div class="rating-row"><span>${name}</span>
      <div class="stars" data-name="${name.toLowerCase()}">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star ${val >= n ? 'on' : ''}" data-v="${n}">★</button>`).join('')}
      </div></div>`;
  const probChips = PROBLEMS.map((p) =>
    `<label class="chip"><input type="checkbox" value="${p}" ${o.problems?.includes(p) ? 'checked' : ''}>${p}</label>`).join('');

  container.innerHTML = `<form id="outcomeForm" class="outcome-form">
    ${stars('Taste', o.taste)}${stars('Sourness', o.sourness)}${stars('Crunch', o.crunch)}${stars('Overall', o.overall)}
    <label class="switch"><input type="checkbox" name="success" ${o.success ? 'checked' : ''}> Overall a success</label>
    <div class="field-label">Problems seen</div>
    <div class="chips">${probChips}</div>
    <button class="btn primary" type="submit">Save outcome</button>
  </form>`;

  const values = { taste: o.taste, sourness: o.sourness, crunch: o.crunch, overall: o.overall };
  container.querySelectorAll('.stars').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.star'); if (!btn) return;
      const v = Number(btn.dataset.v);
      values[group.dataset.name] = v;
      [...group.children].forEach((s, i) => s.classList.toggle('on', i < v));
    });
  });

  $('#outcomeForm', container).addEventListener('submit', async (e) => {
    e.preventDefault();
    b.outcome = {
      recorded: true,
      taste: values.taste, sourness: values.sourness, crunch: values.crunch, overall: values.overall,
      success: $('[name=success]', container).checked,
      problems: [...container.querySelectorAll('.chips input:checked')].map((c) => c.value),
      recordedAt: new Date().toISOString(),
    };
    await db.saveBatch(b);
    renderDetail(id);
  });
}

// ---------- Insights ----------
async function renderInsights() {
  const batches = await db.getAllBatches();
  const s = summarizeStats(batches);
  const screen = h(`<section class="screen"><header class="topbar"><h1>Insights</h1></header></section>`);

  const kpis = h(`<div class="kpis">
    <div class="kpi"><span class="kpi-num">${s.total}</span><span class="kpi-lbl">batches</span></div>
    <div class="kpi"><span class="kpi-num">${s.active}</span><span class="kpi-lbl">active now</span></div>
    <div class="kpi"><span class="kpi-num">${s.successRate == null ? '—' : Math.round(s.successRate * 100) + '%'}</span><span class="kpi-lbl">success rate</span></div>
    <div class="kpi"><span class="kpi-num">${s.avgRating ?? '—'}</span><span class="kpi-lbl">avg rating</span></div>
  </div>`);
  screen.appendChild(kpis);

  if (s.bestBatch) {
    const bb = s.bestBatch;
    screen.appendChild(h(`<div class="best-card">
      <div class="best-emoji">🏆</div>
      <div>
        <div class="best-title">Best batch so far: ${esc(bb.name || bb.vegetable)} ${ratingStars(s.bestRating)}</div>
        <div class="best-sub">${esc(bb.vegetable)} · ${fmtBrine(bb)} brine · ${bb.roomTempC ?? '—'}°C · ${esc(bb.lidType || 'any lid')}</div>
        <a class="best-link" href="#/batch/${bb.id}">Repeat these conditions →</a>
      </div>
    </div>`));
  }

  screen.appendChild(chartCard('Rating vs. brine strength', scatterChart(s.ratingVsBrine, { xLabel: 'Brine %', xUnit: '%' })));
  screen.appendChild(chartCard('Rating vs. room temperature', scatterChart(s.ratingVsTemp, { xLabel: 'Temperature', xUnit: '°C' })));
  screen.appendChild(chartCard('Average rating by vegetable', barChart(s.byVegetable, { unit: '★', max: 5 })));
  screen.appendChild(chartCard('Average rating by lid type', barChart(s.byLid, { unit: '★', max: 5 })));
  screen.appendChild(chartCard('Problems encountered', barChart(s.problems, { unit: '' })));

  swap(screen);
}

function chartCard(title, svg) {
  const card = h(`<div class="chart-card"><h3>${title}</h3></div>`);
  card.appendChild(svg);
  return card;
}

// ---------- Settings ----------
function renderSettings() {
  const screen = h(`<section class="screen">
    <header class="topbar"><h1>Settings</h1></header>
    <div class="settings">
      <div class="setting-block">
        <h3>Backup</h3>
        <p class="muted">Your data lives only on this device. Export a backup file you can keep safe or move to a new phone.</p>
        <button class="btn primary" id="exportBtn">⬇ Export backup</button>
        <label class="btn ghost file">⬆ Import backup<input type="file" accept="application/json,.json" id="importInput" hidden></label>
      </div>
      <div class="setting-block danger-block">
        <h3>Danger zone</h3>
        <button class="btn danger" id="wipeBtn">Delete all data</button>
      </div>
      <p class="version">FermentLog · works offline · v1</p>
    </div>
  </section>`);
  swap(screen);

  $('#exportBtn', screen).addEventListener('click', async () => {
    const json = await db.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fermentlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#importInput', screen).addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const count = await db.importJSON(await file.text(), { merge: true });
      alert(`Imported ${count} batch(es).`);
      location.assign('#/');
    } catch (err) { alert('Could not import: ' + err.message); }
  });
  $('#wipeBtn', screen).addEventListener('click', async () => {
    if (confirm('Delete ALL batches? This cannot be undone.')) {
      await db.replaceAll([]);
      location.assign('#/');
    }
  });
}

async function confirmDelete(id) {
  if (confirm('Delete this batch permanently?')) {
    await db.deleteBatch(id);
    location.assign('#/');
  }
}

// ---------- helpers ----------
function numOrEmpty(v) { const s = String(v).trim(); return s === '' ? '' : Number(s); }
function swap(node) { app.replaceChildren(node); window.scrollTo(0, 0); }

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
