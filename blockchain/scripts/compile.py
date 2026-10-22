"""Solidity compilation script for ModelRegistry smart contract.

Uses solcx to compile ModelRegistry.sol and saves the ABI and Bytecode
to blockchain/artifacts/ModelRegistry.json.
"""

from __future__ import annotations

import json
from pathlib import Path

import solcx


def compile_contract(
    contract_file: str | Path = "blockchain/contracts/ModelRegistry.sol",
    output_dir: str | Path = "blockchain/artifacts",
    solc_version: str = "0.8.20",
) -> Path:
    contract_path = Path(contract_file)
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not contract_path.exists():
        raise FileNotFoundError(f"Contract file not found at: {contract_path.resolve()}")

    # Ensure solc compiler version is available
    installed = solcx.get_installed_solc_versions()
    if not any(str(v).startswith("0.8.20") for v in installed):
        print(f"Installing solc {solc_version}...")
        solcx.install_solc(solc_version)

    solcx.set_solc_version(solc_version)

    print(f"Compiling {contract_path.name} with solc {solc_version}...")
    compiled = solcx.compile_files(
        [str(contract_path)],
        output_values=["abi", "bin"],
        solc_version=solc_version,
    )

    # Locate ModelRegistry in compilation output
    key = None
    for k in compiled.keys():
        if "ModelRegistry" in k:
            key = k
            break

    if not key:
        raise ValueError(f"Could not locate ModelRegistry contract in compiled output: {list(compiled.keys())}")

    contract_data = {
        "contractName": "ModelRegistry",
        "solcVersion": solc_version,
        "abi": compiled[key]["abi"],
        "bytecode": compiled[key]["bin"],
    }

    out_file = out_dir / "ModelRegistry.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(contract_data, f, indent=2)

    print(f"Compilation successful! Artifact saved to: {out_file}")
    return out_file


if __name__ == "__main__":
    compile_contract()
