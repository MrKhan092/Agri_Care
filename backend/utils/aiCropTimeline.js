const Groq = require('groq-sdk');

/**
 * Generate a crop care timeline using Groq AI for crops not in the static database.
 */
async function generateCropTimelineWithAI(cropName) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an Indian agricultural expert. Generate a realistic stage-by-stage care timeline for growing "${cropName}" in India.

Return ONLY a valid JSON array of 6-10 stage objects, each with:
{
  "stageName": "string (concise stage name)",
  "daysFromSowing": number (day offset from sowing/transplanting, 0 = sowing day),
  "description": "string (practical advice, 1-2 sentences, mention specific products/dosages where applicable)",
  "category": "irrigation" | "fertilizer" | "pest-control" | "general" | "harvest"
}

Rules:
- Include stages covering the full crop cycle from sowing to harvest
- Use realistic timings based on standard Indian agricultural practice
- Include at least one stage each for irrigation, fertilizer, and pest-control
- End with a harvest stage
- Return ONLY the JSON array, no explanations or markdown`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const responseText = completion.choices[0]?.message?.content || '';

  // Extract JSON array from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON array');
  }

  const stages = JSON.parse(jsonMatch[0]);

  // Validate structure
  const validCategories = ['irrigation', 'fertilizer', 'pest-control', 'general', 'harvest'];
  return stages
    .filter((s) => s.stageName && typeof s.daysFromSowing === 'number' && s.description)
    .map((s) => ({
      stageName: s.stageName,
      daysFromSowing: s.daysFromSowing,
      description: s.description,
      category: validCategories.includes(s.category) ? s.category : 'general',
    }))
    .sort((a, b) => a.daysFromSowing - b.daysFromSowing);
}

module.exports = { generateCropTimelineWithAI };
