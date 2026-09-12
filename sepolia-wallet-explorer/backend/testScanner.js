require('dotenv').config();
const { scanBlocksForAddress } = require('./src/services/blockScanner');

async function runTest() {
  const address = '0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c'; // Known "to" address in block 6000000
  const startBlock = 6000000;
  const endBlock = 6000000;

  console.log(`Starting scan for address ${address} from block ${startBlock} to ${endBlock}...`);
  
  try {
    const results = await scanBlocksForAddress({
      address,
      startBlock,
      endBlock,
      onProgress: (progress) => {
        console.log(`Progress: ${progress.percentageComplete}% (Block ${progress.currentBlock}, Matches: ${progress.matchingTransactionsCount})`);
      }
    });

    console.log('--- SCAN COMPLETE ---');
    console.log(`Total matching transactions: ${results.length}`);
    
    if (results.length > 0) {
      console.log('First match:', results[0]);
    } else {
      console.log('No matches found (which is unexpected for this test).');
      process.exit(1);
    }
    
    // Verify an unrelated address finds nothing
    console.log('\n--- Scanning for unrelated address ---');
    const unrelatedAddress = '0x000000000000000000000000000000000000dEaD';
    const unrelatedResults = await scanBlocksForAddress({
      address: unrelatedAddress,
      startBlock: 6000000,
      endBlock: 6000000
    });
    console.log(`Total matching for unrelated: ${unrelatedResults.length}`);
    if (unrelatedResults.length !== 0) {
      console.log('Unrelated address test failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

runTest();
