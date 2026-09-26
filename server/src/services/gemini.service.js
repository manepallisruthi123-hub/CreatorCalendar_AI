const { getGeminiClient, isGeminiConfigured } = require('../config/gemini');

/**
 * Extracts and cleans JSON string from AI response, removing markdown code blocks
 */
function cleanJsonOutput(text) {
  if (!text) return '{}';
  let cleaned = text.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    return match[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1).trim();
  }
  return cleaned;
}

/**
 * Calls Gemini with automatic JSON parsing and Zod schema validation.
 * Retries once with a correction prompt if validation fails.
 * Automatically tries fallback models if quota (429) or high demand (503) occurs.
 */
async function callGeminiStructured({ systemPrompt, userPrompt, schema, modelName }) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API is not configured. Set GEMINI_API_KEY in server environment.');
  }

  const candidateModels = modelName
    ? [modelName, 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
    : ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

  const fullPrompt = `${systemPrompt}\n\nIMPORTANT: Return ONLY valid, raw JSON matching the required schema. Do not include markdown code fences or any conversational filler.\n\n${userPrompt}`;

  let lastError = null;

  for (const model of candidateModels) {
    let attempts = 0;
    let currentPrompt = fullPrompt;

    while (attempts < 2) {
      attempts++;
      try {
        const response = await client.models.generateContent({
          model,
          contents: currentPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const responseText = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text);
        if (!responseText) {
          throw new Error('Empty response from Gemini API');
        }

        const cleaned = cleanJsonOutput(responseText);
        const parsed = JSON.parse(cleaned);

        // Validate with Zod
        const validated = schema.parse(parsed);
        return validated;
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiStructured] Model ${model} attempt ${attempts} failed:`, err.message);

        // If rate limit (429) or model busy (503), failover to next model
        if (err.message && (err.message.includes('429') || err.message.includes('503') || err.message.includes('Quota exceeded'))) {
          break;
        }

        if (attempts < 2) {
          currentPrompt = `${fullPrompt}\n\nATTENTION: The previous response failed validation with error: "${err.message}". Please strictly adhere to the required JSON schema without any surrounding text.`;
        }
      }
    }
  }

  throw new Error(`AI structured generation failed: ${lastError?.message}`);
}

module.exports = {
  callGeminiStructured,
  cleanJsonOutput,
  isGeminiConfigured
};
