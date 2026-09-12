require('dotenv').config();
const { scanBlocksForAddress } = require('./src/services/blockScanner');

async function runBenchmark() {
  console.log('=====================================================');
  console.log('    RPC SCANNER PERFORMANCE & CONCURRENCY BENCHMARK  ');
  console.log('=====================================================\n');

  const address = '0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c';
  // Scan 10 blocks: 6000000 to 6000009
  const startBlock = 6000000;
  const endBlock = 6000009;
  const totalBlocks = endBlock - startBlock + 1;

  console.log(`Target Address: ${address}`);
  console.log(`Block Range:    ${startBlock} -> ${endBlock} (${totalBlocks} blocks)\n`);

  // 1. Sequential Scanning (concurrency: 1)
  console.log('--- 1. Running Sequential Scan (concurrency = 1) ---');
  const seqStart = Date.now();
  const seqResults = await scanBlocksForAddress({
    address,
    startBlock,
    endBlock,
    concurrency: 1,
    onProgress: (p) => {
      process.stdout.write(`\rSequential progress: ${p.percentageComplete}% (${p.processedBlocks}/${p.totalBlocks} blocks)`);
    }
  });
  const seqDuration = Date.now() - seqStart;
  console.log(`\n✓ Sequential completed in: ${seqDuration}ms (${seqResults.length} txs found)\n`);

  // 2. Concurrent Scanning (concurrency = 5)
  console.log('--- 2. Running Concurrent Scan (concurrency = 5) ---');
  const concStart = Date.now();
  const concResults = await scanBlocksForAddress({
    address,
    startBlock,
    endBlock,
    concurrency: 5,
    onProgress: (p) => {
      process.stdout.write(`\rConcurrent progress: ${p.percentageComplete}% (${p.processedBlocks}/${p.totalBlocks} blocks)`);
    }
  });
  const concDuration = Date.now() - concStart;
  console.log(`\n✓ Concurrent completed in: ${concDuration}ms (${concResults.length} txs found)\n`);

  // 3. Compare Results & Speedup
  console.log('--- 3. Verification & Comparison ---');
  const speedup = (seqDuration / concDuration).toFixed(2);
  console.log(`Sequential Time: ${seqDuration}ms`);
  console.log(`Concurrent Time: ${concDuration}ms`);
  console.log(`Speedup Factor:  ${speedup}x faster\n`);

  // Verify counts
  if (seqResults.length !== concResults.length) {
    throw new Error(`Transaction count mismatch! Sequential: ${seqResults.length}, Concurrent: ${concResults.length}`);
  }
  console.log(`✓ Transaction counts match: ${seqResults.length}`);

  // Verify exact hashes & ordering
  for (let i = 0; i < seqResults.length; i++) {
    const s = seqResults[i];
    const c = concResults[i];
    if (s.hash !== c.hash) {
      throw new Error(`Mismatch at index ${i}: sequential=${s.hash}, concurrent=${c.hash}`);
    }
  }
  console.log('✓ All transaction hashes and indices match identically!');

  // Verify ordering: blockNumber ASC, transactionIndex ASC
  for (let i = 0; i < concResults.length - 1; i++) {
    const current = concResults[i];
    const next = concResults[i + 1];
    if (current.blockNumber > next.blockNumber) {
      throw new Error(`Block ordering violation at index ${i}: block ${current.blockNumber} > block ${next.blockNumber}`);
    }
    if (current.blockNumber === next.blockNumber && current.transactionIndex >= next.transactionIndex) {
      throw new Error(`Tx index ordering violation at index ${i}: idx ${current.transactionIndex} >= idx ${next.transactionIndex}`);
    }
  }
  console.log('✓ Verified correct ordering: block number ASC, transaction index ASC.');

  // Verify no duplicate transactions
  const hashSet = new Set();
  for (const tx of concResults) {
    if (hashSet.has(tx.hash)) {
      throw new Error(`Duplicate transaction detected: ${tx.hash}`);
    }
    hashSet.add(tx.hash);
  }
  console.log('✓ Verified no duplicate transactions.');

  console.log('\n=====================================================');
  console.log('🎉 BENCHMARK AND VALIDATION SUCCEEDED');
  console.log('=====================================================');
}

runBenchmark().catch((err) => {
  console.error('\n❌ Benchmark failed:', err);
  process.exit(1);
});
