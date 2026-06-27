/**
 * Cloudflare Configuration Helper
 * Loads Cloudflare API credentials for file-security workflows.
 */

import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
  override: false,
});

export function getCloudflareConfig(options = {}) {
  const apiToken =
    options.apiToken ||
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CLOUDFLARE_TOKEN ||
    '';

  return {
    apiToken,
    accountId: options.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '',
    zoneId: options.zoneId || process.env.CLOUDFLARE_ZONE_ID || '',
    email: options.email || process.env.CLOUDFLARE_EMAIL || '',
    isConfigured: Boolean(apiToken),
  };
}

export default {
  getCloudflareConfig,
};