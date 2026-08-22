const Groq = require('groq-sdk');

const SOIL_PARAMS = ['pH', 'nitrogen', 'phosphorus', 'potassium', 'organicCarbon', 'ec', 'sulphur', 'zinc', 'iron', 'manganese', 'copper', 'boron'];

// llama-3.3-70b-versatile was deprecated by Groq — openai/gpt-oss-120b is the
// current free general-purpose model. Check console.groq.com/docs/models if
// this stops working, Groq's free lineup changes periodically.
const MODEL = 'openai/gpt-oss-120b';

/**
 * AI-powered extraction of soil parameters from raw PDF text using Groq.
 */
async function extractParamsWithAI(rawText) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are a soil report data extractor. Extract numeric soil test parameters from the following text.

Return ONLY a valid JSON object with these keys (use null if not found):
{
  "pH": number or null,
  "nitrogen": number or null (in kg/ha),
  "phosphorus": number or null (in kg/ha),
  "potassium": number or null (in kg/ha),
  "organicCarbon": number or null (in %),
  "ec": number or null (in dS/m),
  "sulphur": number or null (in ppm),
  "zinc": number or null (in ppm),
  "iron": number or null (in ppm),
  "manganese": number or null (in ppm),
  "copper": number or null (in ppm),
  "boron": number or null (in ppm)
}

Important rules:
- Return ONLY the JSON object, no explanations or markdown
- Convert values to the units specified above if they are in different units
- If a parameter appears multiple times, use the most recent or primary value
- OC or Organic Carbon may be listed as percentage
- EC or Electrical Conductivity in dS/m or mmhos/cm (same unit)
- Available N/P/K may be in kg/ha or ppm — convert ppm to kg/ha by multiplying by ~2.24 if needed

Text to extract from:
${rawText.slice(0, 4000)}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
  });

  const responseText = completion.choices[0]?.message?.content || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Strip nulls and non-numeric values
  const result = {};
  for (const key of SOIL_PARAMS) {
    if (parsed[key] !== null && parsed[key] !== undefined && !isNaN(parsed[key])) {
      result[key] = parseFloat(parsed[key]);
    }
  }

  return result;
}

/**
 * Generate a farmer-friendly summary from structured analysis results using Groq.
 */
async function generateFarmerSummary(analysisArray) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const analysisText = analysisArray
    .map((a) => `${a.parameter}: ${a.value} — ${a.rating} (${a.recommendation})`)
    .join('\n');

  const prompt = `You are an agricultural advisor writing for a small-holder Indian farmer. 
Based on this soil test analysis, write a short summary (under 150 words) in warm, plain language.

Group what's fine vs what needs attention. End with 2-4 prioritized action steps.
Don't use technical jargon. Be encouraging but honest.

Soil Analysis:
${analysisText}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Regex-based fallback extractor for when AI is unavailable.
 *
 * IMPORTANT: many soil report PDFs put a parenthetical abbreviation between the
 * label and the value, e.g. "Available Nitrogen (N) 245 kg/ha" — so we can't
 * require only whitespace/colon/equals before the number. Instead we allow up
 * to ~20 non-digit characters (covers "(N)", "(P)", "(OC)", etc.) before the
 * numeric value.
 */
function extractParamsFromText(rawText) {
  const text = rawText.replace(/\s+/g, ' ');
  const result = {};

  const patterns = {
    pH: /\bpH\b[^0-9]{0,20}(\d+\.?\d*)/i,
    nitrogen: /\b(?:nitrogen|available\s*n|avail\.?\s*n)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    phosphorus: /\b(?:phosphorus|available\s*p|avail\.?\s*p|P2O5)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    potassium: /\b(?:potassium|available\s*k|avail\.?\s*k|K2O)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    organicCarbon: /\b(?:organic\s*carbon|OC|org\.?\s*carbon)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    ec: /\b(?:EC|electrical\s*conductivity)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    sulphur: /\b(?:sulphur|sulfur|available\s*s)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    zinc: /\b(?:zinc|Zn)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    iron: /\b(?:iron|Fe)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    manganese: /\b(?:manganese|Mn)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    copper: /\b(?:copper|Cu)\b[^0-9]{0,20}(\d+\.?\d*)/i,
    boron: /\b(?:boron|B)\b[^0-9]{0,20}(\d+\.?\d*)/i,
  };

  for (const [key, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      result[key] = parseFloat(match[1]);
    }
  }

  return result;
}

module.exports = { extractParamsWithAI, generateFarmerSummary, extractParamsFromText };