const { GoogleGenAI } = require('@google/genai');

let aiInstance = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'replace_with_gemini_api_key' || apiKey.trim() === '') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey
    });
  }
  return aiInstance;
}

function isGeminiConfigured() {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'replace_with_gemini_api_key' && apiKey.trim() !== '');
}

module.exports = {
  getGeminiClient,
  isGeminiConfigured
};
