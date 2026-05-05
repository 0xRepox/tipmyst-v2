# TipMyst — Confidential Creator Tipping on Ethereum

> **Zama Developer Program Season 2 · Builder Track submission**

TipMyst is a decentralized tipping platform where **tip amounts are fully encrypted on-chain** using [Zama FHEVM](https://docs.zama.ai/protocol). Supporters send encrypted tips to creators; no one — not the creator, not the blockchain, not any observer — can see how much was sent. Only the recipient can decrypt their own balance.

**Live demo:** https://tipmyst-v2.vercel.app
**Smart contracts on Sepolia:**

- TipMyst: [`0x9C6174C7E452C5ECe8A87E639Da10eb9db0a6439`](https://sepolia.etherscan.io/address/0x9C6174C7E452C5ECe8A87E639Da10eb9db0a6439)
- MYSTToken (confidential ERC-20): [`0xE83A10Fb404Fecc97bAf2AA35Cd13Bc35eCf6F2e`](https://sepolia.etherscan.io/address/0xE83A10Fb404Fecc97bAf2AA35Cd13Bc35eCf6F2e)

---

## Why FHE?

Traditional on-chain tipping exposes every amount to every blockchain observer. Supporters may not want their spending public; creators' incomes become visible to competitors. FHE solves this by letting the smart contract **perform arithmetic on ciphertext** — adding an encrypted tip to an encrypted balance — without ever decrypting either value.

| Property                          | Traditional tipping | TipMyst               |
| --------------------------------- | ------------------- | --------------------- |
| Tip amount visible on-chain       | Public              | Encrypted             |
| Recipient balance visible         | Public              | Encrypted             |
| Verifiable on-chain provenance    | Yes                 | Yes                   |
| Recipient can check their balance | Yes                 | Yes (EIP-712 decrypt) |

---

## How It Works

```
Supporter                     Browser (Zama SDK)             Sepolia (FHEVM)
   │                                  │                             │
   │  Enter tip amount (e.g. 50)      │                             │
   ├─────────────────────────────────►│                             │
   │                                  │  encrypt(50) → ciphertext   │
   │                                  ├────────────────────────────►│
   │                                  │  TipMyst.sendTip(cipher)    │
   │                                  │  FHE.add(balance, amount)   │
   │                                  │◄────────────────────────────┤
   │  Tip confirmed                   │  emit TipSent(from, to)     │
```

1. **Connect wallet** — MetaMask or any Web3 wallet on Sepolia
2. **Claim free MYST** — 10 MYST from the built-in faucet (24h cooldown)
3. **Choose role** — _Supporter_ (send tips) or _Creator_ (register profile)
4. **Encrypt & send** — the Zama SDK encrypts the amount in-browser; the ciphertext is signed with EIP-712 and submitted
5. **Decrypt balance** — the recipient signs an EIP-712 request; the Zama gateway decrypts only for that key-holder

---

## Architecture

```
packages/
├── foundry/                   Solidity contracts + Forge tests
│   ├── src/
│   │   ├── MYSTToken.sol      Confidential ERC-20 (FHEVM ConfidentialERC20)
│   │   └── TipMyst.sol        Creator registry + encrypted tipping
│   ├── script/
│   │   └── DeployTipMyst.s.sol
│   └── test/
│       └── TipMyst.t.sol      15 tests (faucet, registration, tips)
│
└── nextjs/                    Next.js 16 frontend
    ├── app/page.tsx            Landing + role selector + app shell
    ├── components/tipmyst/
    │   ├── BalanceCard.tsx     Encrypted balance + decrypt flow
    │   ├── CreatorList.tsx     Browse creators + inline tip form
    │   └── RegisterCard.tsx    Creator profile registration
    ├── hooks/tipmyst/
    │   └── useTipMyst.tsx      All contract interactions + Zama SDK
    └── contracts/
        ├── TipMyst.ts          ABI + Sepolia address
        └── MYSTToken.ts        ABI + Sepolia address
```

### MYSTToken.sol

A `ConfidentialERC20` token — balances stored as `euint64` (encrypted 64-bit integers):

```solidity
function claimFaucet() external           // 10 MYST, 24h cooldown per address
function canClaimFaucet(address) view      // check cooldown status
```

### TipMyst.sol

```solidity
function registerCreator(string name, string bio, string imageUrl) external
function sendTip(address creator, externalEuint64 encryptedAmount, bytes inputProof) external
function getAllCreators() external view returns (address[])
function getCreator(address) external view returns (Creator)
```

`sendTip` calls `token.transferFrom(msg.sender, creator, amount)` — the token contract performs `FHE.add` on ciphertext. No plaintext amount ever exists on-chain.

---

## FHE Implementation Details

### Encryption (client-side)

```ts
const instance = await getInstance();
const { handles, inputProof } = instance
  .createEncryptedInput(TipMystAddress, address)
  .add64(BigInt(amount * 1_000_000)) // 6 decimal places
  .encrypt();
await writeContractAsync({
  functionName: "sendTip",
  args: [creatorAddress, handles[0], inputProof],
});
```

### Decryption (EIP-712)

```ts
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(publicKey, MYSTTokenAddress);
const signature = await signTypedDataAsync(eip712.domain, eip712.types, eip712.message);
const decrypted = await instance.userDecrypt(
  { handle: balanceHandle, contractAddress: MYSTTokenAddress },
  privateKey,
  publicKey,
  signature,
  MYSTTokenAddress,
  address,
);
```

The private key never leaves the browser. The Zama KMS gateway verifies the EIP-712 signature, confirms the caller owns the address, and returns the decrypted value.

---

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| FHE             | Zama FHEVM · `@fhevm/solidity`       |
| Blockchain      | Ethereum Sepolia Testnet             |
| Smart contracts | Solidity 0.8.27 · Foundry            |
| Frontend        | Next.js 16.2 (App Router, Turbopack) |
| Wallet          | RainbowKit + wagmi v2 + viem         |
| Zama React SDK  | `@zama-ai/react-fhevm`               |
| Styling         | Tailwind CSS v4 + DaisyUI 5          |
| Deployment      | Vercel                               |

---

## Local Development

### Prerequisites

- Node.js 18+, pnpm 8+
- Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- MetaMask with Sepolia testnet + Sepolia ETH (faucet.sepolia.dev)

### Setup

```bash
git clone https://github.com/0xRepox/tipmyst-v2
cd tipmyst-v2/packages/nextjs
pnpm install
cp .env.local.example .env.local   # fill in keys below
pnpm dev                           # → http://localhost:3000
```

### Environment Variables

| Variable                                | Required | Description                     |
| --------------------------------------- | -------- | ------------------------------- |
| `NEXT_PUBLIC_ALCHEMY_API_KEY`           | Yes      | Alchemy API key for Sepolia RPC |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Yes      | WalletConnect Cloud project ID  |

### Foundry Tests

```bash
cd packages/foundry
forge test -vv
# 15 tests: faucet, creator registration, tipping, getAllCreators
```

---

## Submission Notes

- **Track:** Builder Track — Zama Developer Program Season 2
- **FHE use case:** Confidential creator economy — encrypted tip amounts and balances
- **Smart contract + frontend:** Deployed and live on Sepolia
- **Zama SDK:** `@fhevm/solidity` + `@zama-ai/react-fhevm`
- **Network:** Ethereum Sepolia Testnet (Zama FHEVM gateway)

---

## License

MIT
