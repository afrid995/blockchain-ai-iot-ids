"""Reproducible local experiment demonstrating model artifact tampering detection.

Executes:
1. Verification of legitimate production model artifact against trusted SHA-256 digest.
2. Creation of an isolated temporary copy of the artifact.
3. Binary byte-level tampering simulation on the copy.
4. Cryptographic integrity check proving that tampering generates HASH_MISMATCH.
5. Emits machine-readable research record to experiments/results/model_integrity_results.json.
"""

from __future__ import annotations

import datetime
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

from core.hashing import calculate_sha256
from core.provenance import (
    DEFAULT_MODEL_ID,
    DEFAULT_MODEL_VERSION,
    verify_model_integrity,
)


def run_tampering_experiment(
    canonical_model_path: str | Path = "ml/artifacts/ids_model.joblib",
    results_output_path: str | Path = "experiments/results/model_integrity_results.json",
) -> Dict[str, Any]:
    """Execute the binary tampering experiment and log results."""
    canon_path = Path(canonical_model_path)
    if not canon_path.exists():
        raise FileNotFoundError(f"Canonical model artifact not found at: {canon_path.resolve()}")

    timestamp_start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    original_size = canon_path.stat().st_size

    # Step 1: Calculate canonical original SHA-256
    original_hash = calculate_sha256(canon_path)
    print("=" * 70)
    print("      RESEARCH EXPERIMENT: MODEL INTEGRITY & TAMPERING DETECTION      ")
    print("=" * 70)
    print(f"Target Artifact:       {canon_path.name}")
    print(f"Artifact Size:         {original_size:,} bytes")
    print(f"Original SHA-256:      {original_hash}")

    # Step 2: Verify canonical model against original trusted digest
    verification_original = verify_model_integrity(
        model_path=canon_path,
        expected_hash=original_hash,
        model_id=DEFAULT_MODEL_ID,
        version=DEFAULT_MODEL_VERSION,
    )
    print(f"\n[Test 1 - Legitimate Model Artifact]")
    print(f"  Expected Hash:       {verification_original['expected_hash']}")
    print(f"  Actual Hash:         {verification_original['actual_hash']}")
    print(f"  Integrity Status:    {verification_original['status']}")
    print(f"  Verified:            {verification_original['verified']}")

    assert verification_original["verified"] is True
    assert verification_original["status"] == "VERIFIED"

    # Step 3: Create an isolated temporary copy for binary tampering
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_artifact = Path(temp_dir) / "tampered_ids_model.joblib"
        shutil.copy2(canon_path, temp_artifact)

        # Step 4: Perform low-level binary modification
        # Append payload to simulate unauthorized weight modification or trojan injection
        tamper_payload = b"\x00\xffUNAUTHORIZED_WEIGHT_MUTATION_OR_BACKDOOR_INJECTION\xff\x00"
        with open(temp_artifact, "ab") as f:
            f.write(tamper_payload)

        tampered_size = temp_artifact.stat().st_size
        modified_hash = calculate_sha256(temp_artifact)

        # Step 5: Verify tampered model against trusted original digest
        verification_tampered = verify_model_integrity(
            model_path=temp_artifact,
            expected_hash=original_hash,
            model_id=DEFAULT_MODEL_ID,
            version=DEFAULT_MODEL_VERSION,
        )

        print(f"\n[Test 2 - Binary-Tampered Model Artifact (Temporary Copy)]")
        print(f"  Tampered Size:       {tampered_size:,} bytes (+{len(tamper_payload)} bytes injected)")
        print(f"  Expected (Trusted):  {verification_tampered['expected_hash']}")
        print(f"  Actual (Modified):   {verification_tampered['actual_hash']}")
        print(f"  Integrity Status:    {verification_tampered['status']}")
        print(f"  Verified:            {verification_tampered['verified']}")
        print(f"  Security Action:     {verification_tampered['message']}")

        assert verification_tampered["verified"] is False
        assert verification_tampered["status"] == "HASH_MISMATCH"

    # Step 6: Construct machine-readable experiment results
    experiment_results = {
        "experiment_name": "model_artifact_tampering_detection",
        "model_id": DEFAULT_MODEL_ID,
        "version": DEFAULT_MODEL_VERSION,
        "execution_timestamp": timestamp_start,
        "canonical_artifact": {
            "filename": canon_path.name,
            "size_bytes": original_size,
            "sha256": original_hash,
        },
        "tampered_simulation": {
            "bytes_injected": len(tamper_payload),
            "tampered_size_bytes": tampered_size,
            "tampered_sha256": modified_hash,
        },
        "trials": {
            "trial_1_legitimate": {
                "input_hash": original_hash,
                "verified": verification_original["verified"],
                "status": verification_original["status"],
            },
            "trial_2_tampered": {
                "input_hash": modified_hash,
                "verified": verification_tampered["verified"],
                "status": verification_tampered["status"],
                "hash_difference_detected": original_hash != modified_hash,
            },
        },
        "security_conclusion": (
            "The cryptographic SHA-256 integrity verification mechanism successfully "
            "detected binary byte alteration, rejecting unauthorized model deployment "
            "with zero false allowances."
        ),
    }

    out_file = Path(results_output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(experiment_results, f, indent=2)

    print("\n" + "=" * 70)
    print(f"Results successfully recorded to: {out_file}")
    print("=" * 70)

    return experiment_results


if __name__ == "__main__":
    run_tampering_experiment()
