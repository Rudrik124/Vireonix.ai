/**
 * OpenAI Moderation Configuration Helper
 * Loads the moderation API key for prompt-security workflows only.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export { getOpenAIModerationConfig };