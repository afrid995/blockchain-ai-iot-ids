# Blockchain Model Provenance Layer

This package implements the decentralized reference registry for AI model provenance and tamper-evident integrity verification.

## Architecture

- **Smart Contract (`blockchain/contracts/ModelRegistry.sol`):** Written in Solidity 0.8.20. Stores compact on-chain commitments: `model_id`, `version`, `bytes32 modelHash`, `algorithm`, `timestamp`, and `registrant`.
- **EVM Provider:** Local Ethereum-compatible development environment (`EthereumTesterProvider` for deterministic, zero-dependency testing; configurable with `HTTPProvider` for local RPC nodes such as Hardhat/Ganache at `http://127.0.0.1:8545`).
- **Python Connector (`core/blockchain.py`, `blockchain/client.py`):** Web3.py wrapper that compiles Solidity sources, deploys the registry, and converts 64-character SHA-256 strings into 32-byte binary words (`bytes32`).

## Why Off-Chain Storage?

Consistent with the research design:
- The ML model weights (`ids_model.joblib`), datasets, and network traffic payloads are kept **off-chain**.
- Only the 32-byte cryptographic SHA-256 digest is anchored **on-chain**.
- This guarantees bounded transaction costs, minimal storage overhead, and prevents exposing raw network payloads on-chain.

## Verification & Latency Boundary

- The blockchain verification operation is architecturally separated from steady-state ML inference and is not invoked for every network-flow prediction in the current design.
- The measured blockchain read latency reflects the local `EthereumTesterProvider`/`py-evm` experimental environment and should not be interpreted as representative of public or production blockchain networks.
- A successful hash comparison establishes artifact integrity relative to the registered reference. It does not prove that the model is accurate, unbiased, adversarially robust, or free from data poisoning.

## Scripts

1. **Compile:** `python -m blockchain.scripts.compile`
2. **Deploy:** `python -m blockchain.scripts.deploy`
3. **Register Model:** `python -m blockchain.scripts.register_model`
