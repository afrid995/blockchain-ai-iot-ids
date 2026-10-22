# Blockchain Model Provenance Layer

This package implements the decentralized root of trust for AI model provenance and tamper-evident verification.

## Architecture

- **Smart Contract (`blockchain/contracts/ModelRegistry.sol`):** Written in Solidity 0.8.20. Stores compact on-chain commitments: `model_id`, `version`, `bytes32 modelHash`, `algorithm`, `timestamp`, and `registrant`.
- **EVM Provider:** Local Ethereum-compatible development environment (`EthereumTesterProvider` for deterministic, zero-dependency testing; configurable with `HTTPProvider` for local RPC nodes such as Hardhat/Ganache at `http://127.0.0.1:8545`).
- **Python Connector (`core/blockchain.py`, `blockchain/client.py`):** Web3.py wrapper that compiles Solidity sources, deploys the registry, and converts 64-character SHA-256 strings into 32-byte binary words (`bytes32`).

## Why Off-Chain Storage?

Consistent with the research design:
- The ML model weights (`ids_model.joblib`), datasets, and network traffic payloads are kept **off-chain**.
- Only the 32-byte cryptographic SHA-256 digest is anchored **on-chain**.
- This guarantees constant transaction costs, minimal storage overhead, and zero data leakage.

## Scripts

1. **Compile:** `python -m blockchain.scripts.compile`
2. **Deploy:** `python -m blockchain.scripts.deploy`
3. **Register Phase 2 Model:** `python -m blockchain.scripts.register_model`
