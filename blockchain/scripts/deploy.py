"""Deployment script for ModelRegistry smart contract on local EVM network.

Measures actual deployment latency, transaction hash, block number, and gas used,
writing real deployment metadata to blockchain/deployment/deployment.json.
"""

from __future__ import annotations

from pathlib import Path

from core.blockchain import BlockchainRegistryClient


def deploy_model_registry(
    deployment_output: str | Path = "blockchain/deployment/deployment.json",
    rpc_url: str | None = None,
) -> dict:
    client = BlockchainRegistryClient(rpc_url=rpc_url)
    print("=" * 65)
    print("        DEPLOYING MODELREGISTRY SMART CONTRACT TO LOCAL EVM       ")
    print("=" * 65)
    print(f"EVM Provider:       {type(client.w3.provider).__name__}")
    print(f"Connected:          {client.is_connected()}")
    print(f"Deployer Account:   {client.w3.eth.accounts[0]}")

    info = client.deploy_contract(deployment_file=deployment_output)
    print("\n--- DEPLOYMENT RECEIPT ---")
    print(f"Contract Address:   {info['contract_address']}")
    print(f"Transaction Hash:   {info['transaction_hash']}")
    print(f"Block Number:       {info['block_number']}")
    print(f"Gas Consumed:       {info['gas_used']:,} gas")
    print(f"Deployment Time:    {info['deployment_latency_seconds']:.4f} seconds")
    print(f"Metadata Saved:     {deployment_output}")
    print("=" * 65)
    return info


if __name__ == "__main__":
    deploy_model_registry()
