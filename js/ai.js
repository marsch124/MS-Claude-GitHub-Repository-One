// ai.js — optional AI recipe builder.
// Calls the Anthropic Messages API directly from the browser using the user's
// own API key (stored only on this device). Needs internet and a key; only the
// text the user describes is sent. Everything else in the app stays on-device.
import { RECIPE_CATEGORIES, newRecipe } from './model.js';

const KEY_STORAGE = 'fermentlog-anthropic-key';
const RECIPE_MODEL = 'claude-opus-4-8';

export function getApiKey() { try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; } }
export function setApiKey(k) {
  try { const v = (k || '').trim(); if (v) localStorage.setItem(KEY_STORAGE, v); else localStorage.removeItem(KEY_STORAGE); } catch {}
}
export function hasApiKey() { return !!getApiKey(); }

// Structured-output schema — guarantees the model returns a valid recipe shape.
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
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          time: { type: 'string' },
        },
        required: ['title', 'detail', 'time'],
      },
    },
    storage: { type: 'string' },
  },
  required: ['title', 'category', 'description', 'ingredients', 'equipment', 'activeTime', 'totalTime', 'steps', 'storage'],
};

const SYSTEM = `You turn a home cook's freeform description of a fermentation or baking recipe into a structured recipe.
Rules:
- Keep the user's own quantities, temperatures and times exactly as given. Do not invent ingredients or steps that aren't implied.
- category must be exactly one of: ${RECIPE_CATEGORIES.join(', ')}. Pick the best fit; use "Other" if unsure.
- Break the method into clear, ordered steps. Each step has a short title, an optional detail, and a time string (e.g. "4-6 h", "overnight", "20 min") when one is given; use "" when no time was mentioned.
- ingredients and equipment are arrays of short strings, one item each.
- activeTime is hands-on time; totalTime is start to finish. Use "" if not stated.
- storage: any notes about keeping or storing the result, else "".
- If the description is sparse, fill what you can and leave the rest as empty strings or arrays. Never ask questions.`;

/** Send a freeform description to Claude and get back a structured recipe object. */
export async function buildRecipeFromText(text) {
  const key = getApiKey();
  if (!key) throw new Error('No API key set. Add one in Settings → AI recipe assistant.');

  const body = {
    model: RECIPE_MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
    messages: [{ role: 'user', content: `Build a recipe from this description:\n\n${text}` }],
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
    if (res.status === 401) msg = 'That API key was rejected. Check it in Settings → AI recipe assistant.';
    else if (res.status === 429) msg = 'Rate limited — please wait a moment and try again.';
    throw new Error(msg);
  }

  const data = await res.json();
  const out = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return normalizeRecipe(extractJSON(out));
}

/** Parse the model's JSON, tolerating stray prose or code fences. */
export function extractJSON(s) {
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  throw new Error('The AI response could not be read. Please try again.');
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
