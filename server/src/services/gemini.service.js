const { getGeminiClient, isGeminiConfigured } = require('../config/gemini');

/**
 * Extracts and cleans JSON string from AI response, removing markdown code blocks
 */
function cleanJsonOutput(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Calls Gemini with automatic JSON parsing and Zod schema validation.
 * Retries once with a correction prompt if validation fails.
 */
async function callGeminiStructured({ systemPrompt, userPrompt, schema, modelName = 'gemini-2.5-flash' }) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API is not configured. Set GEMINI_API_KEY in server environment.');
  }

  const fullPrompt = `${systemPrompt}\n\nIMPORTANT: Return ONLY valid, raw JSON matching the required schema. Do not include markdown code fences or any conversational filler.\n\n${userPrompt}`;

  let attempts = 0;
  let lastError = null;
  let currentPrompt = fullPrompt;

  while (attempts < 2) {
    attempts++;
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: currentPrompt
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
      console.warn(`[GeminiStructured] Attempt ${attempts} failed:`, err.message);

      if (attempts < 2) {
        // Retry with correction prompt
        currentPrompt = `${fullPrompt}\n\nATTENTION: The previous response failed validation with error: "${err.message}". Please strictly adhere to the required JSON schema without any surrounding text.`;
      }
    }
  }

  throw new Error(`AI structured generation failed after 2 attempts: ${lastError.message}`);
}

module.exports = {
  callGeminiStructured,
  cleanJsonOutput,
  isGeminiConfigured
};
