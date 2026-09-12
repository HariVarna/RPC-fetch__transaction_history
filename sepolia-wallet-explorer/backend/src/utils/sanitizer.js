/**
 * Sanitizes strings, URLs, and errors to prevent leaking RPC credentials,
 * API keys, or sensitive environment values in logs and HTTP responses.
 */

const getSensitivePatterns = () => {
  const patterns = [];
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (rpcUrl) {
    patterns.push(rpcUrl);
    try {
      const parsed = new URL(rpcUrl);
      // If the URL has an API key in the pathname (e.g., /v2/apiKey or /v3/apiKey)
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      for (const seg of pathSegments) {
        if (seg.length >= 16) { // Common length for Infura/Alchemy API keys
          patterns.push(seg);
        }
      }
      // If there are query parameters (e.g. ?apikey=...)
      if (parsed.search) {
        patterns.push(parsed.search);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  return patterns;
};

/**
 * Redacts known sensitive patterns from any string or error message.
 * 
 * @param {string|Error} input
 * @returns {string} Sanitized string
 */
const sanitize = (input) => {
  if (!input) return '';
  let str = typeof input === 'string' ? input : (input.message || String(input));
  
  const patterns = getSensitivePatterns();
  for (const pattern of patterns) {
    if (pattern && pattern.length > 3) {
      str = str.split(pattern).join('[REDACTED_CREDENTIAL]');
    }
  }

  // Generic hex API key / token sanitizer (e.g. 32-64 hex chars in URL paths)
  str = str.replace(/(https?:\/\/[^\s/]+(?:\/[^\s/]+)*\/)([a-f0-9]{32,64})/gi, '$1[REDACTED_KEY]');

  return str;
};

/**
 * Safe logger that ensures no RPC credentials are logged to console.
 */
const safeLogger = {
  log: (...args) => {
    console.log(...args.map(a => (typeof a === 'string' || a instanceof Error ? sanitize(a) : a)));
  },
  warn: (...args) => {
    console.warn(...args.map(a => (typeof a === 'string' || a instanceof Error ? sanitize(a) : a)));
  },
  error: (...args) => {
    console.error(...args.map(a => (typeof a === 'string' || a instanceof Error ? sanitize(a) : a)));
  }
};

module.exports = {
  sanitize,
  safeLogger
};
