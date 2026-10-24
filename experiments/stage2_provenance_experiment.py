#!/usr/bin/env python3
"""Stage 2 Attack-Type Classifier Blockchain Provenance & Integrity Experiment.

Phase 7B.2: Register and Verify the Selected Attack-Type Classifier
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

Executes and verifies:
- E1: Legitimate registered Stage 2 classifier verification (VERIFIED).
- E2: Tampered artifact verification using temporary byte-altered copy (HASH_MISMATCH).
- E3: Unregistered version query (NOT_REGISTERED).
- E4: Nonexistent artifact file query (FILE_NOT_FOUND).
- E5: Wrong expected hash verification (HASH_MISMATCH / INVALID_EXPECTED_HASH).
- Performance benchmarking: Contract deployment, registration gas/latency, and N=30 read latency statistics.
- Export of machine-readable results to experiments/results/phase7b_2_provenance_results.json.

CRITICAL RESEARCH BOUNDARIES:
- Provenance registration proves only that local artifact bytes match the registered digest.
- Does NOT claim blockchain improves classification accuracy or detects attacks.
- Does NOT claim model safety, robustness, or absence of training-data poisoning.
- Measurements are explicitly scoped to the local Ethereum-compatible test environment.
- Canonical Stage 2 and Stage 1 model artifacts remain strictly unaltered.
"""

from __future__ import annotations

import datetime
import json
import os
import shutil
import statistics
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List

# Setup repository root
REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(REPO_ROOT)
sys.path.insert(0, str(REPO_ROOT))

from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256
from core.provenance import verify_model_integrity

STAGE2_MODEL_ID = "iot-ids-attack-classifier"
STAGE2_VERSION = "v1.0.0"
STAGE2_ALGORITHM = "RandomForestClassifier"
STAGE2_ARTIFACT_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier.joblib"
STAGE2_PROVENANCE_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier_provenance_record.json"
EXPECTED_STAGE2_SHA256 = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

STAGE1_ARTIFACT_PATH = REPO_ROOT / "ml" / "artifacts" / "ids_model.joblib"
EXPECTED_STAGE1_SHA256 = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"

RESULTS_PATH = REPO_ROOT / "experiments" / "results" / "phase7b_2_provenance_results.json"


def print_banner(title: str, level: int = 1) -> None:
    """Print formatted section banner."""
    char = "=" if level == 1 else "-"
    width = 78
    print(f"\n{char * width}")
    print(f" {title}")
    print(f"{char * width}")


def verify_artifacts_precheck() -> Dict[str, Any]:
    """Verify presence and exact SHA-256 digests of Stage 1 and Stage 2 models."""
    print_banner("1. PRE-CHECK: MODEL ARTIFACT INTEGRITY", level=2)

    if not STAGE2_ARTIFACT_PATH.exists():
        raise FileNotFoundError(f"Stage 2 artifact not found: {STAGE2_ARTIFACT_PATH}")
    if not STAGE1_ARTIFACT_PATH.exists():
        raise FileNotFoundError(f"Stage 1 artifact not found: {STAGE1_ARTIFACT_PATH}")

    actual_stage2_sha = calculate_sha256(STAGE2_ARTIFACT_PATH)
    actual_stage1_sha = calculate_sha256(STAGE1_ARTIFACT_PATH)

    print(f"Stage 2 Artifact Path:   {STAGE2_ARTIFACT_PATH.relative_to(REPO_ROOT)}")
    print(f"Stage 2 Actual SHA-256:  {actual_stage2_sha}")
    print(f"Stage 2 Expected SHA:    {EXPECTED_STAGE2_SHA256}")
    print(f"Stage 2 Match:           {actual_stage2_sha == EXPECTED_STAGE2_SHA256}")

    print(f"\nStage 1 Artifact Path:   {STAGE1_ARTIFACT_PATH.relative_to(REPO_ROOT)}")
    print(f"Stage 1 Actual SHA-256:  {actual_stage1_sha}")
    print(f"Stage 1 Expected SHA:    {EXPECTED_STAGE1_SHA256}")
    print(f"Stage 1 Match:           {actual_stage1_sha == EXPECTED_STAGE1_SHA256}")

    if actual_stage2_sha != EXPECTED_STAGE2_SHA256:
        raise ValueError("Stage 2 artifact SHA-256 mismatch before registration!")
    if actual_stage1_sha != EXPECTED_STAGE1_SHA256:
        raise ValueError("Stage 1 binary baseline SHA-256 mismatch!")

    stage2_size = STAGE2_ARTIFACT_PATH.stat().st_size
    stage1_size = STAGE1_ARTIFACT_PATH.stat().st_size

    print(f"Stage 2 Size: {stage2_size:,} bytes")
    print(f"Stage 1 Size: {stage1_size:,} bytes")

    return {
        "stage2": {
            "model_id": STAGE2_MODEL_ID,
            "version": STAGE2_VERSION,
            "path": str(STAGE2_ARTIFACT_PATH.relative_to(REPO_ROOT)),
            "sha256": actual_stage2_sha,
            "size_bytes": stage2_size,
            "status": "VERIFIED",
        },
        "stage1": {
            "model_id": "iot-ids-rf",
            "version": "v1.0.0",
            "path": str(STAGE1_ARTIFACT_PATH.relative_to(REPO_ROOT)),
            "sha256": actual_stage1_sha,
            "size_bytes": stage1_size,
            "status": "VERIFIED",
        },
    }


def run_stage2_provenance_experiment(
    n_verification_samples: int = 30,
) -> Dict[str, Any]:
    """Execute complete Stage 2 blockchain provenance experiment (E1–E5)."""
    print_banner("PHASE 7B.2: STAGE 2 PROVENANCE & INTEGRITY EXPERIMENT")

    # 1. Pre-check
    precheck = verify_artifacts_precheck()

    # 2. Blockchain Client & Deployment
    print_banner("2. LOCAL BLOCKCHAIN INITIALIZATION & CONTRACT DEPLOYMENT", level=2)
    client = BlockchainRegistryClient()
    backend_type = "EthereumTesterProvider (py-evm)" if hasattr(client.w3.provider, "ethereum_tester") else "RPC/HTTP"
    print(f"Connected to EVM Backend: {backend_type}")

    deploy_receipt = client.deploy_contract(deployment_file=None)
    print(f"Contract Address:     {deploy_receipt['contract_address']}")
    print(f"Deployer Address:     {deploy_receipt['deployer_address']}")
    print(f"Deployment Block:     {deploy_receipt['block_number']}")
    print(f"Deployment Gas Used:  {deploy_receipt['gas_used']:,}")
    print(f"Deployment Latency:   {deploy_receipt['deployment_latency_seconds']:.6f} s")

    # 3. Register Stage 2 Model (E1 Setup)
    print_banner("3. REGISTERING STAGE 2 ATTACK-TYPE CLASSIFIER", level=2)
    reg_receipt = client.register_model(
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
        model_hash_hex=EXPECTED_STAGE2_SHA256,
        algorithm=STAGE2_ALGORITHM,
    )
    print(f"Model ID:             {STAGE2_MODEL_ID}")
    print(f"Version:              {STAGE2_VERSION}")
    print(f"Registered SHA-256:   {EXPECTED_STAGE2_SHA256}")
    print(f"Transaction Hash:     {reg_receipt['transaction_hash']}")
    print(f"Block Number:         {reg_receipt['block_number']}")
    print(f"Registration Gas:     {reg_receipt['gas_used']:,}")
    print(f"Tx Latency:           {reg_receipt['transaction_latency_seconds']:.6f} s")

    # 4. Scenario E1: Legitimate Registered Artifact
    print_banner("4. SCENARIO E1: LEGITIMATE REGISTERED ARTIFACT VERIFICATION", level=2)
    t0_e1 = time.perf_counter()
    e1_result = client.verify_model_against_blockchain(
        model_path=STAGE2_ARTIFACT_PATH,
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
    )
    e1_latency = time.perf_counter() - t0_e1
    print(f"Target:               {STAGE2_MODEL_ID}:{STAGE2_VERSION}")
    print(f"Status:               {e1_result['status']}")
    print(f"Verified:             {e1_result['verified']}")
    print(f"Local Digest:         {e1_result['local_hash']}")
    print(f"Registered Digest:    {e1_result['registered_hash']}")
    print(f"Read Latency:         {e1_result['read_latency_ms']:.4f} ms")
    print(f"Overall E1 Latency:   {e1_latency * 1000.0:.4f} ms")

    if not e1_result["verified"] or e1_result["status"] != "VERIFIED":
        raise AssertionError(f"E1 Failed: expected VERIFIED, got {e1_result['status']}")

    # 5. Scenario E2: Tampered Artifact
    print_banner("5. SCENARIO E2: TAMPERED ARTIFACT VERIFICATION", level=2)
    with tempfile.NamedTemporaryFile(suffix=".joblib", delete=False) as tmp_file:
        tmp_tampered_path = Path(tmp_file.name)

    try:
        shutil.copyfile(STAGE2_ARTIFACT_PATH, tmp_tampered_path)
        with open(tmp_tampered_path, "ab") as f:
            f.write(b"\x00TAMPERED_BYTE_PAYLOAD_PHASE_7B_2_INTEGRITY_CHECK\x00")

        tampered_hash = calculate_sha256(tmp_tampered_path)
        tampered_size = tmp_tampered_path.stat().st_size
        print(f"Temporary Tampered File: {tmp_tampered_path}")
        print(f"Original Size:           {STAGE2_ARTIFACT_PATH.stat().st_size:,} bytes")
        print(f"Tampered Size:           {tampered_size:,} bytes")
        print(f"Original Hash:           {EXPECTED_STAGE2_SHA256}")
        print(f"Tampered Hash:           {tampered_hash}")
        print(f"Hash Differs:            {tampered_hash != EXPECTED_STAGE2_SHA256}")

        e2_result = client.verify_model_against_blockchain(
            model_path=tmp_tampered_path,
            model_id=STAGE2_MODEL_ID,
            version=STAGE2_VERSION,
        )
        print(f"Status:                  {e2_result['status']}")
        print(f"Verified:                {e2_result['verified']}")
        print(f"Message:                 {e2_result['message']}")

        if e2_result["verified"] or e2_result["status"] != "HASH_MISMATCH":
            raise AssertionError(f"E2 Failed: expected HASH_MISMATCH, got {e2_result['status']}")
    finally:
        if tmp_tampered_path.exists():
            tmp_tampered_path.unlink()

    # Verify canonical artifact was not modified
    canonical_check = calculate_sha256(STAGE2_ARTIFACT_PATH)
    if canonical_check != EXPECTED_STAGE2_SHA256:
        raise AssertionError("CRITICAL: Canonical Stage 2 artifact was modified during E2 test!")

    # 6. Scenario E3: Unregistered Version
    print_banner("6. SCENARIO E3: UNREGISTERED VERSION QUERY", level=2)
    unregistered_version = "v9.9.9"
    e3_result = client.verify_model_against_blockchain(
        model_path=STAGE2_ARTIFACT_PATH,
        model_id=STAGE2_MODEL_ID,
        version=unregistered_version,
    )
    print(f"Query Version:           {unregistered_version}")
    print(f"Status:                  {e3_result['status']}")
    print(f"Verified:                {e3_result['verified']}")
    print(f"Message:                 {e3_result['message']}")

    if e3_result["verified"] or e3_result["status"] != "NOT_REGISTERED":
        raise AssertionError(f"E3 Failed: expected NOT_REGISTERED, got {e3_result['status']}")

    # 7. Scenario E4: Missing Artifact
    print_banner("7. SCENARIO E4: MISSING ARTIFACT FILE", level=2)
    nonexistent_path = REPO_ROOT / "ml" / "artifacts" / "nonexistent_attack_classifier.joblib"
    e4_result = client.verify_model_against_blockchain(
        model_path=nonexistent_path,
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
    )
    print(f"Query Path:              {nonexistent_path}")
    print(f"Status:                  {e4_result['status']}")
    print(f"Verified:                {e4_result['verified']}")
    print(f"Message:                 {e4_result['message']}")

    if e4_result["verified"] or e4_result["status"] != "FILE_NOT_FOUND":
        raise AssertionError(f"E4 Failed: expected FILE_NOT_FOUND, got {e4_result['status']}")

    # 8. Scenario E5: Wrong Expected Hash (Pre-load integrity utility check)
    print_banner("8. SCENARIO E5: WRONG EXPECTED HASH VALIDATION", level=2)
    wrong_hash = "a" * 64
    e5_result = verify_model_integrity(
        model_path=STAGE2_ARTIFACT_PATH,
        expected_hash=wrong_hash,
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
    )
    print(f"Deliberate Wrong Hash:   {wrong_hash}")
    print(f"Actual Local Hash:       {e5_result['actual_hash']}")
    print(f"Status:                  {e5_result['status']}")
    print(f"Verified:                {e5_result['verified']}")
    print(f"Message:                 {e5_result['message']}")

    if e5_result["verified"] or e5_result["status"] != "HASH_MISMATCH":
        raise AssertionError(f"E5 Failed: expected HASH_MISMATCH, got {e5_result['status']}")

    # 9. Latency Benchmarking (N=30 verification queries)
    print_banner(f"9. LATENCY BENCHMARKING (N={n_verification_samples} SAMPLES)", level=2)
    latencies_ms: List[float] = []
    read_latencies_ms: List[float] = []

    for _ in range(n_verification_samples):
        t0 = time.perf_counter()
        v_res = client.verify_model_against_blockchain(
            model_path=STAGE2_ARTIFACT_PATH,
            model_id=STAGE2_MODEL_ID,
            version=STAGE2_VERSION,
        )
        t_total = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(t_total)
        read_latencies_ms.append(v_res["read_latency_ms"])

    lat_mean = statistics.mean(latencies_ms)
    lat_median = statistics.median(latencies_ms)
    lat_min = min(latencies_ms)
    lat_max = max(latencies_ms)
    lat_std = statistics.stdev(latencies_ms) if len(latencies_ms) > 1 else 0.0

    read_mean = statistics.mean(read_latencies_ms)
    read_median = statistics.median(read_latencies_ms)
    read_std = statistics.stdev(read_latencies_ms) if len(read_latencies_ms) > 1 else 0.0

    print(f"Overall Verification Latency (Hash + On-Chain Query):")
    print(f"  Mean:   {lat_mean:.4f} ms")
    print(f"  Median: {lat_median:.4f} ms")
    print(f"  Min:    {lat_min:.4f} ms")
    print(f"  Max:    {lat_max:.4f} ms")
    print(f"  Std:    {lat_std:.4f} ms")

    print(f"\nOn-Chain Registry Read Latency (RPC Query Only):")
    print(f"  Mean:   {read_mean:.4f} ms")
    print(f"  Median: {read_median:.4f} ms")
    print(f"  Std:    {read_std:.4f} ms")

    # 10. Summary Results Packaging
    results_payload = {
        "metadata": {
            "project": "Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection",
            "phase": "7B.2",
            "task": "Register and Verify Selected Attack-Type Classifier",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "repository": "https://github.com/afrid995/blockchain-ai-iot-ids.git",
        },
        "blockchain_environment": {
            "backend": backend_type,
            "environment_scope": "local Ethereum-compatible test environment (process-local EVM)",
            "contract_name": "ModelRegistry",
            "contract_address": deploy_receipt["contract_address"],
            "deployer_address": deploy_receipt["deployer_address"],
            "deployment_block": deploy_receipt["block_number"],
            "deployment_gas_used": deploy_receipt["gas_used"],
            "deployment_latency_seconds": deploy_receipt["deployment_latency_seconds"],
        },
        "model_identity": {
            "stage": 2,
            "model_id": STAGE2_MODEL_ID,
            "version": STAGE2_VERSION,
            "algorithm": STAGE2_ALGORITHM,
            "canonical_artifact_path": STAGE2_ARTIFACT_PATH.relative_to(REPO_ROOT).as_posix(),
            "canonical_artifact_sha256": EXPECTED_STAGE2_SHA256,
            "canonical_artifact_size_bytes": STAGE2_ARTIFACT_PATH.stat().st_size,
        },
        "registration_transaction": {
            "transaction_hash": reg_receipt["transaction_hash"],
            "block_number": reg_receipt["block_number"],
            "gas_used": reg_receipt["gas_used"],
            "transaction_latency_seconds": reg_receipt["transaction_latency_seconds"],
            "status": reg_receipt["status"],
        },
        "experimental_trials": {
            "e1_legitimate": {
                "description": "Legitimate canonical artifact verified against on-chain registry",
                "model_id": STAGE2_MODEL_ID,
                "version": STAGE2_VERSION,
                "input_hash": e1_result["local_hash"],
                "registered_hash": e1_result["registered_hash"],
                "verified": e1_result["verified"],
                "status": e1_result["status"],
                "read_latency_ms": e1_result["read_latency_ms"],
                "expected_status": "VERIFIED",
                "match": e1_result["status"] == "VERIFIED",
            },
            "e2_tampered": {
                "description": "Temporary byte-altered artifact verified against on-chain registry",
                "model_id": STAGE2_MODEL_ID,
                "version": STAGE2_VERSION,
                "tampered_hash": tampered_hash,
                "registered_hash": EXPECTED_STAGE2_SHA256,
                "verified": e2_result["verified"],
                "status": e2_result["status"],
                "expected_status": "HASH_MISMATCH",
                "match": e2_result["status"] == "HASH_MISMATCH",
                "canonical_artifact_unmodified": canonical_check == EXPECTED_STAGE2_SHA256,
            },
            "e3_unregistered_version": {
                "description": "Canonical artifact queried with unreleased version",
                "model_id": STAGE2_MODEL_ID,
                "version": unregistered_version,
                "input_hash": e3_result["local_hash"],
                "verified": e3_result["verified"],
                "status": e3_result["status"],
                "expected_status": "NOT_REGISTERED",
                "match": e3_result["status"] == "NOT_REGISTERED",
            },
            "e4_missing_artifact": {
                "description": "Nonexistent file path queried against on-chain registry",
                "model_id": STAGE2_MODEL_ID,
                "version": STAGE2_VERSION,
                "target_path": str(nonexistent_path),
                "verified": e4_result["verified"],
                "status": e4_result["status"],
                "expected_status": "FILE_NOT_FOUND",
                "match": e4_result["status"] == "FILE_NOT_FOUND",
            },
            "e5_wrong_expected_hash": {
                "description": "Deliberately incorrect expected hash supplied to integrity gate",
                "model_id": STAGE2_MODEL_ID,
                "version": STAGE2_VERSION,
                "expected_hash": wrong_hash,
                "actual_hash": e5_result["actual_hash"],
                "verified": e5_result["verified"],
                "status": e5_result["status"],
                "expected_status": "HASH_MISMATCH",
                "match": e5_result["status"] == "HASH_MISMATCH",
            },
        },
        "latency_statistics_n30": {
            "samples": n_verification_samples,
            "overall_verification_latency_ms": {
                "mean": round(lat_mean, 4),
                "median": round(lat_median, 4),
                "min": round(lat_min, 4),
                "max": round(lat_max, 4),
                "std_dev": round(lat_std, 4),
            },
            "on_chain_read_latency_ms": {
                "mean": round(read_mean, 4),
                "median": round(read_median, 4),
                "std_dev": round(read_std, 4),
            },
        },
        "invariants_verified": {
            "stage1_binary_sha256": precheck["stage1"]["sha256"],
            "stage1_invariant_preserved": precheck["stage1"]["sha256"] == EXPECTED_STAGE1_SHA256,
            "stage2_multiclass_sha256": precheck["stage2"]["sha256"],
            "stage2_invariant_preserved": precheck["stage2"]["sha256"] == EXPECTED_STAGE2_SHA256,
            "distinct_model_ids": STAGE2_MODEL_ID != precheck["stage1"]["model_id"],
            "fastapi_integration_performed": False,
            "remediation_implemented": False,
        },
        "overall_status": "PASS",
    }

    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results_payload, f, indent=2)

    print_banner(f"RESULTS EXPORTED TO {RESULTS_PATH.relative_to(REPO_ROOT)}", level=2)
    return results_payload


def main() -> int:
    """CLI entrypoint for Phase 7B.2 experiment."""
    try:
        run_stage2_provenance_experiment()
        print_banner("PHASE 7B.2 EXPERIMENT EXECUTED SUCCESSFULLY", level=1)
        return 0
    except Exception as exc:
        print(f"\n[FATAL ERROR] Phase 7B.2 experiment failed: {exc}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
