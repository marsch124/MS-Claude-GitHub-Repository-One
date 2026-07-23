// ai.js — optional AI assistant for building recipes and batches.
// Calls the Anthropic Messages API directly from the browser using the user's
// own API key (stored only on this device). Needs internet and a key; only the
// text the user describes is sent. Everything else in the app stays on-device.
import { RECIPE_CATEGORIES, newRecipe, newBatch, LID_TYPES, WEIGHT_TYPES, BAKE_CATEGORIES, BAKE_PROBLEMS, newBake } from './model.js';

const KEY_STORAGE = 'fermentlog-anthropic-key';
const MODEL = 'claude-opus-4-8';

export function getApiKey() { try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; } }
export function setApiKey(k) {
  try { const v = (k || '').trim(); if (v) localStorage.setItem(KEY_STORAGE, v); else localStorage.removeItem(KEY_STORAGE); } catch {}
}
export function hasApiKey() { return !!getApiKey(); }

// Shared call: send a system prompt + schema + user text, return parsed JSON.
async function callStructured(system, schema, userText) {
  const key = getApiKey();
  if (!key) throw new Error('No API key set. Add one in Settings → AI assistant.');

  const body = {
    model: MODEL,
    max_tokens: 4096,
    system,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: userText }],
  };

  let res;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('The AI request timed out. Please try again.', { cause: e });
    throw new Error('Could not reach the AI service. Check your internet connection.', { cause: e });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status}).`;
    try { const err = await res.json(); if (err && err.error && err.error.message) msg = err.error.message; } catch {}
    if (res.status === 401) msg = 'That API key was rejected. Check it in Settings → AI assistant.';
    else if (res.status === 429) msg = 'Rate limited — please wait a moment and try again.';
    throw new Error(msg);
  }

  const data = await res.json();
  const out = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return extractJSON(out);
}

/** Parse the model's JSON, tolerating stray prose or code fences. */
export function extractJSON(s) {
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  throw new Error('The AI response could not be read. Please try again.');
}

// ---------- Recipes ----------

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    category: { type: 'string', enum: RECIPE_CATEGORIES },
    description: { type: 'string' },
    ingredients: { type: 'array', items: { type: 'string' } },
    equipment: { type: 'array', items: { type: 'string' } },
    activeTime: { type: 'string' },
    totalTime: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' }, detail: { type: 'string' }, time: { type: 'string' } },
        required: ['title', 'detail', 'time'],
      },
    },
    storage: { type: 'string' },
  },
  required: ['title', 'category', 'description', 'ingredients', 'equipment', 'activeTime', 'totalTime', 'steps', 'storage'],
};

const RECIPE_SYSTEM = `You turn a home cook's freeform description of a fermentation or baking recipe into a structured recipe.
Rules:
- Keep the user's own quantities, temperatures and times exactly as given. Do not invent ingredients or steps that aren't implied.
- category must be exactly one of: ${RECIPE_CATEGORIES.join(', ')}. Pick the best fit; use "Other" if unsure.
- Break the method into clear, ordered steps. Each step has a short title, an optional detail, and a time string (e.g. "4-6 h", "overnight", "20 min") when one is given; use "" when no time was mentioned.
- ingredients and equipment are arrays of short strings, one item each.
- activeTime is hands-on time; totalTime is start to finish. Use "" if not stated.
- storage: any notes about keeping or storing the result, else "".
- If the description is sparse, fill what you can and leave the rest as empty strings or arrays. Never ask questions.`;

export async function buildRecipeFromText(text) {
  return normalizeRecipe(await callStructured(RECIPE_SYSTEM, RECIPE_SCHEMA, `Build a recipe from this description:\n\n${text}`));
}

/** Coerce arbitrary AI output onto a clean recipe skeleton (pure, testable). */
export function normalizeRecipe(ai, now = new Date()) {
  const obj = ai && typeof ai === 'object' ? ai : {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);
  const r = newRecipe(now);
  r.title = str(obj.title);
  r.category = RECIPE_CATEGORIES.includes(obj.category) ? obj.category : 'Other';
  r.description = str(obj.description);
  r.ingredients = arr(obj.ingredients);
  r.equipment = arr(obj.equipment);
  r.activeTime = str(obj.activeTime);
  r.totalTime = str(obj.totalTime);
  r.storage = str(obj.storage);
  r.steps = Array.isArray(obj.steps)
    ? obj.steps.map((s) => ({ title: str(s && s.title), detail: str(s && s.detail), time: str(s && s.time) }))
      .filter((s) => s.title || s.detail || s.time)
    : [];
  return r;
}

// ---------- Batches ----------

const NUM_OR_NULL = { anyOf: [{ type: 'number' }, { type: 'null' }] };

const BATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    vegetable: { type: 'string' },
    form: { type: 'string' },
    saltGrams: NUM_OR_NULL,
    waterMl: NUM_OR_NULL,
    roomTempC: NUM_OR_NULL,
    jarSizeMl: NUM_OR_NULL,
    additions: { type: 'array', items: { type: 'string' } },
    vesselType: { type: 'string' },
    lidType: { type: 'string' },
    weightType: { type: 'string' },
    remindEveryDays: NUM_OR_NULL,
  },
  required: ['name', 'vegetable', 'form', 'saltGrams', 'waterMl', 'roomTempC', 'jarSizeMl', 'additions', 'vesselType', 'lidType', 'weightType', 'remindEveryDays'],
};

const BATCH_SYSTEM = `You turn a home fermenter's freeform description of a new jar/batch into structured fields.
Rules:
- Keep the user's own numbers. saltGrams is grams of salt; waterMl is millilitres of water.
- If the user gives a brine percentage, compute saltGrams to match, where brine% = salt / (salt + water) * 100. If a water amount is given use it; otherwise assume 1000 ml water. So saltGrams = round( (brine/100) * water / (1 - brine/100) ). Set waterMl to the water used.
- roomTempC is room temperature in Celsius; jarSizeMl is the jar volume in millilitres.
- additions: spices / flavourings mentioned (garlic, dill, chilli, …) as short strings.
- vesselType is free text (e.g. "Glass jar").
- lidType must be exactly one of: ${LID_TYPES.join(' | ')} — map the user's words to the closest one; use "" if none fits.
- weightType must be exactly one of: ${WEIGHT_TYPES.join(' | ')} — map the user's words to the closest one; use "" if none fits.
- remindEveryDays: number of days between taste-test reminders if stated, else null.
- name: a short label if given, else "".
- vegetable: just the vegetable being fermented (e.g. "Carrot", "Cucumber", "Cabbage") — do NOT include how it's cut; if not stated, "".
- form: how it's cut or prepared, as a single word if stated (e.g. Sticks, Slices, Rounds, Cubes, Spears, Shredded, Grated, Whole, Halved), else "".
- Use null for any number not stated, and "" or [] for missing text/lists. Never ask questions.`;

export async function buildBatchFromText(text) {
  return normalizeBatch(await callStructured(BATCH_SYSTEM, BATCH_SCHEMA, `Build a fermentation batch from this description:\n\n${text}`));
}

function matchOption(value, options) {
  const v = (typeof value === 'string' ? value : '').trim().toLowerCase();
  if (!v) return null;
  return options.find((o) => o.toLowerCase() === v)
    || options.find((o) => o.toLowerCase().includes(v) || v.includes(o.toLowerCase()))
    || null;
}

/** Coerce arbitrary AI output onto a fresh batch, keeping sensible defaults (pure, testable). */
export function normalizeBatch(ai, now = new Date()) {
  const obj = ai && typeof ai === 'object' ? ai : {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);
  const numOr = (v, d) => (Number.isFinite(v) ? v : d);
  const b = newBatch(now);
  if (str(obj.name)) b.name = str(obj.name);
  if (str(obj.vegetable)) { b.vegetable = str(obj.vegetable); b.form = str(obj.form); }
  else if (str(obj.form)) b.form = str(obj.form);
  b.saltGrams = numOr(obj.saltGrams, b.saltGrams);
  b.waterMl = numOr(obj.waterMl, b.waterMl);
  b.roomTempC = numOr(obj.roomTempC, b.roomTempC);
  b.jarSizeMl = numOr(obj.jarSizeMl, b.jarSizeMl);
  b.additions = arr(obj.additions);
  if (str(obj.vesselType)) b.vesselType = str(obj.vesselType);
  const lid = matchOption(obj.lidType, LID_TYPES); if (lid) b.lidType = lid;
  const weight = matchOption(obj.weightType, WEIGHT_TYPES); if (weight) b.weightType = weight;
  b.remindEveryDays = numOr(obj.remindEveryDays, b.remindEveryDays);
  return b;
}

// ---------- Dictated timeline check-ins ----------

const CHECKIN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { date: { type: 'string' }, tasteNote: { type: 'string' } },
  required: ['date', 'tasteNote'],
};

/** Turn a spoken note ("day 4, tangy and crunchy") into a dated timeline entry. */
export async function buildCheckInFromText(text, ctx = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const start = ctx.startDate || '';
  const system = `You convert a home fermenter's spoken taste-test note into a dated timeline entry.
Context: the batch started on ${start || 'an unknown date'}; today is ${today}.
Rules:
- date must be in YYYY-MM-DD form. "day 1" is the start date; "day N" is (N-1) days after the start date. "today" = ${today}; "yesterday" = the day before today. If an explicit date is stated, use it. If unclear, use today (${today}).
- tasteNote: the tasting observation as a short, tidy phrase (e.g. "Tangy and still crunchy").
Never ask questions.`;
  return normalizeCheckIn(await callStructured(system, CHECKIN_SCHEMA, `Convert this taste-test note:\n\n${text}`));
}

/** Validate the model's check-in; fall back to today for a bad/absent date (pure, testable). */
export function normalizeCheckIn(ai, now = new Date()) {
  const obj = ai && typeof ai === 'object' ? ai : {};
  const today = now.toISOString().slice(0, 10);
  const validDate = typeof obj.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) && !Number.isNaN(new Date(obj.date).getTime());
  return {
    date: validDate ? obj.date : today,
    tasteNote: typeof obj.tasteNote === 'string' ? obj.tasteNote.trim() : '',
  };
}

// ---------- Improve / expand ----------

/** Refine and flesh out an existing recipe, keeping its identity and quantities. */
export async function improveRecipe(recipe) {
  const system = `${RECIPE_SYSTEM}
You are improving an EXISTING recipe the user already has. Keep their intent, quantities and identity. Fill obvious gaps (missing per-step times, a short description, storage notes), tidy the wording and step order, and make the instructions clear. Do not invent unusual ingredients or change what the dish is. Return the full improved recipe.`;
  const current = JSON.stringify({
    title: recipe.title, category: recipe.category, description: recipe.description,
    ingredients: recipe.ingredients, equipment: recipe.equipment,
    activeTime: recipe.activeTime, totalTime: recipe.totalTime, steps: recipe.steps, storage: recipe.storage,
  });
  return normalizeRecipe(await callStructured(system, RECIPE_SCHEMA, `Improve and expand this recipe. Return the full recipe as structured data:\n\n${current}`));
}

const TIPS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { notes: { type: 'string' } },
  required: ['notes'],
};

// ---------- Bakes ----------

const BAKE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    category: { type: 'string', enum: BAKE_CATEGORIES },
    bakeDate: { type: 'string' },
    crust: NUM_OR_NULL,
    crumb: NUM_OR_NULL,
    flavour: NUM_OR_NULL,
    overall: NUM_OR_NULL,
    problems: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['name', 'category', 'bakeDate', 'crust', 'crumb', 'flavour', 'overall', 'problems', 'notes'],
};

/** Turn a spoken description of a bake into structured fields. */
export async function buildBakeFromText(text) {
  const today = new Date().toISOString().slice(0, 10);
  const system = `You turn a home baker's freeform description of a bake into structured fields.
Today is ${today}.
Rules:
- name: a short label (e.g. "Everyday sourdough"). category must be exactly one of: ${BAKE_CATEGORIES.join(', ')}.
- bakeDate in YYYY-MM-DD. "today" = ${today}; "yesterday" = the day before. If a date is stated use it; otherwise use today.
- crust, crumb, flavour, overall are 1–5 integer ratings inferred from how the baker describes them (e.g. "great crust" ≈ 5, "a bit dense crumb" ≈ 2). Use null for any not mentioned.
- problems: choose from ${BAKE_PROBLEMS.join(', ')} where they fit; short custom phrases are allowed if clearly stated. [] if none.
- notes: anything else worth keeping, else "".
Never ask questions.`;
  return normalizeBake(await callStructured(system, BAKE_SCHEMA, `Build a bake from this description:\n\n${text}`));
}

/** Coerce arbitrary AI output onto a fresh bake (pure, testable). */
export function normalizeBake(ai, now = new Date()) {
  const obj = ai && typeof ai === 'object' ? ai : {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);
  const rating = (v) => (Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : undefined);
  const today = now.toISOString().slice(0, 10);
  const b = newBake(now);
  if (str(obj.name)) b.name = str(obj.name);
  b.category = BAKE_CATEGORIES.includes(obj.category) ? obj.category : 'Sourdough';
  const validDate = typeof obj.bakeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.bakeDate) && !Number.isNaN(new Date(obj.bakeDate).getTime());
  b.bakeDate = validDate ? obj.bakeDate : today;
  b.ratings = { crust: rating(obj.crust), crumb: rating(obj.crumb), flavour: rating(obj.flavour), overall: rating(obj.overall) };
  b.problems = arr(obj.problems);
  b.notes = str(obj.notes);
  return b;
}

/** Suggest a few practical tips for a batch's setup, as a plain-text notes string. */
export async function buildBatchTips(batch) {
  const system = `You are a friendly fermentation assistant. Given a vegetable-ferment batch's setup as JSON, write 2 to 4 short, practical tips as ONE plain-text notes string (no markdown, no headings; separate tips with line breaks). Base them on the brine strength, temperature, vegetable and equipment. Be specific and encouraging. Do not make safety or medical guarantees. Never ask questions.`;
  const s = Number(batch.saltGrams);
  const w = Number(batch.waterMl);
  const brinePercent = (s > 0 && w > 0) ? Number((s / (s + w) * 100).toFixed(1)) : null;
  const info = JSON.stringify({
    vegetable: batch.vegetable, brinePercent, roomTempC: batch.roomTempC,
    jarSizeMl: batch.jarSizeMl, additions: batch.additions, lidType: batch.lidType, weightType: batch.weightType,
  });
  const out = await callStructured(system, TIPS_SCHEMA, `Give tips for this batch:\n\n${info}`);
  return out && typeof out.notes === 'string' ? out.notes.trim() : '';
}
