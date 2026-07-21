// app.js — screens, navigation and wiring for FermentLog.
import {
  VEGETABLES, LID_TYPES, WEIGHT_TYPES, PROBLEMS, COMMON_SPICES, DEFAULT_REMIND_DAYS,
  computeBrinePercent, isBrineInRange, daysBetween, fermentDays, batchStatus, statusLabel,
  overallRating, summarizeStats, recommendation, newBatch, ratingStars,
  nextCheckDue, dueBatches, toCSV, presetFromBatch, batchFromPreset, duplicateBatch,
  usedVegetables, mergeVegetables, usedSpices, mergeSpices, renamedList, withoutItem,
  RECIPE_CATEGORIES, newRecipe, duplicateRecipe, sampleSourdoughRecipe,
} from './model.js';
import { APP_VERSION, CHANGELOG } from './changelog.js';
import {
  hasApiKey, getApiKey, setApiKey, buildRecipeFromText, buildBatchFromText,
  buildCheckInFromText, improveRecipe, buildBatchTips,
} from './ai.js';
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

// ---------- Custom vegetables (remembered on this device) ----------
const VEG_KEY = 'fermentlog-vegetables';
const ADD_VEG = '__add__'; // sentinel dropdown value that reveals the text field
function getCustomVegetables() { try { return JSON.parse(localStorage.getItem(VEG_KEY)) || []; } catch { return []; } }
function rememberVegetable(name) {
  const v = (name || '').trim();
  if (!v || VEGETABLES.includes(v)) return;
  const list = getCustomVegetables();
  if (!list.includes(v)) { list.push(v); try { localStorage.setItem(VEG_KEY, JSON.stringify(list)); } catch {} }
}
// Full option list: built-ins + vegetables from past batches + remembered + this batch's own.
async function vegetableOptionsFor(currentVeg) {
  const batches = await db.getAllBatches();
  const extras = [...new Set([...usedVegetables(batches), ...getCustomVegetables(), currentVeg]
    .filter((v) => v && !VEGETABLES.includes(v)))].sort((a, b) => a.localeCompare(b));
  return mergeVegetables(extras);
}

// ---------- Custom spices (remembered on this device) ----------
const SPICE_KEY = 'fermentlog-spices';
function getCustomSpices() { try { return JSON.parse(localStorage.getItem(SPICE_KEY)) || []; } catch { return []; } }
function rememberSpice(name) {
  const s = (name || '').trim();
  if (!s || COMMON_SPICES.includes(s)) return;
  const list = getCustomSpices();
  if (!list.includes(s)) { list.push(s); try { localStorage.setItem(SPICE_KEY, JSON.stringify(list)); } catch {} }
}
async function spiceOptionsFor(currentSpices = []) {
  const batches = await db.getAllBatches();
  const extras = [...new Set([...usedSpices(batches), ...getCustomSpices(), ...currentSpices]
    .filter((s) => s && !COMMON_SPICES.includes(s)))].sort((a, b) => a.localeCompare(b));
  return mergeSpices(extras);
}

// ---------- Managing custom vegetables & spices ----------
function setList(key, list) { try { localStorage.setItem(key, JSON.stringify([...new Set(list.filter(Boolean))])); } catch {} }

// Rename a vegetable everywhere it appears: remembered list, all batches, all presets.
async function renameVegetable(oldName, newName) {
  setList(VEG_KEY, renamedList(getCustomVegetables(), oldName, newName));
  rememberVegetable(newName);
  for (const b of await db.getAllBatches()) {
    if (b.vegetable === oldName) { b.vegetable = newName; await db.saveBatch(b); }
  }
  for (const p of await db.getPresets()) {
    if (p.vegetable === oldName) { p.vegetable = newName; await db.savePreset(p); }
  }
}
// Only drops from the remembered list; callers guarantee it's unused by batches.
function forgetVegetable(name) { setList(VEG_KEY, withoutItem(getCustomVegetables(), name)); }

// Rename a spice everywhere: remembered list, all batches' additions, all presets' additions.
async function renameSpice(oldName, newName) {
  setList(SPICE_KEY, renamedList(getCustomSpices(), oldName, newName));
  rememberSpice(newName);
  for (const b of await db.getAllBatches()) {
    if ((b.additions || []).includes(oldName)) { b.additions = renamedList(b.additions, oldName, newName); await db.saveBatch(b); }
  }
  for (const p of await db.getPresets()) {
    if ((p.additions || []).includes(oldName)) { p.additions = renamedList(p.additions, oldName, newName); await db.savePreset(p); }
  }
}
// Remove a spice from the remembered list and strip it from every batch and preset.
async function removeSpice(name) {
  setList(SPICE_KEY, withoutItem(getCustomSpices(), name));
  for (const b of await db.getAllBatches()) {
    if ((b.additions || []).includes(name)) { b.additions = withoutItem(b.additions, name); await db.saveBatch(b); }
  }
  for (const p of await db.getPresets()) {
    if ((p.additions || []).includes(name)) { p.additions = withoutItem(p.additions, name); await db.savePreset(p); }
  }
}

// ---------- "What's new" ----------
const SEEN_KEY = 'fermentlog-seen-version';
function isVersionUnseen() { try { return localStorage.getItem(SEEN_KEY) !== APP_VERSION; } catch { return false; } }
function markVersionSeen() { try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch {} }

// ---------- Router ----------
async function render() {
  const hash = location.hash || '#/';
  app.classList.add('fade');
  if (hash === '#/' || hash === '') await renderList();
  else if (hash === '#/new') await renderNew();
  else if (hash === '#/insights') await renderInsights();
  else if (hash === '#/settings') await renderSettings();
  else if (hash === '#/manage-lists') await renderManageLists();
  else if (hash === '#/changelog') renderChangelog();
  else if (hash === '#/recipes') await renderRecipes();
  else if (hash === '#/recipe-new') renderRecipeForm(newRecipe());
  else if (hash.startsWith('#/recipe-edit/')) await editRecipe(hash.slice(14));
  else if (hash.startsWith('#/recipe/')) await renderRecipeDetail(hash.slice(9));
  else if (hash.startsWith('#/edit/')) await editExisting(hash.slice(7));
  else if (hash.startsWith('#/batch/')) await renderDetail(hash.slice(8));
  else await renderList();
  requestAnimationFrame(() => app.classList.remove('fade'));
  syncNav(hash);
}

function syncNav(hash) {
  document.querySelectorAll('.tabbar a').forEach((a) => {
    const href = a.getAttribute('href');
    let active = href === hash;
    if (href === '#/' && (hash === '' || hash === '#/' || hash.startsWith('#/batch') || hash.startsWith('#/edit'))) active = true;
    if (href === '#/recipes' && hash.startsWith('#/recipe')) active = true;
    a.classList.toggle('active', active);
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

  if (isVersionUnseen()) {
    const wn = h(`<a class="whatsnew-banner" href="#/changelog">
      <span class="wn-ico">✨</span>
      <div><strong>FermentLog v${APP_VERSION} — what's new</strong>
      <div class="wn-sub">Tap to see everything that's been added.</div></div>
    </a>`);
    wrap.appendChild(wn);
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
  const batch = newBatch();
  const [presets, vegOptions, spiceOptions] = await Promise.all([
    db.getPresets(), vegetableOptionsFor(batch.vegetable), spiceOptionsFor(batch.additions)]);
  renderForm(batch, false, presets, vegOptions, spiceOptions);
}

async function editExisting(id) {
  const b = await db.getBatch(id);
  if (!b) return location.assign('#/');
  const [vegOptions, spiceOptions] = await Promise.all([vegetableOptionsFor(b.vegetable), spiceOptionsFor(b.additions)]);
  renderForm(structuredClone(b), true, [], vegOptions, spiceOptions);
}

function renderForm(batch, isEdit, presets, vegOptions, spiceOptions) {
  editing = batch;
  // Make sure this batch's own vegetable is always selectable.
  const options = batch.vegetable && !vegOptions.includes(batch.vegetable) ? [...vegOptions, batch.vegetable] : vegOptions;
  const veg = options.map((v) => `<option ${v === batch.vegetable ? 'selected' : ''}>${esc(v)}</option>`).join('')
    + `<option value="${ADD_VEG}">＋ Add another vegetable…</option>`;
  const lids = LID_TYPES.map((v) => `<option ${v === batch.lidType ? 'selected' : ''}>${v}</option>`).join('');
  const weights = WEIGHT_TYPES.map((v) => `<option ${v === batch.weightType ? 'selected' : ''}>${v}</option>`).join('');
  // Spice chips: built-ins + remembered + any this batch already has.
  const spiceList = [...new Set([...spiceOptions, ...(batch.additions || [])])];
  const spiceChips = spiceList.map((a) =>
    `<label class="chip"><input type="checkbox" value="${esc(a)}" ${batch.additions?.includes(a) ? 'checked' : ''}>${esc(a)}</label>`).join('');
  const presetOpts = (presets || []).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

  const form = h(`<section class="screen">
    <header class="topbar"><a class="back" href="${isEdit ? `#/batch/${batch.id}` : '#/'}">‹</a><h1>${isEdit ? 'Edit batch' : 'New batch'}</h1></header>
    <form id="batchForm" class="form">
      ${!isEdit ? `<fieldset class="ai-panel"><legend>✨ Build with AI</legend>
        <div class="field-label">Describe or dictate this batch — tap the 🎤 on your keyboard and talk. AI fills in the fields below for you to review.</div>
        <textarea id="aiText" rows="3" placeholder="e.g. Carrot sticks in a 2.5% brine, about 20°C, glass weight and a burping lid, garlic and dill, taste every 3 days."></textarea>
        <button type="button" id="aiBuild" class="btn ghost full">✨ Build batch with AI</button>
        <div id="aiStatus" class="hint"></div>
      </fieldset>` : ''}

      ${!isEdit && presetOpts ? `<label class="preset-pick">Start from a batch template
        <select id="presetPick"><option value="">— none —</option>${presetOpts}</select></label>` : ''}

      <fieldset><legend>Basics</legend>
        <label>Name <input name="name" value="${esc(batch.name)}" placeholder="e.g. Spicy carrot #1"></label>
        <label>Vegetable <select name="vegetable">${veg}</select></label>
        <label id="customVegWrap" class="custom-veg" hidden>New vegetable
          <input name="customVeg" placeholder="e.g. Kohlrabi" autocomplete="off">
        </label>
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
        <div class="field-label">Spices</div>
        <div class="chips" id="spiceChips">${spiceChips}</div>
        <div class="add-spice">
          <input id="newSpice" placeholder="Add a spice…" autocomplete="off">
          <button type="button" id="addSpiceBtn" class="btn ghost small">＋ Add</button>
        </div>
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
      <button type="button" id="savePresetBtn" class="btn ghost full">⭐ Save these settings as a batch template</button>
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

  // Reveal the free-text field when "Add another vegetable…" is chosen.
  const vegSel = $('[name=vegetable]', f);
  const customWrap = $('#customVegWrap', form);
  const toggleCustom = () => {
    const on = vegSel.value === ADD_VEG;
    customWrap.hidden = !on;
    if (on) customWrap.querySelector('input').focus();
  };
  vegSel.addEventListener('change', toggleCustom);
  toggleCustom();

  // Add a custom spice as a new checked chip (and remember it for next time).
  const spiceChipsBox = $('#spiceChips', form);
  const newSpiceInput = $('#newSpice', form);
  const addSpice = () => {
    const name = newSpiceInput.value.trim();
    if (!name) return;
    const existing = [...spiceChipsBox.querySelectorAll('input')].find((c) => c.value.toLowerCase() === name.toLowerCase());
    if (existing) { existing.checked = true; }
    else {
      const chip = h(`<label class="chip"><input type="checkbox" value="${esc(name)}" checked>${esc(name)}</label>`);
      spiceChipsBox.appendChild(chip);
    }
    rememberSpice(name);
    newSpiceInput.value = '';
    newSpiceInput.focus();
  };
  $('#addSpiceBtn', form).addEventListener('click', addSpice);
  newSpiceInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSpice(); } });

  const aiBtn = $('#aiBuild', form);
  if (aiBtn) aiBtn.addEventListener('click', async () => {
    const text = $('#aiText', form).value.trim();
    const status = $('#aiStatus', form);
    if (!text) { status.className = 'hint caution'; status.textContent = 'Type or dictate a description first.'; return; }
    if (!hasApiKey()) {
      status.className = 'hint caution';
      status.innerHTML = 'Add your Anthropic API key in <a href="#/settings">Settings → AI assistant</a> first.';
      return;
    }
    aiBtn.disabled = true;
    status.className = 'hint';
    status.textContent = '✨ Building your batch…';
    try {
      const built = await buildBatchFromText(text);
      built.id = editing.id;                 // keep the same draft
      built.createdAt = editing.createdAt;
      editing = built;
      renderForm(editing, false, presets, vegOptions, spiceOptions); // re-render with fields filled
    } catch (e) {
      aiBtn.disabled = false;
      status.className = 'hint caution';
      status.textContent = '⚠ ' + e.message;
    }
  });

  const picker = $('#presetPick', form);
  if (picker) picker.addEventListener('change', () => {
    const p = presets.find((x) => x.id === picker.value);
    if (!p) return;
    const filled = batchFromPreset(p);
    editing = filled;
    const opts = options.includes(filled.vegetable) ? options : [...options, filled.vegetable];
    renderForm(filled, false, presets, opts, spiceOptions); // re-render prefilled (keeps lists)
  });

  renderPhotos(form);
  $('#photoInput', form).addEventListener('change', (e) => addPhoto(e, form));
  if (isEdit) $('#deleteBtn', form).addEventListener('click', () => confirmDelete(batch.id));

  $('#savePresetBtn', form).addEventListener('click', async () => {
    syncFormInto(editing, f);
    const name = prompt('Name this batch template (e.g. "Classic 2.5% carrots"):', editing.name || editing.vegetable);
    if (!name) return;
    await db.savePreset(presetFromBatch(editing, name.trim()));
    alert('Template saved. You can pick it when starting a new batch.');
  });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    syncFormInto(editing, f);
    if (!editing.vegetable) { alert('Please type the vegetable name.'); customWrap.querySelector('input').focus(); return; }
    await db.saveBatch(editing);
    location.assign(`#/batch/${editing.id}`);
  });
}

function syncFormInto(target, f) {
  const fd = new FormData(f);
  let vegetable = fd.get('vegetable');
  if (vegetable === ADD_VEG) vegetable = (fd.get('customVeg') || '').trim();
  rememberVegetable(vegetable);
  Object.assign(target, {
    name: fd.get('name').trim(),
    vegetable,
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

      <div class="detail-block"><h3>Spices</h3><div class="tags">${additions}</div></div>
      ${b.notes ? `<div class="detail-block"><h3>Notes</h3><p>${esc(b.notes)}</p></div>` : ''}

      <div class="detail-block">
        <h3>Timeline</h3>
        <ul class="checkins">${checkIns}</ul>
        <form id="ciForm" class="ci-form no-print">
          <input type="date" name="date" value="${todayISO()}" required>
          <input name="tasteNote" placeholder="Taste test note…" required>
          <button class="btn ghost small">Add</button>
        </form>
        <div class="ai-inline no-print">
          <textarea id="ciAiText" rows="2" placeholder="✨ …or dictate: “day 4, tangy and still crunchy” — tap the 🎤 and talk"></textarea>
          <button type="button" id="ciAiBtn" class="btn ghost small">✨ Add by voice</button>
          <div id="ciAiStatus" class="hint"></div>
        </div>
        ${status !== 'done' && !b.movedToFridgeDate ? '<button id="fridgeBtn" class="btn ghost no-print">🧊 Move to fridge</button>' : ''}
      </div>

      <div class="detail-block">
        <h3>Outcome ${rating != null ? `<span class="head-rating">${ratingStars(rating)}</span>` : ''}</h3>
        <div id="outcomeArea"></div>
      </div>

      <div id="tipsArea" class="no-print"></div>
      <div class="detail-actions no-print">
        <button id="tipsBtn" class="btn ghost">✨ AI tips</button>
        <button id="dupBtn" class="btn ghost">🧬 Duplicate</button>
        <button id="shareBtn" class="btn ghost">↗ Share</button>
        <button id="printBtn" class="btn ghost">🖨 Print</button>
      </div>
    </div>
  </section>`);
  swap(el);

  const ciAiBtn = $('#ciAiBtn', el);
  ciAiBtn.addEventListener('click', async () => {
    const text = $('#ciAiText', el).value.trim();
    const status = $('#ciAiStatus', el);
    if (!text) { status.className = 'hint caution'; status.textContent = 'Say something first.'; return; }
    if (!hasApiKey()) { status.className = 'hint caution'; status.innerHTML = 'Add your API key in <a href="#/settings">Settings → AI assistant</a> first.'; return; }
    ciAiBtn.disabled = true; status.className = 'hint'; status.textContent = '✨ Adding…';
    try {
      const ci = await buildCheckInFromText(text, { startDate: b.startDate });
      b.checkIns = b.checkIns || [];
      b.checkIns.push(ci);
      b.checkIns.sort((x, y) => x.date.localeCompare(y.date));
      await db.saveBatch(b);
      renderDetail(id);
    } catch (e) { ciAiBtn.disabled = false; status.className = 'hint caution'; status.textContent = '⚠ ' + e.message; }
  });

  $('#tipsBtn', el).addEventListener('click', () => suggestBatchTips(b, id, $('#tipsArea', el)));

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

async function suggestBatchTips(b, id, area) {
  if (!hasApiKey()) {
    area.innerHTML = '<div class="tips-box">Add your API key in <a href="#/settings">Settings → AI assistant</a> to get tips.</div>';
    return;
  }
  area.innerHTML = '<div class="tips-box">✨ Thinking about your batch…</div>';
  try {
    const tips = await buildBatchTips(b);
    if (!tips) { area.innerHTML = '<div class="tips-box">No tips this time — try again.</div>'; return; }
    const box = h(`<div class="tips-box">
      <div class="tips-head">✨ Suggested tips</div>
      <p class="tips-text">${esc(tips)}</p>
      <div class="tips-actions">
        <button class="btn ghost small" id="tipsAdd">Add to notes</button>
        <button class="btn ghost small" id="tipsDismiss">Dismiss</button>
      </div>
    </div>`);
    area.replaceChildren(box);
    $('#tipsAdd', box).addEventListener('click', async () => {
      b.notes = b.notes ? `${b.notes}\n\n${tips}` : tips;
      await db.saveBatch(b);
      renderDetail(id);
    });
    $('#tipsDismiss', box).addEventListener('click', () => { area.innerHTML = ''; });
  } catch (e) {
    area.innerHTML = `<div class="tips-box">⚠ ${esc(e.message)}</div>`;
  }
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
    : '<li class="muted">No batch templates yet.</li>';

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
        <h3>Batch templates</h3>
        <ul class="preset-list">${presetList}</ul>
      </div>

      <div class="setting-block">
        <h3>Vegetables & spices</h3>
        <p class="muted">Rename or remove the vegetables and spices you've added.</p>
        <a class="btn ghost" href="#/manage-lists">Manage vegetables &amp; spices →</a>
      </div>

      <div class="setting-block ai-settings">
        <h3>✨ AI assistant <span class="ai-badge">${hasApiKey() ? 'on' : 'optional'}</span></h3>
        <p class="muted">Fill in a <strong>recipe</strong> or start a <strong>batch</strong> just by describing it in your own words — or dictating it with the 🎤 on your keyboard. You always review and edit before anything is saved.</p>

        <div class="ai-about">
          <h4>How it works</h4>
          <ul>
            <li>On a <strong>new batch</strong> or a <strong>new recipe</strong> you'll see a “<strong>✨ Build with AI</strong>” box. Type or dictate a description (e.g. <em>“carrots, 2.5% brine, 20°C, airlock, garlic and dill”</em>), tap the button, and the fields fill in for you.</li>
            <li>It's powered by <strong>Claude Opus 4.8</strong>, Anthropic's most capable model, so it understands loose, natural descriptions.</li>
            <li>Nothing is ever saved automatically — the AI only <em>fills in the form</em>, and you review, tweak, and save yourself.</li>
          </ul>

          <h4>Your key, your data — private by design</h4>
          <ul>
            <li>It uses <strong>your own Anthropic API key</strong>, stored <strong>only on this device</strong>. The key is never sent to us or to GitHub and never leaves your phone except to talk directly to Anthropic.</li>
            <li>Only the <strong>text you describe</strong> is sent to Anthropic, so it can structure it. Your batches, photos, ratings, notes, recipes and everything else <strong>stay on your device</strong> and are never uploaded.</li>
            <li>The rest of FermentLog works <strong>fully offline</strong> — only this one button needs the internet.</li>
          </ul>

          <h4>What it costs</h4>
          <ul>
            <li>Billed <strong>pay-as-you-go on your own Anthropic account</strong>, not through this app. A recipe or batch is only a few hundred words, so it costs a <strong>fraction of a cent</strong> each; even hundreds add up to a euro or two.</li>
            <li>You're always in control of spending at <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com ↗</a>.</li>
          </ul>

          <h4>Set it up once</h4>
          <ol>
            <li>Create a free account at <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com ↗</a> and add a little pay-as-you-go credit.</li>
            <li>Open <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">API keys ↗</a> and create a key — it starts with <code>sk-ant-</code>.</li>
            <li>Paste it below and tap <strong>Save key</strong>. The “Build with AI” buttons light up straight away.</li>
          </ol>
        </div>

        <label>Your API key <input type="password" id="aiKey" placeholder="sk-ant-…" autocomplete="off" value="${esc(getApiKey())}"></label>
        <div class="ai-key-actions">
          <button class="btn ghost" id="saveKey">Save key</button>
          <button class="btn ghost" id="clearKey">Clear</button>
          <span id="keyState" class="muted">${hasApiKey() ? '✓ key saved on this device' : ''}</span>
        </div>
        <p class="muted small-note">You can remove the key anytime with <strong>Clear</strong> — it's deleted from this device immediately.</p>
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
      <p class="version">FermentLog v${APP_VERSION} · works offline · <a href="#/changelog">What's new${isVersionUnseen() ? ' <span class="new-badge">●</span>' : ''}</a></p>
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

  const keyState = $('#keyState', screen);
  $('#saveKey', screen).addEventListener('click', () => {
    setApiKey($('#aiKey', screen).value);
    keyState.textContent = hasApiKey() ? '✓ key saved on this device' : '';
  });
  $('#clearKey', screen).addEventListener('click', () => {
    setApiKey('');
    $('#aiKey', screen).value = '';
    keyState.textContent = 'cleared';
  });

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

// ---------- Manage vegetables & spices ----------
async function renderManageLists() {
  const batches = await db.getAllBatches();
  const vegItems = [...new Set([...getCustomVegetables(), ...usedVegetables(batches)])].sort((a, b) => a.localeCompare(b));
  const spiceItems = [...new Set([...getCustomSpices(), ...usedSpices(batches)])].sort((a, b) => a.localeCompare(b));
  const vegCount = (name) => batches.filter((b) => b.vegetable === name).length;
  const spiceCount = (name) => batches.filter((b) => (b.additions || []).includes(name)).length;

  const row = (name, count, kind) => `<li>
    <div class="ml-name">${esc(name)}<span class="ml-count">${count ? `used by ${count} batch${count > 1 ? 'es' : ''}` : 'unused'}</span></div>
    <div class="ml-actions">
      <button class="ml-btn" data-act="rename" data-kind="${kind}" data-name="${esc(name)}">Rename</button>
      <button class="ml-btn danger" data-act="remove" data-kind="${kind}" data-name="${esc(name)}">Remove</button>
    </div></li>`;

  const vegList = vegItems.length ? vegItems.map((n) => row(n, vegCount(n), 'veg')).join('') : '<li class="muted">No custom vegetables yet.</li>';
  const spiceList = spiceItems.length ? spiceItems.map((n) => row(n, spiceCount(n), 'spice')).join('') : '<li class="muted">No custom spices yet.</li>';

  const screen = h(`<section class="screen">
    <header class="topbar"><a class="back" href="#/settings">‹</a><h1>Vegetables & spices</h1></header>
    <p class="cl-intro">Rename or remove the vegetables and spices you've added. Built-in ones aren't listed. Renaming updates every batch and recipe that uses the name.</p>
    <div class="setting-block"><h3>Vegetables</h3><ul class="manage-list">${vegList}</ul></div>
    <div class="setting-block"><h3>Spices</h3><ul class="manage-list">${spiceList}</ul></div>
  </section>`);
  swap(screen);
  screen.querySelectorAll('.ml-btn').forEach((btn) => btn.addEventListener('click', () => onManageAction(btn, batches)));
}

async function onManageAction(btn, batches) {
  const { act, kind, name } = btn.dataset;
  if (act === 'rename') {
    const next = prompt(`Rename "${name}" to:`, name);
    if (next == null) return;
    const nn = next.trim();
    if (!nn || nn === name) return;
    if (kind === 'veg') await renameVegetable(name, nn); else await renameSpice(name, nn);
    renderManageLists();
    return;
  }
  // remove
  if (kind === 'veg') {
    const count = batches.filter((b) => b.vegetable === name).length;
    if (count > 0) {
      alert(`"${name}" is used by ${count} batch${count > 1 ? 'es' : ''}. Rename it, or change those batches first — a batch can't be left without a vegetable.`);
      return;
    }
    if (!confirm(`Remove "${name}" from your vegetables?`)) return;
    forgetVegetable(name);
  } else {
    const count = batches.filter((b) => (b.additions || []).includes(name)).length;
    if (!confirm(count ? `Remove "${name}"? It will also be removed from ${count} batch${count > 1 ? 'es' : ''}.` : `Remove "${name}"?`)) return;
    await removeSpice(name);
  }
  renderManageLists();
}

// ---------- Recipes ----------
let editingRecipe = null;
let pendingRecipeDraft = null; // an AI-improved draft handed to the edit route
const linesToList = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
const recipeEmoji = (r) => (r.category === 'Sourdough' ? '🥖' : r.category === 'Drink / kombucha' ? '🫖' : r.category === 'Dairy' ? '🧀' : '🫙');

async function renderRecipes() {
  const recipes = await db.getRecipes();
  const wrap = h(`<section class="screen"><header class="topbar"><h1>Recipes</h1><a class="edit" href="#/recipe-new">＋ New</a></header></section>`);
  if (!recipes.length) {
    const empty = h(`<div class="empty">
      <div class="empty-emoji">🥖</div>
      <h2>No recipes yet</h2>
      <p>Keep your fermentation and baking recipes here — ingredients, timed steps, and storage notes.</p>
      <a class="btn primary" href="#/recipe-new">＋ New recipe</a>
      <button class="btn ghost" id="sourdoughExample">🥖 Start from a sourdough example</button>
    </div>`);
    wrap.appendChild(empty);
    swap(wrap);
    $('#sourdoughExample', wrap).addEventListener('click', async () => {
      const r = sampleSourdoughRecipe();
      await db.saveRecipe(r);
      location.assign(`#/recipe/${r.id}`);
    });
    return;
  }
  const list = h('<div class="cards"></div>');
  for (const r of recipes) list.appendChild(recipeCard(r));
  wrap.appendChild(list);
  swap(wrap);
}

function recipeCard(r) {
  const thumb = r.photos && r.photos[0]
    ? `<img class="thumb" src="${r.photos[0]}" alt="">`
    : `<div class="thumb placeholder">${recipeEmoji(r)}</div>`;
  return h(`<a class="card" href="#/recipe/${r.id}">
    ${thumb}
    <div class="card-body">
      <div class="card-title">${esc(r.title || 'Untitled recipe')}</div>
      <div class="card-meta">
        <span class="pill pill-recipe">${esc(r.category || '')}</span>
        ${r.totalTime ? `<span>⏱ ${esc(r.totalTime)}</span>` : ''}
        ${(r.steps || []).length ? `<span>${r.steps.length} step${r.steps.length > 1 ? 's' : ''}</span>` : ''}
      </div>
    </div>
  </a>`);
}

async function renderRecipeDetail(id) {
  const r = await db.getRecipe(id);
  if (!r) return location.assign('#/recipes');
  const photos = (r.photos || []).map((s) => `<img class="detail-photo" src="${s}" alt="">`).join('');
  const listBlock = (items) => (items || []).length
    ? `<ul class="recipe-ings">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '<p class="muted">—</p>';
  const steps = (r.steps || []).length
    ? `<ol class="recipe-steps">${r.steps.map((s) => `<li>
        <div class="step-head"><span class="step-title">${esc(s.title || '')}</span>${s.time ? `<span class="step-time">⏱ ${esc(s.time)}</span>` : ''}</div>
        ${s.detail ? `<div class="step-detail">${esc(s.detail)}</div>` : ''}
      </li>`).join('')}</ol>`
    : '<p class="muted">No steps yet.</p>';

  const el = h(`<section class="screen">
    <header class="topbar no-print"><a class="back" href="#/recipes">‹</a><h1>${esc(r.title || 'Recipe')}</h1><a class="edit" href="#/recipe-edit/${r.id}">Edit</a></header>
    <div class="detail">
      <div class="pill pill-recipe big">${esc(r.category || '')}</div>
      ${photos ? `<div class="detail-photos">${photos}</div>` : ''}
      ${r.description ? `<p class="recipe-desc">${esc(r.description)}</p>` : ''}
      ${(r.activeTime || r.totalTime) ? `<div class="time-grid">
        ${r.activeTime ? `<div class="stat"><span>Hands-on time</span><strong>${esc(r.activeTime)}</strong></div>` : ''}
        ${r.totalTime ? `<div class="stat"><span>Total time</span><strong>${esc(r.totalTime)}</strong></div>` : ''}
      </div>` : ''}
      <div class="detail-block"><h3>Ingredients</h3>${listBlock(r.ingredients)}</div>
      <div class="detail-block"><h3>Equipment</h3>${listBlock(r.equipment)}</div>
      <div class="detail-block"><h3>Method</h3>${steps}</div>
      ${r.storage ? `<div class="detail-block"><h3>Storage &amp; keeping</h3><p>${esc(r.storage)}</p></div>` : ''}
      <div class="detail-actions no-print">
        <button id="improveRecipe" class="btn ghost">✨ Improve</button>
        <button id="dupRecipe" class="btn ghost">🧬 Duplicate</button>
        <button id="shareRecipe" class="btn ghost">↗ Share</button>
        <button id="printRecipe" class="btn ghost">🖨 Print</button>
      </div>
      <div id="improveStatus" class="hint no-print"></div>
    </div>
  </section>`);
  swap(el);
  const improveBtn = $('#improveRecipe', el);
  improveBtn.addEventListener('click', async () => {
    const status = $('#improveStatus', el);
    if (!hasApiKey()) { status.className = 'hint caution'; status.innerHTML = 'Add your API key in <a href="#/settings">Settings → AI assistant</a> first.'; return; }
    improveBtn.disabled = true; status.className = 'hint'; status.textContent = '✨ Improving your recipe…';
    try {
      const improved = await improveRecipe(r);
      improved.id = r.id;                 // same recipe
      improved.photos = r.photos || [];
      improved.createdAt = r.createdAt;
      pendingRecipeDraft = improved;
      location.assign(`#/recipe-edit/${r.id}`); // edit route (different hash) picks up the draft to review/save
    } catch (e) { improveBtn.disabled = false; status.className = 'hint caution'; status.textContent = '⚠ ' + e.message; }
  });
  $('#dupRecipe', el).addEventListener('click', async () => {
    const d = duplicateRecipe(r); await db.saveRecipe(d); location.assign(`#/recipe/${d.id}`);
  });
  $('#shareRecipe', el).addEventListener('click', () => shareRecipe(r));
  $('#printRecipe', el).addEventListener('click', () => window.print());
}

function recipeSummaryText(r) {
  const L = [`${r.title} (${r.category})`];
  if (r.description) L.push(r.description);
  if (r.activeTime) L.push(`Hands-on: ${r.activeTime}`);
  if (r.totalTime) L.push(`Total: ${r.totalTime}`);
  if ((r.ingredients || []).length) L.push('\nIngredients:\n' + r.ingredients.map((i) => `- ${i}`).join('\n'));
  if ((r.equipment || []).length) L.push('\nEquipment:\n' + r.equipment.map((i) => `- ${i}`).join('\n'));
  if ((r.steps || []).length) L.push('\nMethod:\n' + r.steps.map((s, i) => `${i + 1}. ${s.title}${s.time ? ` (${s.time})` : ''}${s.detail ? ` — ${s.detail}` : ''}`).join('\n'));
  if (r.storage) L.push('\nStorage: ' + r.storage);
  return L.join('\n');
}

async function shareRecipe(r) {
  const text = recipeSummaryText(r);
  try {
    if (navigator.share) { await navigator.share({ title: r.title || 'Recipe', text }); return; }
    await navigator.clipboard.writeText(text);
    alert('Recipe copied to clipboard.');
  } catch { /* cancelled */ }
}

async function editRecipe(id) {
  // Prefer an in-memory AI-improved draft for this recipe if one is waiting.
  let r;
  if (pendingRecipeDraft && pendingRecipeDraft.id === id) { r = pendingRecipeDraft; pendingRecipeDraft = null; }
  else r = await db.getRecipe(id);
  if (!r) return location.assign('#/recipes');
  renderRecipeForm(structuredClone(r), true);
}

function renderRecipeForm(recipe, isEdit = false) {
  editingRecipe = recipe;
  const cats = RECIPE_CATEGORIES.map((c) => `<option ${c === recipe.category ? 'selected' : ''}>${c}</option>`).join('');
  const form = h(`<section class="screen">
    <header class="topbar"><a class="back" href="${isEdit ? `#/recipe/${recipe.id}` : '#/recipes'}">‹</a><h1>${isEdit ? 'Edit recipe' : 'New recipe'}</h1></header>
    <form id="recipeForm" class="form">
      <fieldset class="ai-panel"><legend>✨ Build with AI</legend>
        <div class="field-label">Describe or dictate your recipe — tap the 🎤 on your keyboard and just talk. AI fills in the fields below for you to review.</div>
        <textarea id="aiText" rows="4" placeholder="e.g. Everyday sourdough — 500 g flour, 350 g water, 100 g starter, 10 g salt. Autolyse an hour, bulk 4–6 h with folds, shape, cold proof overnight, bake covered 20 min then 25 uncovered. Keeps 3 days or freeze."></textarea>
        <button type="button" id="aiBuild" class="btn ghost full">✨ Build recipe with AI</button>
        <div id="aiStatus" class="hint"></div>
      </fieldset>

      <fieldset><legend>About</legend>
        <label>Title <input name="title" value="${esc(recipe.title)}" placeholder="e.g. Everyday sourdough"></label>
        <label>Category <select name="category">${cats}</select></label>
        <label>Short description <textarea name="description" rows="2" placeholder="A sentence or two…">${esc(recipe.description)}</textarea></label>
        <div class="row">
          <label>Hands-on time <input name="activeTime" value="${esc(recipe.activeTime)}" placeholder="e.g. 45 min"></label>
          <label>Total time <input name="totalTime" value="${esc(recipe.totalTime)}" placeholder="e.g. 24 h"></label>
        </div>
      </fieldset>

      <fieldset><legend>Ingredients</legend>
        <div class="field-label">One per line</div>
        <textarea name="ingredients" rows="6" placeholder="500 g bread flour&#10;350 g water&#10;100 g starter&#10;10 g salt">${esc((recipe.ingredients || []).join('\n'))}</textarea>
      </fieldset>

      <fieldset><legend>Equipment</legend>
        <div class="field-label">One per line</div>
        <textarea name="equipment" rows="4" placeholder="Banneton&#10;Dutch oven&#10;Kitchen scale">${esc((recipe.equipment || []).join('\n'))}</textarea>
      </fieldset>

      <fieldset><legend>Method — timed steps</legend>
        <div id="steps"></div>
        <button type="button" id="addStep" class="btn ghost small">＋ Add step</button>
      </fieldset>

      <fieldset><legend>Photos</legend>
        <div class="photos" id="rphotos"></div>
        <label class="btn ghost file">📷 Add photo<input type="file" accept="image/*" id="rphotoInput" hidden></label>
      </fieldset>

      <fieldset><legend>Storage &amp; keeping</legend>
        <textarea name="storage" rows="3" placeholder="How to store it and how long it keeps…">${esc(recipe.storage)}</textarea>
      </fieldset>

      <div class="actions">
        <button type="submit" class="btn primary">${isEdit ? 'Save recipe' : 'Create recipe'}</button>
        ${isEdit ? '<button type="button" id="delRecipe" class="btn danger">Delete</button>' : ''}
      </div>
    </form>
  </section>`);
  swap(form);

  renderStepRows(form);
  $('#addStep', form).addEventListener('click', () => {
    syncStepsFromDom(form);
    editingRecipe.steps.push({ title: '', detail: '', time: '' });
    renderStepRows(form);
    form.querySelectorAll('.step-title-in')[editingRecipe.steps.length - 1]?.focus();
  });

  renderRecipePhotos(form);
  $('#rphotoInput', form).addEventListener('change', (e) => addRecipePhoto(e, form));

  const aiBtn = $('#aiBuild', form);
  aiBtn.addEventListener('click', async () => {
    const text = $('#aiText', form).value.trim();
    const status = $('#aiStatus', form);
    if (!text) { status.className = 'hint caution'; status.textContent = 'Type or dictate a description first.'; return; }
    if (!hasApiKey()) {
      status.className = 'hint caution';
      status.innerHTML = 'Add your Anthropic API key in <a href="#/settings">Settings → AI assistant</a> first.';
      return;
    }
    aiBtn.disabled = true;
    status.className = 'hint';
    status.textContent = '✨ Building your recipe…';
    try {
      const built = await buildRecipeFromText(text);
      built.id = editingRecipe.id;                 // keep the same draft
      built.photos = editingRecipe.photos || [];   // keep any photos already added
      built.createdAt = editingRecipe.createdAt;
      editingRecipe = built;
      renderRecipeForm(editingRecipe, isEdit);      // re-render with fields filled in
    } catch (e) {
      aiBtn.disabled = false;
      status.className = 'hint caution';
      status.textContent = '⚠ ' + e.message;
    }
  });
  if (isEdit) $('#delRecipe', form).addEventListener('click', async () => {
    if (confirm('Delete this recipe permanently?')) { await db.deleteRecipe(recipe.id); location.assign('#/recipes'); }
  });

  $('#recipeForm', form).addEventListener('submit', async (e) => {
    e.preventDefault();
    syncStepsFromDom(form);
    const fd = new FormData(e.target);
    Object.assign(editingRecipe, {
      title: fd.get('title').trim(),
      category: fd.get('category'),
      description: fd.get('description').trim(),
      activeTime: fd.get('activeTime').trim(),
      totalTime: fd.get('totalTime').trim(),
      ingredients: linesToList(fd.get('ingredients')),
      equipment: linesToList(fd.get('equipment')),
      storage: fd.get('storage').trim(),
      updatedAt: new Date().toISOString(),
    });
    if (!editingRecipe.title) { alert('Please give the recipe a title.'); return; }
    await db.saveRecipe(editingRecipe);
    location.assign(`#/recipe/${editingRecipe.id}`);
  });
}

function renderStepRows(root) {
  const box = $('#steps', root);
  box.innerHTML = '';
  editingRecipe.steps.forEach((s, i) => {
    const row = h(`<div class="step-row" data-i="${i}">
      <div class="step-row-head">
        <span class="step-num">${i + 1}</span>
        <input class="step-title-in" placeholder="Step title (e.g. Bulk ferment)" value="${esc(s.title)}">
        <button type="button" class="step-del" data-act="del" aria-label="Remove step">✕</button>
      </div>
      <input class="step-time-in" placeholder="Time for this step (e.g. 4–6 h)" value="${esc(s.time)}">
      <textarea class="step-detail-in" rows="2" placeholder="Details (optional)">${esc(s.detail)}</textarea>
      <div class="step-move">
        <button type="button" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
        <button type="button" data-act="down" ${i === editingRecipe.steps.length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
      </div>
    </div>`);
    row.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (!act) return;
      syncStepsFromDom(root);
      if (act === 'del') editingRecipe.steps.splice(i, 1);
      else if (act === 'up') { [editingRecipe.steps[i - 1], editingRecipe.steps[i]] = [editingRecipe.steps[i], editingRecipe.steps[i - 1]]; }
      else if (act === 'down') { [editingRecipe.steps[i + 1], editingRecipe.steps[i]] = [editingRecipe.steps[i], editingRecipe.steps[i + 1]]; }
      renderStepRows(root);
    });
    box.appendChild(row);
  });
}

function syncStepsFromDom(root) {
  editingRecipe.steps = [...root.querySelectorAll('.step-row')].map((r) => ({
    title: r.querySelector('.step-title-in').value.trim(),
    time: r.querySelector('.step-time-in').value.trim(),
    detail: r.querySelector('.step-detail-in').value.trim(),
  }));
}

function renderRecipePhotos(root) {
  const box = $('#rphotos', root);
  box.innerHTML = '';
  const photos = editingRecipe.photos || [];
  photos.forEach((src, i) => {
    const item = h(`<div class="photo"><img src="${src}" alt="">
      <div class="photo-tools">
        <button type="button" data-act="left" ${i === 0 ? 'disabled' : ''} aria-label="Move left">◀</button>
        <button type="button" data-act="del" class="del" aria-label="Remove">✕</button>
        <button type="button" data-act="right" ${i === photos.length - 1 ? 'disabled' : ''} aria-label="Move right">▶</button>
      </div></div>`);
    item.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'del') photos.splice(i, 1);
      else if (act === 'left') { [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]]; }
      else if (act === 'right') { [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]]; }
      else return;
      renderRecipePhotos(root);
    });
    box.appendChild(item);
  });
}

async function addRecipePhoto(e, root) {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await shrinkImage(file, 1000, 0.75);
  editingRecipe.photos = editingRecipe.photos || [];
  editingRecipe.photos.push(dataUrl);
  renderRecipePhotos(root);
  e.target.value = '';
}

// ---------- Changelog ----------
function renderChangelog() {
  markVersionSeen();
  const screen = h(`<section class="screen">
    <header class="topbar"><a class="back" href="#/settings">‹</a><h1>What's new</h1></header>
    <p class="cl-intro">Every improvement to FermentLog, newest first. 🥕</p>
  </section>`);
  const list = h('<div class="changelog"></div>');
  for (const entry of CHANGELOG) {
    const items = entry.changes.map((c) => `<li>${esc(c)}</li>`).join('');
    list.appendChild(h(`<div class="cl-entry">
      <div class="cl-head"><span class="cl-ver">v${esc(entry.version)}</span><span class="cl-title">${esc(entry.title)}</span></div>
      <div class="cl-date">${esc(entry.date)}</div>
      <ul class="cl-list">${items}</ul>
    </div>`));
  }
  screen.appendChild(list);
  swap(screen);
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
