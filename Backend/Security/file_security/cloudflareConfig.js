/**
 * Cloudflare Configuration Helper
 * Loads Cloudflare API credentials for file-security workflows.
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
  override: false
});

function getCloudflareConfig(options = {}) {
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
    isConfigured: Boolean(apiToken)
  };
}

module.exports = {
  getCloudflareConfig
};