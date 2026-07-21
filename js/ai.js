// ai.js — optional AI assistant for building recipes and batches.
// Calls the Anthropic Messages API directly from the browser using the user's
// own API key (stored only on this device). Needs internet and a key; only the
// text the user describes is sent. Everything else in the app stays on-device.
import { RECIPE_CATEGORIES, newRecipe, newBatch, LID_TYPES, WEIGHT_TYPES } from './model.js';

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
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your internet connection.');
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
  required: ['name', 'vegetable', 'saltGrams', 'waterMl', 'roomTempC', 'jarSizeMl', 'additions', 'vesselType', 'lidType', 'weightType', 'remindEveryDays'],
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
- name: a short label if given, else "". vegetable: what is being fermented (e.g. "Carrot sticks"); if not stated, "".
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
  if (str(obj.vegetable)) b.vegetable = str(obj.vegetable);
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
