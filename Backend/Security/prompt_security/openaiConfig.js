/**
 * OpenAI Moderation Configuration Helper
 * Loads the moderation API key for prompt-security workflows only.
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
  override: false
});

function getOpenAIModerationConfig(options = {}) {
  const apiKey =
    options.apiKey ||
    process.env.OPENAI_MODERATION_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  return {
    apiKey,
    model: options.model || process.env.OPENAI_MODERATION_MODEL || 'omni-moderation-latest',
    isConfigured: Boolean(apiKey)
  };
}

module.exports = {
  getOpenAIModerationConfig
};