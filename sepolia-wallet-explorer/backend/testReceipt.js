require('dotenv').config();
const { getProvider } = require('./src/services/rpcService');

async function testReceipt() {
  try {
    const provider = getProvider();
    const hash = '0xc62d961108ac699b05b310e82e282e042600ab3442c073f35af0a99a035c453f'; // From block 6000000
    const receipt = await provider.getTransactionReceipt(hash);
    console.log("Receipt keys:", Object.keys(receipt));
    console.log("Status:", receipt.status);
    console.log("Gas used:", receipt.gasUsed ? receipt.gasUsed.toString() : 'null');
    console.log("Gas price:", receipt.gasPrice ? receipt.gasPrice.toString() : 'null');
    console.log("Contract Address:", receipt.contractAddress);
    console.log("Logs count:", receipt.logs ? receipt.logs.length : 0);
  } catch (err) {
    console.error(err);
  }
}
testReceipt();
