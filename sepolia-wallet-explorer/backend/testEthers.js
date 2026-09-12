require('dotenv').config();
const { getProvider } = require('./src/services/rpcService');

async function testBlock() {
  try {
    const provider = getProvider();
    const block = await provider.getBlock(6000000, true);
    console.log("Block keys:", Object.keys(block));
    console.log("Has prefetchedTransactions?", !!block.prefetchedTransactions);
    if (block.prefetchedTransactions && block.prefetchedTransactions.length > 0) {
      const tx = block.prefetchedTransactions[0];
      console.log("Tx keys:", Object.keys(tx));
      console.log("Tx from:", tx.from);
      console.log("Tx to:", tx.to);
      console.log("Tx hash:", tx.hash);
      console.log("Tx type:", tx.type);
      console.log("Tx index:", tx.index);
      console.log("Tx value:", typeof tx.value, tx.value.toString());
      console.log("Tx data:", tx.data);
    } else {
      console.log("No transactions found in this block or not prefetched.");
    }
  } catch (err) {
    console.error(err);
  }
}
testBlock();
