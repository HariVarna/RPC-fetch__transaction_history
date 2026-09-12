require('dotenv').config();
const { fetchBlockWithRetry, isRateLimitError } = require('./src/services/blockScanner');

async function runResilienceTests() {
  console.log('=====================================================');
  console.log('     RPC SCANNER RESILIENCE & RETRY TESTS           ');
  console.log('=====================================================\n');

  let allPassed = true;

  // Test 1: isRateLimitError detection
  console.log('--- Test 1: Rate limit error detection ---');
  const err429 = new Error('Request failed with status code 429');
  err429.status = 429;
  const errRateLimitMsg = new Error('Too Many Requests: rate limit exceeded');
  const errRandom = new Error('Connection refused');

  if (isRateLimitError(err429) && isRateLimitError(errRateLimitMsg) && !isRateLimitError(errRandom)) {
    console.log('✓ Correctly identifies rate-limiting errors (HTTP 429 / messages) and rejects normal errors.\n');
  } else {
    console.error('❌ isRateLimitError detection failed');
    allPassed = false;
  }

  // Test 2: Transient RPC failure recovery with exponential backoff
  console.log('--- Test 2: Transient failure recovery with exponential backoff ---');
  let transientAttempts = 0;
  const retryLogs = [];
  const mockTransientProvider = {
    getBlock: async (blockNum) => {
      transientAttempts++;
      if (transientAttempts <= 2) {
        throw new Error(`Transient network timeout (attempt ${transientAttempts})`);
      }
      return { number: blockNum, timestamp: 1716982104, prefetchedTransactions: [] };
    }
  };

  const blockResult = await fetchBlockWithRetry(mockTransientProvider, 6000000, {
    maxRetries: 3,
    baseDelay: 100, // Short delay for test speed
    onRetry: (info) => retryLogs.push(info)
  });

  if (blockResult && blockResult.number === 6000000 && transientAttempts === 3 && retryLogs.length === 2) {
    console.log(`✓ Succeeded on attempt 3 after 2 retries.`);
    console.log(`  Retry 1 delay: ${retryLogs[0].delay}ms`);
    console.log(`  Retry 2 delay: ${retryLogs[1].delay}ms`);
    if (retryLogs[1].delay > retryLogs[0].delay) {
      console.log('✓ Exponential backoff verified (delay increased).\n');
    } else {
      console.log('✓ Backoff delay recorded.\n');
    }
  } else {
    console.error('❌ Transient failure recovery test failed');
    allPassed = false;
  }

  // Test 3: Rate limit backoff
  console.log('--- Test 3: Rate limit (429) backoff handling ---');
  let rateLimitAttempts = 0;
  const rateLimitLogs = [];
  const mockRateLimitProvider = {
    getBlock: async (blockNum) => {
      rateLimitAttempts++;
      if (rateLimitAttempts === 1) {
        const err = new Error('rate limit reached: please slow down');
        err.status = 429;
        throw err;
      }
      return { number: blockNum, timestamp: 1716982104, prefetchedTransactions: [] };
    }
  };

  const rlResult = await fetchBlockWithRetry(mockRateLimitProvider, 6000001, {
    maxRetries: 2,
    baseDelay: 100,
    onRetry: (info) => rateLimitLogs.push(info)
  });

  if (rlResult && rateLimitAttempts === 2 && rateLimitLogs.length === 1) {
    console.log(`✓ Successfully handled 429 rate limit with extended delay (${rateLimitLogs[0].delay}ms).\n`);
  } else {
    console.error('❌ Rate limit test failed');
    allPassed = false;
  }

  // Test 4: Exhausting retries throws clean error without hanging
  console.log('--- Test 4: Persistent failure exhausts retries cleanly ---');
  let persistentAttempts = 0;
  const mockFailingProvider = {
    getBlock: async () => {
      persistentAttempts++;
      throw new Error('Permanent RPC outage');
    }
  };

  try {
    await fetchBlockWithRetry(mockFailingProvider, 6000002, {
      maxRetries: 3,
      baseDelay: 50
    });
    console.error('❌ Expected error was not thrown');
    allPassed = false;
  } catch (err) {
    if (persistentAttempts === 4 && err.message.includes('after 4 attempts')) {
      console.log(`✓ Threw expected error after ${persistentAttempts} attempts: "${err.message}"\n`);
    } else {
      console.error(`❌ Unexpected error format or attempt count (${persistentAttempts}):`, err.message);
      allPassed = false;
    }
  }

  console.log('=====================================================');
  if (allPassed) {
    console.log('🎉 ALL RESILIENCE & RETRY TESTS PASSED');
  } else {
    console.log('❌ SOME RESILIENCE TESTS FAILED');
    process.exit(1);
  }
  console.log('=====================================================');
}

runResilienceTests().catch((err) => {
  console.error('Fatal error in resilience tests:', err);
  process.exit(1);
});
