# Sepolia Wallet Transaction Explorer

A high-performance, full-stack web application designed to retrieve, inspect, and analyze historical transactions for Ethereum Sepolia wallet addresses directly via Ethereum JSON-RPC without relying on centralized proprietary indexing providers (such as Etherscan or Covalent).

---

## 1. Project Overview

The **Sepolia Wallet Transaction Explorer** connects directly to an Ethereum node or RPC provider via standard JSON-RPC 2.0 to scan blockchain blocks, extract transactions associated with a user-supplied Sepolia address (`from` or `to`), verify transaction receipts for execution status (`SUCCESS` or `FAILED`), and display formatted transaction details in a modern, responsive web dashboard.

### Key Capabilities
- **Pure JSON-RPC Blockchain Scanning**: Direct communication with Sepolia RPC nodes using `ethers.js`.
- **Receipt Status Resolution**: Accurately differentiates between successful (`0x1`) and reverted (`0x0`) transactions.
- **Robust RPC Resilience**: Built-in concurrency batching, exponential backoff with jitter, request timeouts, and rate-limit detection (`HTTP 429`).
- **Security Hardening**: Strict checksum and address validation, block range boundaries, sliding-window API rate limiting, and automatic RPC credential redaction in logs and error responses.
- **Interactive Web Interface**: Built with React, Vite, and Tailwind CSS, featuring real-time loading spinners, responsive grid layouts, and empty-state messaging.

---

## 2. Architecture

### System Flowchart

```
User Enters Sepolia Address & Block Range
                  │
                  ▼
       Frontend Input Validation (Regex, Ranges)
                  │
                  ▼
    Frontend API Request (GET /api/transactions)
                  │
                  ▼
  Backend Middleware: Sliding-Window Rate Limiter (30 req/min)
                  │
                  ▼
Backend Controller: Address Checksum & Safe Range Validation
                  │
                  ▼
       RPC Service: Chain ID & Provider Verification
                  │
                  ▼
 Block Scanner: Concurrent Batching (eth_getBlockByNumber)
 ┌─────────────────────────────────────────────────────────┐
 │ • Fetches blocks concurrently up to RPC_CONCURRENCY     │
 │ • Retries with exponential backoff on transient errors  │
 │ • Preserves ascending block & transaction index order   │
 └─────────────────────────────────────────────────────────┘
                  │
                  ▼
    Filter Transactions by Wallet Address (from / to)
                  │
                  ▼
 Transaction Service: Fetch Receipts (eth_getTransactionReceipt)
                  │
                  ▼
 Determine Status (SUCCESS / FAILED), Gas Metrics, & Timestamp
                  │
                  ▼
     Sanitize & Return JSON API Response Payload
                  │
                  ▼
    Frontend State Update: Render Transaction Cards
```

### Folder Structure

```
sepolia-wallet-explorer/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── rpcController.js           # RPC health and status endpoints
│   │   │   ├── transactionController.js   # Main /api/transactions endpoint handler
│   │   │   └── walletController.js        # Address route controller
│   │   ├── middleware/
│   │   │   └── rateLimiter.js             # Sliding-window IP rate limiter
│   │   ├── routes/
│   │   │   ├── api.js                     # Health and status routes
│   │   │   └── transactionRoutes.js       # Transaction scanning routes
│   │   ├── services/
│   │   │   ├── blockScanner.js            # Batching, retries, and block scanning
│   │   │   ├── ethereumService.js         # Core Ethereum service provider
│   │   │   ├── rpcService.js              # RPC calls, timeouts, and health checks
│   │   │   └── transactionService.js      # Receipt enrichment and status resolution
│   │   ├── utils/
│   │   │   ├── addressValidator.js        # Checksum & hex address validation
│   │   │   ├── addressValidator.test.js   # Address validator test suite
│   │   │   └── sanitizer.js               # Sensitive credential redaction & logger
│   │   └── index.js                       # Express server initialization
│   ├── .env.example                       # Environment variable template
│   ├── package.json                       # Backend dependencies and scripts
│   ├── testScannerResilience.js           # RPC retry and backoff test suite
│   └── testTransactionService.js          # Receipt enrichment test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddressInput.jsx           # Address and block range form input
│   │   │   ├── ErrorMessage.jsx           # User error banner
│   │   │   ├── ScanProgress.jsx           # Animated scan loading indicator
│   │   │   ├── TransactionCard.jsx        # Individual transaction card component
│   │   │   ├── TransactionList.jsx        # Transaction feed & empty state
│   │   │   └── WalletSummary.jsx          # Address, network, and count summary
│   │   ├── pages/
│   │   │   └── Explorer.jsx               # Main explorer page
│   │   ├── services/
│   │   │   └── api.js                     # Frontend API client
│   │   ├── App.jsx                        # Application root
│   │   ├── index.css                      # Tailwind CSS entry
│   │   └── main.jsx                       # React DOM entry
│   ├── index.html                         # HTML template
│   ├── package.json                       # Frontend dependencies and scripts
│   ├── tailwind.config.js                 # Tailwind styling configuration
│   └── vite.config.js                     # Vite build configuration
├── package.json                           # Root workspace scripts
└── README.md                              # Project documentation
```

---

## 3. How Ethereum RPC Works

Ethereum nodes expose a standardized **JSON-RPC 2.0 interface** over HTTP/HTTPS and WebSockets. JSON-RPC is a stateless, lightweight remote procedure call protocol formatted in JSON:

- **Request Format**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByNumber",
    "params": ["0x5B8D80", true]
  }
  ```
- **Response Format**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": { ... }
  }
  ```

An Ethereum client (such as Geth, Nethermind, or Besu) maintains the blockchain's state transition machine and exposes these endpoints for reading block headers, retrieving transactions, and submitting signed payloads.

---

## 4. Why Blocks Must Be Scanned

Ethereum's storage model is built around a **Merkle Patricia Trie** that tracks the current state of accounts (balances, nonces, code hashes, and storage roots). Standard Ethereum execution clients do **not** maintain a secondary lookup table mapping individual wallet addresses to historical transactions.

Consequently, without specialized indexing infrastructure:
1. To find historical activity for an address `0x...`, an application must sequentially or concurrently fetch blocks within the target range using `eth_getBlockByNumber`.
2. The application iterates through every transaction in each block body and inspects the `from` and `to` fields.
3. For matched transactions, receipts must be queried via `eth_getTransactionReceipt` to verify whether the transaction succeeded or reverted on-chain.

---

## 5. RPC Methods Used

| RPC Method | Purpose in Application |
| :--- | :--- |
| `eth_chainId` / `provider.getNetwork()` | Verifies network identity to guarantee connection to Sepolia (`11155111`). |
| `eth_blockNumber` / `provider.getBlockNumber()` | Fetches the latest block height on the network for health checking. |
| `eth_getBlockByNumber` / `provider.getBlock(n, true)` | Retrieves block details, timestamp, and full transaction objects for scanning. |
| `eth_getTransactionReceipt` / `provider.getTransactionReceipt(hash)` | Retrieves execution status (`status: 1` or `0`), `gasUsed`, and `effectiveGasPrice`. |

---

## 6. Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HariVarna/RPC-fetch__transaction_history.git
   cd RPC-fetch__transaction_history/sepolia-wallet-explorer
   ```

2. **Install all dependencies**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

---

## 7. Environment Variables

Create a `.env` file in the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

Configure the following variables in `backend/.env`:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `SEPOLIA_RPC_URL` | **Yes** | `https://rpc.sepolia.org` | Ethereum Sepolia JSON-RPC HTTP endpoint (Alchemy, Infura, QuickNode, or Public RPC). |
| `RPC_CONCURRENCY` | No | `5` | Maximum number of concurrent block fetch requests to the RPC provider. |
| `MAX_BLOCK_RANGE` | No | `50` | Maximum number of blocks allowed to scan per API request. |
| `PORT` | No | `3001` | Express server port. |

---

## 8. Running Frontend

From the `sepolia-wallet-explorer/frontend` directory:

```bash
npm run dev
```

- Local Dev URL: `http://localhost:5173`
- Production Build: `npm run build`

---

## 9. Running Backend

From the `sepolia-wallet-explorer/backend` directory:

```bash
# Start development server with live reload
npm run dev

# Or start production server
npm start

# Run unit tests
npm test
```

- API Server URL: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`
- RPC Health Check: `http://localhost:3001/api/rpc/status`

---

## 10. API Documentation

### `GET /api/transactions`

Scans a range of Sepolia blocks for transactions involving a specific address and enriches them with receipts.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `address` | `string` | **Yes** | 42-character hexadecimal Ethereum address (e.g. `0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c`). |
| `startBlock` | `number` | **Yes** | Starting block number (inclusive non-negative integer). |
| `endBlock` | `number` | **Yes** | Ending block number (inclusive, `endBlock >= startBlock`, range `<= 50`). |

#### Example Request
```http
GET /api/transactions?address=0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c&startBlock=6000000&endBlock=6000010 HTTP/1.1
Host: localhost:3001
```

#### Example Response (HTTP 200 OK)
```json
{
  "address": "0x110b9caccbc6089fbb7c865e0531be1b72d39a4c",
  "network": "Sepolia",
  "startBlock": 6000000,
  "endBlock": 6000010,
  "transactionCount": 1,
  "transactions": [
    {
      "hash": "0xc62d961108ac699b05b310e82e282e042600ab3442c073f35af0a99a035c453f",
      "blockNumber": 6000000,
      "transactionIndex": 0,
      "from": "0x110b9CaCcbC6089fBb7c865E0531Be1b72d39A4c",
      "to": "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      "value": "1000000000000000000",
      "gas": "21000",
      "gasPrice": "140592799536",
      "nonce": 12,
      "type": 2,
      "input": "0x",
      "timestamp": "2024-05-15T12:00:00.000Z",
      "blockTimestamp": 1715774400,
      "status": "SUCCESS",
      "receipt": {
        "gasUsed": "21000",
        "effectiveGasPrice": "140592799536",
        "contractAddress": null,
        "logs": []
      }
    }
  ]
}
```

#### Error Responses
- **HTTP 400 Bad Request**: Invalid address checksum, non-numeric block numbers, inverted range, or range exceeding 50 blocks.
- **HTTP 429 Too Many Requests**: Client exceeded rate limit (30 requests/min). Returns `Retry-After` header.
- **HTTP 504 Gateway Timeout**: RPC scan exceeded 30-second timeout window.

---

## 11. Performance Limitations

1. **HTTP Round-Trip Overhead**: Pure JSON-RPC scanning requires separate HTTP requests for every block body and transaction receipt. Scanning 50 dense blocks can trigger 50+ network calls.
2. **Provider Rate Limits**: Free-tier public RPC endpoints commonly enforce aggressive rate limits (e.g. 10–25 req/sec). While exponential backoff prevents failure, requests may experience latency delays under heavy loads.
3. **Receipt Query Serialization**: Matching transactions in large blocks requires secondary `eth_getTransactionReceipt` queries, adding round-trip latency proportional to match counts.

---

## 12. Known Limitations

- **Internal Transactions**: Calls triggered inside smart contract execution (internal transfers via `CALL` or `DELEGATECALL`) do not appear in top-level `tx.to` or `tx.from` fields and cannot be detected via basic JSON-RPC without debug tracing (`debug_traceTransaction` / `trace_block`).
- **Token Transfers (ERC-20 / ERC-721)**: Token transfers emitted as contract events require querying `eth_getLogs` for the `Transfer(address,address,uint256)` event signature rather than standard transaction matching.
- **Scan Range Window**: To protect the server and client from RPC timeouts, scans are capped at 50 blocks per request.

---

## 13. Future Improvements

- [ ] **Log Filtering (`eth_getLogs`)**: Integrate ERC-20, ERC-721, and ERC-1155 token transfer detection.
- [ ] **JSON-RPC Batch Requests**: Group multiple `eth_getBlockByNumber` and `eth_getTransactionReceipt` calls into single HTTP batch payloads (`[{...}, {...}]`) to minimize round trips.
- [ ] **WebSocket Live Subscriptions (`eth_subscribe`)**: Stream newly mined transactions involving watched addresses in real time.
- [ ] **Local Cache Layer**: Persist immutable historical blocks in Redis or SQLite to eliminate duplicate RPC requests.
- [ ] **Server-Sent Events (SSE)**: Stream real-time block scanning progress percentages to the frontend for larger block ranges.

