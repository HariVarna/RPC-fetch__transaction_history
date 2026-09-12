require('dotenv').config();
const { fetchWalletTransactions } = require('./src/services/transactionService');
const blockScanner = require('./src/services/blockScanner');
const rpcService = require('./src/services/rpcService');

async function runTests() {
  console.log('--- Testing Transaction Service Receipt Fetching ---');
  
  // Save original functions
  const originalScan = blockScanner.scanBlocksForAddress;
  const originalReceipt = rpcService.getTransactionReceipt;

  // Mock scanner to return specific transactions
  blockScanner.scanBlocksForAddress = async () => [
    { hash: '0xc62d961108ac699b05b310e82e282e042600ab3442c073f35af0a99a035c453f', mockName: 'Real Successful Tx' }, // This one is real on Sepolia
    { hash: '0xfailedTxMock', mockName: 'Mock Failed Tx' },
    { hash: '0xmissingTxMock', mockName: 'Mock Missing/Null Tx' }
  ];

  // Mock receipt fetcher for the specific test cases
  rpcService.getTransactionReceipt = async (hash) => {
    if (hash === '0xc62d961108ac699b05b310e82e282e042600ab3442c073f35af0a99a035c453f') {
      return { 
        status: 1, 
        gasUsed: 21000n, 
        gasPrice: 140592799536n, 
        contractAddress: null, 
        logs: [] 
      };
    }
    if (hash === '0xfailedTxMock') {
      return { 
        status: 0, 
        gasUsed: 50000n, 
        gasPrice: 1500000000n, 
        contractAddress: '0xMockContract', 
        logs: ['log1'] 
      };
    }
    if (hash === '0xmissingTxMock') {
      return null;
    }
  };

  try {
    const results = await fetchWalletTransactions({
      address: '0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c',
      startBlock: 6000000,
      endBlock: 6000000
    });

    console.log(JSON.stringify(results, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2)
    );

    const successTx = results.find(r => r.hash === '0xc62d961108ac699b05b310e82e282e042600ab3442c073f35af0a99a035c453f');
    const failedTx = results.find(r => r.hash === '0xfailedTxMock');
    const missingTx = results.find(r => r.hash === '0xmissingTxMock');

    if (successTx.status !== 'SUCCESS') throw new Error('Real Tx should be SUCCESS');
    if (failedTx.status !== 'FAILED') throw new Error('Failed Tx should be FAILED');
    if (missingTx.status !== 'NULL_RECEIPT') throw new Error('Missing Tx should be NULL_RECEIPT');
    
    console.log('\n✅ All tests passed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    // Restore originals
    blockScanner.scanBlocksForAddress = originalScan;
    rpcService.getTransactionReceipt = originalReceipt;
  }
}

runTests();
