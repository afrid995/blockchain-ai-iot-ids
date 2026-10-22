"""Registration script for anchoring Phase 2 model provenance into ModelRegistry.

Enforces pre-registration verification: computes current SHA-256 of the model
artifact, verifies equality with provenance_record.json, and transacts with the
smart contract to register on-chain provenance.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256
from core.provenance import load_provenance_record


def register_phase2_model(
    model_artifact_path: str | Path = "ml/artifacts/ids_model.joblib",
    provenance_path: str | Path = "ml/artifacts/provenance_record.json",
    deployment_path: str | Path = "blockchain/deployment/deployment.json",
    client: BlockchainRegistryClient | None = None,
) -> Dict[str, Any]:
    art_path = Path(model_artifact_path)
    prov_path = Path(provenance_path)
    dep_path = Path(deployment_path)

    if not art_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {art_path.resolve()}")
    if not prov_path.exists():
        raise FileNotFoundError(f"Provenance record not found at {prov_path.resolve()}")

    # 1. Calculate actual SHA-256 of canonical artifact
    current_sha256 = calculate_sha256(art_path)

    # 2. Load Phase 2 provenance record
    prov_record = load_provenance_record(prov_path)
    expected_sha256 = prov_record.artifact.sha256

    print("=" * 65)
    print("       ON-CHAIN MODEL PROVENANCE REGISTRATION GATEWAY       ")
    print("=" * 65)
    print(f"Target Artifact:       {art_path.name}")
    print(f"Artifact Disk SHA-256: {current_sha256}")
    print(f"Provenance SHA-256:    {expected_sha256}")

    # 3. Security Gate: Verify hash equality before blockchain registration
    if current_sha256.lower() != expected_sha256.lower():
        raise ValueError(
            f"SECURITY ABORT: Current model hash {current_sha256} does NOT match "
            f"provenance record {expected_sha256}! Registration aborted to prevent registering an altered artifact."
        )

    print("\n[Gatekeeper] Artifact integrity confirmed against provenance record.")

    # 4. Connect to blockchain
    if client is None:
        contract_addr = None
        if dep_path.exists():
            with open(dep_path, "r", encoding="utf-8") as f:
                dep_data = json.load(f)
                contract_addr = dep_data.get("contract_address")

        client = BlockchainRegistryClient(contract_address=contract_addr)
        if not client.contract:
            print("[Setup] No active deployment found. Deploying contract to local EVM...")
            client.deploy_contract(deployment_file=dep_path)

    # 5. Execute registration on-chain
    print(f"\n[Blockchain] Registering model '{prov_record.model_id}' version '{prov_record.version}'...")
    reg_receipt = client.register_model(
        model_id=prov_record.model_id,
        version=prov_record.version,
        model_hash_hex=current_sha256,
        algorithm=prov_record.algorithm,
    )

    print("\n--- ON-CHAIN REGISTRATION RECEIPT ---")
    print(f"Transaction Hash:   {reg_receipt['transaction_hash']}")
    print(f"Block Number:       {reg_receipt['block_number']}")
    print(f"Gas Consumed:       {reg_receipt['gas_used']:,} gas")
    print(f"Tx Latency:         {reg_receipt['transaction_latency_seconds']:.4f} seconds")
    print(f"Registrant:         {reg_receipt['registrant']}")
    print(f"Status:             {reg_receipt['status']}")
    print("=" * 65)

    return reg_receipt


if __name__ == "__main__":
    register_phase2_model()
