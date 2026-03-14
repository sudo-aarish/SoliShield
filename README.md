# SoliShield
SoliShield is a gasless, a security auditor for Solidity smart contracts. It leverages Facinet for seamless USDC payments on Base and Avalanche, providing instant vulnerability analysis, dynamic risk scoring, and on-chain report registry. This ensures your code is production-ready with automated, and cost-effective security certificates.
✨ Key Features
🤖 AI-Driven Analysis: Detects Reentrancy, Overflow, and Access Control vulnerabilities using advanced pattern matching.

⛽ Gasless Payments: Integrated with Facinet—pay for audits in USDC without needing native gas tokens ($ETH / $AVAX).

📈 Dynamic Pricing: Audit costs are calculated automatically based on the complexity (Line Count) of your contract.

🔗 On-Chain Transparency: Final audit reports are hashed and stored on-chain (Base/Avalanche) and hosted on IPFS.

📄 PDF Certificates: Generates branded, professional security certificates with a "Security Score" badge for project owners.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Tailwind-inspired), JavaScript (ES6+), jsPDF.

Backend: Node.js, Express, Multer.

Blockchain/Web3: Facinet SDK, Pinata (IPFS), Ethers.js.

AI: OpenAI/Gemini API (via Audit Agent).

🚀 Getting Started
1. Prerequisites
Node.js (v18+)

NPM or Yarn

A Pinata API Key (for IPFS)

A Private Key with USDC (for the Payer/Sponsor wallet)

2. Installation
Bash
# Clone the repository
git clone https://github.com/your-username/solishield.git

# Navigate to the project directory
cd solishield-ai

# Install dependencies
npm install
3. Environment Setup
Create a .env file in the root directory and add the following:

Code snippet
PORT=3000
PAYER_PRIVATE_KEY=your_private_key_here
RECEIVING_WALLET=your_receiving_wallet_address
PINATA_GATEWAY=https://gateway.pinata.cloud
NETWORK=base-sepolia
4. Running the App
Bash
# Start the server
node server.js
Open http://localhost:3000 in your browser to start auditing!

🏗️ How it Works (The Workflow)
Handshake: The user uploads a .sol file. The server calculates the price ($0.50 + $0.01/line).

Sponsorship: The app requests a gasless USDC transaction via Facinet.

Audit: Once payment is verified, the AI Agent analyzes the code.

Finalization: The report is pinned to IPFS and the CID is recorded on the selected blockchain.

Delivery: The user downloads their signed PDF Security Certificate.
