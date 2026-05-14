const fetch = require('node-fetch');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_BASE = 'https://api.anthropic.com';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function aiRequest(prompt, maxTokens = 800) {
  if (!ANTHROPIC_API_KEY) {
    return Promise.reject(new Error('Anthropic API key not configured'));
  }

  const url = `${API_BASE}/v1/complete`;
  const body = {
    model: CLAUDE_MODEL,
    prompt,
    max_tokens_to_sample: maxTokens,
    temperature: 0.2,
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANTHROPIC_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .then((j) => {
      // Claude returns `completion` field in older API
      if (j && typeof j.completion === 'string') return j.completion;
      // Newer responses may have `completion` nested differently
      if (j && j.choices && j.choices[0] && j.choices[0].text) return j.choices[0].text;
      if (j && j.output && j.output[0] && j.output[0].content && j.output[0].content[0]) {
        return j.output[0].content[0].text || '';
      }
      return '';
    });
}

async function classifyParcel(description) {
  const fallback = {
    itemCategory: 'other',
    urgency: 'MEDIUM',
    estimatedSize: 'small',
    specialHandling: null,
    shortLabel: 'Parcel delivery',
  };

  if (typeof description !== 'string' || description.trim().length === 0) {
    return fallback;
  }

  const system = `You are a parcel classification AI for KhatKhat, a hyperlocal delivery service in Goa, India. Extract structured information from the sender's natural language description of their parcel. Respond ONLY with valid JSON. No explanation, no markdown, no backticks.`;

  const user = `Classify this parcel description and return a JSON object with exactly these fields:\n{\n  itemCategory: one of [document, medicine, electronics, food, clothing, keys, other],\n  urgency: one of [LOW, MEDIUM, HIGH, CRITICAL],\n  estimatedSize: one of [small, medium, large],\n  specialHandling: string or null,\n  shortLabel: string (3-5 word label)\n}\n\nRules:\n- medicine -> at minimum HIGH urgency unless sender says 'no rush'\n- CRITICAL = life-dependent\n- keys or phone charger -> MEDIUM\n- regular documents -> LOW or MEDIUM\n- food -> HIGH\n- 'forgotten' or 'urgent' keywords -> bump urgency one level up\n\nDescription: ${description}`;

  const prompt = `${system}\n\n${user}`;

  try {
    const text = await aiRequest(prompt, 400);
    const json = safeJsonParse(text.trim());
    if (!json) return fallback;

    // Validate fields
    const allowedCategories = ['document', 'medicine', 'electronics', 'food', 'clothing', 'keys', 'other'];
    const allowedUrgency = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const allowedSizes = ['small', 'medium', 'large'];

    const out = {
      itemCategory: allowedCategories.includes(json.itemCategory) ? json.itemCategory : 'other',
      urgency: allowedUrgency.includes(json.urgency) ? json.urgency : 'MEDIUM',
      estimatedSize: allowedSizes.includes(json.estimatedSize) ? json.estimatedSize : 'small',
      specialHandling: typeof json.specialHandling === 'string' ? json.specialHandling : null,
      shortLabel: typeof json.shortLabel === 'string' && json.shortLabel.trim().length ? json.shortLabel.trim() : 'Parcel delivery',
    };

    return out;
  } catch (error) {
    console.error('classifyParcel error:', error.message);
    return fallback;
  }
}

async function optimizeRelay(parcel, carriers) {
  // carriers: array with uid, name, trustScore, currentLat, currentLng, destinationLat, destinationLng
  if (!Array.isArray(carriers) || carriers.length === 0) return null;

  const fallback = null;

  const system = `You are a route optimization AI for KhatKhat, a parcel relay delivery service. You find the optimal two-person relay chain to move a parcel from A to B. Respond ONLY with valid JSON. No explanation, no markdown.`;

  const carriersText = carriers
    .map((c, i) => `Carrier ${i + 1}: id=${c.uid}, name=${c.name}, trustScore=${c.trustScore}, currentLocation=(${c.currentLat},${c.currentLng}), heading to (${c.destinationLat},${c.destinationLng})`)
    .join('\n');

  const user = `Find the optimal relay handoff point and carrier assignments for this delivery.\n\nPARCEL:\n- From: (${parcel.pickupLat}, ${parcel.pickupLng}) — ${parcel.pickupAddress}\n- To: (${parcel.dropLat}, ${parcel.dropLng}) — ${parcel.dropAddress}\n- Urgency: ${parcel.urgency}\n- Distance: ${parcel.distanceKm}km\n\nAVAILABLE CARRIERS:\n${carriersText}\n\nReturn JSON:\n{\n  carrier1Id: string,\n  carrier2Id: string,\n  relayPointLat: number,\n  relayPointLng: number,\n  relayPointDescription: string,\n  reasoning: string\n}`;

  const prompt = `${system}\n\n${user}`;

  try {
    const text = await aiRequest(prompt, 600);
    const json = safeJsonParse(text.trim());
    if (!json) return fallback;

    if (json.carrier1Id && (json.carrier2Id || json.carrier2Id === null) && typeof json.relayPointLat === 'number' && typeof json.relayPointLng === 'number') {
      return json;
    }

    return fallback;
  } catch (error) {
    console.error('optimizeRelay error:', error.message);
    return fallback;
  }
}

async function generateETA(parcel, currentCarrierLat, currentCarrierLng, stage) {
  const fallback = { estimatedMinutes: Math.round((parcel.distanceKm || 1) * 4 + 5), confidence: 'low' };

  if (!parcel || typeof currentCarrierLat !== 'number' || typeof currentCarrierLng !== 'number') return fallback;

  const system = `You are a delivery time estimator for KhatKhat in Goa, India. Respond ONLY with a JSON object.`;

  const destinationLat = stage === 'to_pickup' ? parcel.pickupLat : stage === 'to_drop' ? parcel.dropLat : parcel.relayPointLat || parcel.dropLat;
  const destinationLng = stage === 'to_pickup' ? parcel.pickupLng : stage === 'to_drop' ? parcel.dropLng : parcel.relayPointLng || parcel.dropLng;

  const straightLineKm = Math.max(0.1, Math.hypot((currentCarrierLat - destinationLat) || 0, (currentCarrierLng - destinationLng) || 0) * 111); // approx

  const user = `Estimate delivery time in minutes.\nStage: ${stage}\nCarrier current location: (${currentCarrierLat}, ${currentCarrierLng})\nDestination: (${destinationLat}, ${destinationLng})\nStraight-line distance: ${straightLineKm.toFixed(2)}km\nUrgency: ${parcel.urgency}\nReturn: { estimatedMinutes: number, confidence: 'low'|'medium'|'high' }`;

  const prompt = `${system}\n\n${user}`;

  try {
    const text = await aiRequest(prompt, 200);
    const json = safeJsonParse(text.trim());
    if (!json || typeof json.estimatedMinutes !== 'number') return fallback;

    const confidence = ['low', 'medium', 'high'].includes(json.confidence) ? json.confidence : 'low';
    return { estimatedMinutes: Math.round(json.estimatedMinutes), confidence };
  } catch (error) {
    console.error('generateETA error:', error.message);
    return fallback;
  }
}

async function generateFallbackMessage(parcel) {
  const fallback = "No carrier is available right now. Try calling a local auto-rickshaw or ask a trusted neighbour. We'll keep searching and notify you when someone's available.";

  if (!parcel) return fallback;

  const system = `You are a helpful assistant for KhatKhat delivery app in Goa, India. When no carrier is available, suggest practical local alternatives. Be concise, warm, and specific to Goa. Respond in plain text, 2-3 sentences max.`;

  const user = `No delivery carrier is currently available for this parcel.\nItem: ${parcel.shortLabel || parcel.itemCategory}\nUrgency: ${parcel.urgency}\nPickup area: ${parcel.pickupAddress}\nDrop area: ${parcel.dropAddress}\n\nSuggest 1-2 practical alternatives the sender can try right now in Goa.`;

  const prompt = `${system}\n\n${user}`;

  try {
    const text = await aiRequest(prompt, 150);
    if (!text || !text.trim()) return fallback;
    // Return first 2 sentences max
    const s = text.trim().replace(/\n+/g, ' ');
    const sentences = s.match(/[^\.\!\?]+[\.\!\?]+/g) || [s];
    return sentences.slice(0, 2).join(' ').trim();
  } catch (error) {
    console.error('generateFallbackMessage error:', error.message);
    return fallback;
  }
}

module.exports = {
  classifyParcel,
  optimizeRelay,
  generateETA,
  generateFallbackMessage,
};