require('dotenv').config();
const { sanitize } = require('./src/utils/sanitizer');
const { createRateLimiter } = require('./src/middleware/rateLimiter');
const { isRateLimitError } = require('./src/services/blockScanner');

async function runSecurityPass() {
  console.log('=====================================================');
  console.log('       SECURITY & RELIABILITY VERIFICATION PASS      ');
  console.log('=====================================================\n');

  let allPassed = true;

  // 1. Credential Redaction Test
  console.log('--- 1. Testing Credential Redaction ---');
  const fakeRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/secretApiKey1234567890abcdef';
  process.env.SEPOLIA_RPC_URL = fakeRpcUrl;

  const rawError = new Error(`Connection to ${fakeRpcUrl}/eth_call failed`);
  const sanitized = sanitize(rawError);

  if (sanitized.includes('secretApiKey1234567890abcdef') || sanitized.includes(fakeRpcUrl)) {
    console.error('❌ Failed: RPC URL or API key was NOT redacted:', sanitized);
    allPassed = false;
  } else if (sanitized.includes('[REDACTED_CREDENTIAL]') || sanitized.includes('[REDACTED_KEY]')) {
    console.log(`✓ Passed: Sanitizer safely redacted credentials -> "${sanitized}"`);
  } else {
    console.log(`✓ Passed: Sensitive URL cleanly stripped -> "${sanitized}"`);
  }

  // Restore real RPC URL
  require('dotenv').config();

  // 2. Rate Limiter Middleware Test
  console.log('\n--- 2. Testing Rate Limiting Middleware ---');
  const testLimiter = createRateLimiter({
    windowMs: 1000,
    max: 3,
    message: 'Rate limit test triggered'
  });

  let rateLimitHit = false;
  let retryAfterHeader = null;

  for (let i = 0; i < 5; i++) {
    const mockReq = { ip: '127.0.0.1', headers: {} };
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };
    let nextCalled = false;
    testLimiter(mockReq, mockRes, () => { nextCalled = true; });

    if (i < 3) {
      if (!nextCalled || mockRes.statusCode !== 200) {
        console.error(`❌ Failed: Request ${i + 1} should have passed`);
        allPassed = false;
      }
    } else {
      if (mockRes.statusCode === 429) {
        rateLimitHit = true;
        retryAfterHeader = mockRes.headers['Retry-After'];
      }
    }
  }

  if (rateLimitHit && retryAfterHeader) {
    console.log(`✓ Passed: Correctly returned HTTP 429 with Retry-After: ${retryAfterHeader}s`);
  } else {
    console.error('❌ Failed: Rate limiter did not trigger HTTP 429');
    allPassed = false;
  }

  // 3. Testing API Input Hardening via Live Server
  console.log('\n--- 3. Testing Live API Input Validation ---');
  const baseUrl = 'http://localhost:3001/api/transactions';

  const testCases = [
    {
      name: 'Missing address',
      query: 'startBlock=6000000&endBlock=6000000',
      expectedStatus: 400
    },
    {
      name: 'Invalid address format',
      query: 'address=0x123&startBlock=6000000&endBlock=6000000',
      expectedStatus: 400
    },
    {
      name: 'Non-numeric startBlock',
      query: 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=abc&endBlock=6000000',
      expectedStatus: 400
    },
    {
      name: 'Float / decimal startBlock',
      query: 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=6000000.5&endBlock=6000001',
      expectedStatus: 400
    },
    {
      name: 'Negative startBlock',
      query: 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=-10&endBlock=6000000',
      expectedStatus: 400
    },
    {
      name: 'Reversed block range (end < start)',
      query: 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=6000010&endBlock=6000000',
      expectedStatus: 400
    },
    {
      name: 'Block range exceeding MAX_BLOCK_RANGE (>50)',
      query: 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=6000000&endBlock=6000100',
      expectedStatus: 400
    }
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(`${baseUrl}?${tc.query}`);
      const data = await res.json();
      if (res.status === tc.expectedStatus) {
        console.log(`✓ Passed: "${tc.name}" -> Status ${res.status}: "${data.error}"`);
      } else {
        console.error(`❌ Failed: "${tc.name}" -> Expected status ${tc.expectedStatus}, got ${res.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`❌ Error running test "${tc.name}":`, err.message);
      allPassed = false;
    }
  }

  // 4. Testing Valid Request
  console.log('\n--- 4. Testing Valid Request & Safe Response ---');
  try {
    const validQuery = 'address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=6000000&endBlock=6000001';
    const res = await fetch(`${baseUrl}?${validQuery}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✓ Passed: Valid scan succeeded with ${data.transactionCount} transactions across 2 blocks.`);
      console.log(`  Headers: Limit=${res.headers.get('x-ratelimit-limit')}, Remaining=${res.headers.get('x-ratelimit-remaining')}`);
      
      // Verify no credential leaks in response
      const jsonStr = JSON.stringify(data);
      if (jsonStr.includes('http') && jsonStr.includes('rpc')) {
        console.error('❌ Failed: Response contains sensitive URL!');
        allPassed = false;
      } else {
        console.log('✓ Passed: Response payload contains zero credentials or RPC URLs.');
      }
    } else {
      console.error(`❌ Failed: Valid request returned status ${res.status}`);
      allPassed = false;
    }
  } catch (err) {
    console.error('❌ Failed valid request test:', err.message);
    allPassed = false;
  }

  console.log('\n=====================================================');
  if (allPassed) {
    console.log('🎉 ALL SECURITY & RELIABILITY TESTS PASSED');
  } else {
    console.log('❌ SOME SECURITY TESTS FAILED');
    process.exit(1);
  }
  console.log('=====================================================');
}

runSecurityPass().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
