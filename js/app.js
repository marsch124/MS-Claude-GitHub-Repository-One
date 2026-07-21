// app.js — screens, navigation and wiring for FermentLog.
import {
  VEGETABLES, LID_TYPES, WEIGHT_TYPES, PROBLEMS, COMMON_ADDITIONS, DEFAULT_REMIND_DAYS,
  computeBrinePercent, isBrineInRange, daysBetween, fermentDays, batchStatus, statusLabel,
  overallRating, summarizeStats, recommendation, newBatch, ratingStars,
  nextCheckDue, dueBatches, toCSV, presetFromBatch, batchFromPreset, duplicateBatch,
} from './model.js';
import * as db from './db.js';
import { barChart, scatterChart } from './charts.js';

const app = document.getElementById('app');
const $ = (sel, root = document) => root.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtBrine = (b) => { const v = computeBrinePercent(b.saltGrams, b.waterMl); return v == null ? '—' : `${v.toFixed(1)}%`; };
const todayISO = () => new Date().toISOString().slice(0, 10);

let editing = null;        // working copy of a batch being created/edited
let insightsVeg = null;    // active vegetable filter on the Insights screen

// ---------- Theme ----------
const THEME_KEY = 'fermentlog-theme';
function applyTheme(mode) {
  if (mode === 'light' || mode === 'dark') document.documentElement.setAttribute('data-theme', mode);
  else document.documentElement.removeAttribute('data-theme');
}
function currentTheme() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; } }
applyTheme(currentTheme());

// ---------- Router ----------
async function render() {
  const hash = location.hash || '#/';
  app.classList.add('fade');
  if (hash === '#/' || hash === '') await renderList();
  else if (hash === '#/new') await renderNew();
  else if (hash === '#/insights') await renderInsights();
  else if (hash === '#/settings') await renderSettings();
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
    return swap(wrap);
  }

  const due = dueBatches(batches);
  if (due.length) {
    const banner = h(`<div class="due-banner">
      <span class="due-ico">⏰</span>
      <div><strong>${due.length} batch${due.length > 1 ? 'es' : ''} due for a taste test</strong>
      <div class="due-names">${due.map((b) => esc(b.name || b.vegetable)).join(' · ')}</div></div>
    </div>`);
    wrap.appendChild(banner);
  }

  const list = h('<div class="cards"></div>');
  for (const b of batches) list.appendChild(batchCard(b));
  wrap.appendChild(list);
  swap(wrap);
}

function batchCard(b) {
  const status = batchStatus(b);
  const days = daysBetween(b.startDate, b.movedToFridgeDate || null);
  const rating = overallRating(b);
  const due = status === 'fermenting' && dueBatches([b]).length;
  const thumb = b.photos && b.photos[0]
    ? `<img class="thumb" src="${b.photos[0]}" alt="">`
    : `<div class="thumb placeholder">🫙</div>`;
  return h(`<a class="card" href="#/batch/${b.id}">
    ${thumb}
    <div class="card-body">
      <div class="card-title">${esc(b.name || b.vegetable || 'Untitled batch')}${due ? ' <span class="due-dot" title="Due for a taste test">⏰</span>' : ''}</div>
      <div class="card-meta">
        <span class="pill pill-${status}">${statusLabel(status)}</span>
        <span>${esc(b.vegetable)}</span>
        <span>${fmtBrine(b)}</span>
        ${days != null ? `<span>${days} d</span>` : ''}
      </div>
      <div class="card-rating">${rating != null ? ratingStars(rating) : '<span class="muted">no verdict yet</span>'}</div>
    </div>
  </a>`);
}

// ---------- New batch (with preset picker) ----------
async function renderNew() {
  const presets = await db.getPresets();
  renderForm(newBatch(), false, presets);
}

async function editExisting(id) {
  const b = await db.getBatch(id);
  if (!b) return location.assign('#/');
  renderForm(structuredClone(b), true, []);
}

function renderForm(batch, isEdit, presets) {
  editing = batch;
  const veg = VEGETABLES.map((v) => `<option ${v === batch.vegetable ? 'selected' : ''}>${v}</option>`).join('');
  const lids = LID_TYPES.map((v) => `<option ${v === batch.lidType ? 'selected' : ''}>${v}</option>`).join('');
  const weights = WEIGHT_TYPES.map((v) => `<option ${v === batch.weightType ? 'selected' : ''}>${v}</option>`).join('');
  const addChips = COMMON_ADDITIONS.map((a) =>
    `<label class="chip"><input type="checkbox" value="${a}" ${batch.additions?.includes(a) ? 'checked' : ''}>${a}</label>`).join('');
  const presetOpts = (presets || []).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

  const form = h(`<section class="screen">
    <header class="topbar"><a class="back" href="${isEdit ? `#/batch/${batch.id}` : '#/'}">‹</a><h1>${isEdit ? 'Edit batch' : 'New batch'}</h1></header>
    <form id="batchForm" class="form">
      ${!isEdit && presetOpts ? `<label class="preset-pick">Start from a saved recipe
        <select id="presetPick"><option value="">— none —</option>${presetOpts}</select></label>` : ''}

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

      <fieldset><legend>Reminder</legend>
        <label>Remind me to taste every
          <input type="number" min="0" step="1" name="remindEveryDays" value="${batch.remindEveryDays ?? DEFAULT_REMIND_DAYS}"> days
        </label>
        <div class="hint muted">0 turns reminders off for this batch.</div>
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
      <button type="button" id="savePresetBtn" class="btn ghost full">⭐ Save these settings as a recipe</button>
    </form>
  </section>`);
  swap(form);

  const f = $('#batchForm', form);
  const updateBrine = () => {
    const v = computeBrinePercent($('[name=saltGrams]', f).value, $('[name=waterMl]', f).value);
    const hint = $('#brineHint', form);
    if (v == null) { hint.textContent = ''; hint.className = 'hint'; return; }
    const ok = isBrineInRange(v);
    hint.innerHTML = `Brine: <strong>${v.toFixed(1)}%</strong> ${ok ? '<span class="ok">✓ in the 2–3% sweet spot</span>' : '<span class="warn">↕ typical veg range is 2–3%</span>'}`;
    hint.className = `hint ${ok ? 'good' : 'caution'}`;
  };
  $('[name=saltGrams]', f).addEventListener('input', updateBrine);
  $('[name=waterMl]', f).addEventListener('input', updateBrine);
  updateBrine();

  const picker = $('#presetPick', form);
  if (picker) picker.addEventListener('change', () => {
    const p = presets.find((x) => x.id === picker.value);
    if (!p) return;
    const filled = batchFromPreset(p);
    editing = filled;
    renderForm(filled, false, presets); // re-render prefilled (keeps preset list)
  });

  renderPhotos(form);
  $('#photoInput', form).addEventListener('change', (e) => addPhoto(e, form));
  if (isEdit) $('#deleteBtn', form).addEventListener('click', () => confirmDelete(batch.id));

  $('#savePresetBtn', form).addEventListener('click', async () => {
    syncFormInto(editing, f);
    const name = prompt('Name this recipe (e.g. "Classic 2.5% carrots"):', editing.name || editing.vegetable);
    if (!name) return;
    await db.savePreset(presetFromBatch(editing, name.trim()));
    alert('Recipe saved. You can pick it when starting a new batch.');
  });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    syncFormInto(editing, f);
    await db.saveBatch(editing);
    location.assign(`#/batch/${editing.id}`);
  });
}

function syncFormInto(target, f) {
  const fd = new FormData(f);
  Object.assign(target, {
    name: fd.get('name').trim(),
    vegetable: fd.get('vegetable'),
    startDate: fd.get('startDate'),
    saltGrams: numOrEmpty(fd.get('saltGrams')),
    waterMl: numOrEmpty(fd.get('waterMl')),
    roomTempC: numOrEmpty(fd.get('roomTempC')),
    jarSizeMl: numOrEmpty(fd.get('jarSizeMl')),
    remindEveryDays: numOrEmpty(fd.get('remindEveryDays')),
    vesselType: fd.get('vesselType').trim(),
    weightType: fd.get('weightType'),
    lidType: fd.get('lidType'),
    notes: fd.get('notes').trim(),
    additions: [...f.querySelectorAll('.chips input:checked')].map((c) => c.value),
  });
}

function renderPhotos(root) {
  const box = $('#photos', root);
  box.innerHTML = '';
  const photos = editing.photos || [];
  photos.forEach((src, i) => {
    const item = h(`<div class="photo">
      <img src="${src}" alt="">
      <div class="photo-tools">
        <button type="button" data-act="left" ${i === 0 ? 'disabled' : ''} aria-label="Move left">◀</button>
        <button type="button" data-act="del" class="del" aria-label="Remove">✕</button>
        <button type="button" data-act="right" ${i === photos.length - 1 ? 'disabled' : ''} aria-label="Move right">▶</button>
      </div>
    </div>`);
    item.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'del') photos.splice(i, 1);
      else if (act === 'left') { [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]]; }
      else if (act === 'right') { [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]]; }
      else return;
      renderPhotos(root);
    });
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
  const due = nextCheckDue(b);

  const photos = (b.photos || []).map((s) => `<img class="detail-photo" src="${s}" alt="">`).join('');
  const additions = (b.additions || []).length ? (b.additions).map((a) => `<span class="tag">${esc(a)}</span>`).join('') : '<span class="muted">none</span>';

  const checkIns = (b.checkIns || []).length
    ? (b.checkIns).map((c, i) => `<li><span class="ci-date">${c.date}</span><span class="ci-note">${esc(c.tasteNote || '')}</span>
        <button class="ci-del" data-i="${i}" aria-label="Delete check-in">✕</button></li>`).join('')
    : '<li class="muted">No check-ins yet.</li>';

  const el = h(`<section class="screen">
    <header class="topbar no-print">
      <a class="back" href="#/">‹</a>
      <h1>${esc(b.name || b.vegetable)}</h1>
      <a class="edit" href="#/edit/${b.id}">Edit</a>
    </header>

    <div class="detail">
      <div class="pill pill-${status} big">${statusLabel(status)}${days != null ? ` · day ${days}` : ''}</div>
      ${due ? `<div class="due-inline">⏰ Next taste test due <strong>${due}</strong></div>` : ''}
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
        <form id="ciForm" class="ci-form no-print">
          <input type="date" name="date" value="${todayISO()}" required>
          <input name="tasteNote" placeholder="Taste test note…" required>
          <button class="btn ghost small">Add</button>
        </form>
        ${status !== 'done' && !b.movedToFridgeDate ? '<button id="fridgeBtn" class="btn ghost no-print">🧊 Move to fridge</button>' : ''}
      </div>

      <div class="detail-block">
        <h3>Outcome ${rating != null ? `<span class="head-rating">${ratingStars(rating)}</span>` : ''}</h3>
        <div id="outcomeArea"></div>
      </div>

      <div class="detail-actions no-print">
        <button id="dupBtn" class="btn ghost">🧬 Duplicate</button>
        <button id="shareBtn" class="btn ghost">↗ Share</button>
        <button id="printBtn" class="btn ghost">🖨 Print</button>
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
  el.querySelectorAll('.ci-del').forEach((btn) => btn.addEventListener('click', async () => {
    b.checkIns.splice(Number(btn.dataset.i), 1);
    await db.saveBatch(b);
    renderDetail(id);
  }));
  const fridge = $('#fridgeBtn', el);
  if (fridge) fridge.addEventListener('click', async () => {
    b.movedToFridgeDate = todayISO();
    await db.saveBatch(b);
    renderDetail(id);
  });
  $('#dupBtn', el).addEventListener('click', async () => {
    const dup = duplicateBatch(b);
    await db.saveBatch(dup);
    location.assign(`#/batch/${dup.id}`);
  });
  $('#shareBtn', el).addEventListener('click', () => shareBatch(b));
  $('#printBtn', el).addEventListener('click', () => window.print());
  renderOutcome($('#outcomeArea', el), b, id);
}

function batchSummaryText(b) {
  const lines = [
    `${b.name || b.vegetable} — ${statusLabel(batchStatus(b))}`,
    `Vegetable: ${b.vegetable}`,
    `Brine: ${fmtBrine(b)} (${b.saltGrams}g salt / ${b.waterMl}ml water)`,
    `Room temp: ${b.roomTempC ?? '—'}°C`,
    `Equipment: ${b.vesselType || '—'}, ${b.weightType || '—'} weight, ${b.lidType || '—'}`,
    `Started: ${b.startDate}${b.movedToFridgeDate ? ` · fridge: ${b.movedToFridgeDate}` : ''}`,
  ];
  const r = overallRating(b);
  if (r != null) lines.push(`Result: ${ratingStars(r)}${b.outcome?.success ? ' (success)' : ''}`);
  if (b.notes) lines.push(`Notes: ${b.notes}`);
  return lines.join('\n');
}

async function shareBatch(b) {
  const text = batchSummaryText(b);
  try {
    if (navigator.share) { await navigator.share({ title: 'FermentLog batch', text }); return; }
    await navigator.clipboard.writeText(text);
    alert('Batch summary copied to clipboard.');
  } catch { /* user cancelled share */ }
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
        <button class="btn ghost small no-print" id="reeditOutcome">Edit outcome</button>
      </div>`;
    $('#reeditOutcome', container).addEventListener('click', () => renderOutcomeForm(container, b, id));
    return;
  }
  container.innerHTML = `<p class="muted">No verdict recorded yet.</p><button class="btn primary no-print" id="recordBtn">Record outcome</button>`;
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
  const s = summarizeStats(batches, { vegetable: insightsVeg });
  const rec = recommendation(insightsVeg ? batches.filter((b) => b.vegetable === insightsVeg) : batches);
  const screen = h(`<section class="screen"><header class="topbar"><h1>Insights</h1></header></section>`);

  if (s.vegetables.length > 1) {
    const opts = ['<option value="">All vegetables</option>',
      ...s.vegetables.map((v) => `<option value="${esc(v)}" ${v === insightsVeg ? 'selected' : ''}>${esc(v)}</option>`)].join('');
    const filter = h(`<label class="veg-filter">Show <select id="vegFilter">${opts}</select></label>`);
    screen.appendChild(filter);
    filter.querySelector('select').addEventListener('change', (e) => {
      insightsVeg = e.target.value || null;
      renderInsights();
    });
  }

  screen.appendChild(h(`<div class="kpis">
    <div class="kpi"><span class="kpi-num">${s.total}</span><span class="kpi-lbl">batches</span></div>
    <div class="kpi"><span class="kpi-num">${s.active}</span><span class="kpi-lbl">active now</span></div>
    <div class="kpi"><span class="kpi-num">${s.successRate == null ? '—' : Math.round(s.successRate * 100) + '%'}</span><span class="kpi-lbl">success rate</span></div>
    <div class="kpi"><span class="kpi-num">${s.avgRating ?? '—'}</span><span class="kpi-lbl">avg rating</span></div>
  </div>`));

  if (rec) {
    screen.appendChild(h(`<div class="best-card rec-card">
      <div class="best-emoji">🎯</div>
      <div>
        <div class="best-title">Your recommended recipe</div>
        <div class="best-sub">From your ${rec.count} best batch${rec.count > 1 ? 'es' : ''}: ${esc(rec.vegetable || '')}
          ${rec.brine != null ? `· ${rec.brine}% brine` : ''} ${rec.tempC != null ? `· ${rec.tempC}°C` : ''}
          ${rec.days != null ? `· ~${rec.days} days` : ''} ${rec.lid ? `· ${esc(rec.lid)}` : ''}</div>
      </div>
    </div>`));
  }

  if (s.bestBatch) {
    const bb = s.bestBatch;
    screen.appendChild(h(`<div class="best-card">
      <div class="best-emoji">🏆</div>
      <div>
        <div class="best-title">Best batch so far: ${esc(bb.name || bb.vegetable)} ${ratingStars(s.bestRating)}</div>
        <div class="best-sub">${esc(bb.vegetable)} · ${fmtBrine(bb)} brine · ${bb.roomTempC ?? '—'}°C · ${esc(bb.lidType || 'any lid')}</div>
        <a class="best-link" href="#/batch/${bb.id}">Open this batch →</a>
      </div>
    </div>`));
  }

  screen.appendChild(chartCard('Rating vs. brine strength', scatterChart(s.ratingVsBrine, { xLabel: 'Brine %', xUnit: '%' })));
  screen.appendChild(chartCard('Rating vs. room temperature', scatterChart(s.ratingVsTemp, { xLabel: 'Temperature', xUnit: '°C' })));
  screen.appendChild(chartCard('Rating vs. days fermented', scatterChart(s.ratingVsDays, { xLabel: 'Days', xUnit: ' d' })));
  screen.appendChild(chartCard('Rating trend (oldest → newest)', scatterChart(s.ratingOverTime, { xLabel: 'Attempt', xUnit: '' })));
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
async function renderSettings() {
  const presets = await db.getPresets();
  const theme = currentTheme();
  const seg = (val, label) => `<button class="seg ${theme === val ? 'on' : ''}" data-theme="${val}">${label}</button>`;
  const presetList = presets.length
    ? presets.map((p) => `<li><span>${esc(p.name)}</span><button class="link-del" data-id="${p.id}">Delete</button></li>`).join('')
    : '<li class="muted">No saved recipes yet.</li>';

  const screen = h(`<section class="screen">
    <header class="topbar"><h1>Settings</h1></header>
    <div class="settings">
      <div class="setting-block">
        <h3>Appearance</h3>
        <div class="segmented">${seg('system', 'System')}${seg('light', 'Light')}${seg('dark', 'Dark')}</div>
      </div>

      <div class="setting-block">
        <h3>Reminders</h3>
        <p class="muted">FermentLog nudges you when a batch is due for a taste test. Allow notifications to also get a system alert when you open the app.</p>
        <button class="btn ghost" id="notifyBtn">🔔 Enable notifications</button>
        <span id="notifyState" class="muted"></span>
      </div>

      <div class="setting-block">
        <h3>Saved recipes</h3>
        <ul class="preset-list">${presetList}</ul>
      </div>

      <div class="setting-block">
        <h3>Backup & export</h3>
        <p class="muted">Your data lives only on this device. Keep a backup, or export a spreadsheet.</p>
        <button class="btn primary" id="exportBtn">⬇ Export backup (JSON)</button>
        <label class="btn ghost file">⬆ Import backup<input type="file" accept="application/json,.json" id="importInput" hidden></label>
        <button class="btn ghost" id="csvBtn">📊 Export CSV</button>
      </div>

      <div class="setting-block danger-block">
        <h3>Danger zone</h3>
        <button class="btn danger" id="wipeBtn">Delete all data</button>
      </div>
      <p class="version">FermentLog · works offline · v2</p>
    </div>
  </section>`);
  swap(screen);

  screen.querySelectorAll('.seg').forEach((btn) => btn.addEventListener('click', () => {
    const mode = btn.dataset.theme;
    try { localStorage.setItem(THEME_KEY, mode); } catch {}
    applyTheme(mode);
    renderSettings();
  }));

  const notifyState = $('#notifyState', screen);
  const showNotifyState = () => {
    if (!('Notification' in window)) { notifyState.textContent = ' (not supported on this browser)'; return; }
    notifyState.textContent = Notification.permission === 'granted' ? ' ✓ on'
      : Notification.permission === 'denied' ? ' (blocked in browser settings)' : '';
  };
  showNotifyState();
  $('#notifyBtn', screen).addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    await Notification.requestPermission();
    showNotifyState();
  });

  screen.querySelectorAll('.link-del').forEach((btn) => btn.addEventListener('click', async () => {
    await db.deletePreset(btn.dataset.id);
    renderSettings();
  }));

  $('#exportBtn', screen).addEventListener('click', async () => {
    downloadFile(await db.exportJSON(), `fermentlog-backup-${todayISO()}.json`, 'application/json');
  });
  $('#csvBtn', screen).addEventListener('click', async () => {
    const batches = await db.getAllBatches();
    downloadFile(toCSV(batches), `fermentlog-${todayISO()}.csv`, 'text/csv');
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

// ---------- helpers ----------
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function confirmDelete(id) {
  if (confirm('Delete this batch permanently?')) {
    await db.deleteBatch(id);
    location.assign('#/');
  }
}

// Once per day, if permitted, surface batches due for a taste test.
async function maybeNotifyDue() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const key = 'fermentlog-notified';
  try { if (localStorage.getItem(key) === todayISO()) return; } catch {}
  const due = dueBatches(await db.getAllBatches());
  if (!due.length) return;
  try { localStorage.setItem(key, todayISO()); } catch {}
  new Notification('FermentLog', {
    body: `${due.length} batch${due.length > 1 ? 'es' : ''} due for a taste test: ${due.map((b) => b.name || b.vegetable).join(', ')}`,
    icon: 'icons/icon-192.png',
  });
}

function numOrEmpty(v) { const s = String(v).trim(); return s === '' ? '' : Number(s); }
function swap(node) { app.replaceChildren(node); window.scrollTo(0, 0); }

window.addEventListener('hashchange', render);
render();
maybeNotifyDue();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
