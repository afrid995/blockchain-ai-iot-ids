"""Blockchain client and Web3 connector for AI model provenance.

Interacts with the ModelRegistry Solidity smart contract, converting SHA-256
hexadecimal digests into bytes32 on-chain commitments and verifying local model
artifacts against decentralized on-chain records.
"""

from __future__ import annotations

import datetime
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from web3 import EthereumTesterProvider, Web3
from web3.exceptions import ContractLogicError, Web3Exception

from core.hashing import calculate_sha256, is_valid_sha256

DEFAULT_RPC_URL = "http://127.0.0.1:8545"
DEFAULT_ARTIFACT_PATH = "blockchain/artifacts/ModelRegistry.json"
DEFAULT_DEPLOYMENT_PATH = "blockchain/deployment/deployment.json"


def hex_to_bytes32(hex_digest: str) -> bytes:
    """Convert a 64-character SHA-256 hexadecimal string into 32 binary bytes."""
    clean = hex_digest.strip().lower()
    if clean.startswith("0x"):
        clean = clean[2:]
    if len(clean) != 64:
        raise ValueError(f"Expected 64 hex characters (32 bytes), got length {len(clean)}")
    return bytes.fromhex(clean)


def bytes32_to_hex(b: Union[bytes, str]) -> str:
    """Convert a 32-byte binary object into a 64-character lowercase hexadecimal string."""
    if isinstance(b, str):
        clean = b.strip().lower()
        if clean.startswith("0x"):
            clean = clean[2:]
        return clean
    return b.hex().lower()


class BlockchainRegistryClient:
    """Python Web3 client for interacting with the ModelRegistry smart contract."""

    def __init__(
        self,
        provider: Optional[Union[Web3.HTTPProvider, EthereumTesterProvider]] = None,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None,
        artifact_path: str | Path = DEFAULT_ARTIFACT_PATH,
    ):
        self.artifact_path = Path(artifact_path)
        self.w3 = self._init_web3(provider, rpc_url)
        self.contract_address = contract_address
        self.contract = None
        self.abi = []
        self.bytecode = ""

        self._load_artifact()

        if self.contract_address and self.abi:
            checksummed = Web3.to_checksum_address(self.contract_address)
            self.contract = self.w3.eth.contract(address=checksummed, abi=self.abi)

    def _init_web3(
        self,
        provider: Optional[Any],
        rpc_url: Optional[str],
    ) -> Web3:
        if provider is not None:
            w3 = Web3(provider)
            if w3.is_connected():
                return w3

        # Attempt to connect to local HTTP RPC if specified or available
        target_rpc = rpc_url or DEFAULT_RPC_URL
        try:
            http_w3 = Web3(Web3.HTTPProvider(target_rpc, request_kwargs={"timeout": 1}))
            if http_w3.is_connected():
                return http_w3
        except Exception:
            pass

        # In-process deterministic EthereumTesterProvider (Zero external dependencies)
        tester_provider = EthereumTesterProvider()
        return Web3(tester_provider)

    def _load_artifact(self) -> None:
        if self.artifact_path.exists():
            with open(self.artifact_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.abi = data.get("abi", [])
                self.bytecode = data.get("bytecode", "")

    def is_connected(self) -> bool:
        """Check if Web3 connection to the underlying EVM is active."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def deploy_contract(
        self,
        sender: Optional[str] = None,
        deployment_file: Optional[str | Path] = DEFAULT_DEPLOYMENT_PATH,
    ) -> Dict[str, Any]:
        """Deploy the ModelRegistry contract to the connected EVM network.

        Measures actual deployment latency, block number, and gas consumed.
        """
        if not self.is_connected():
            raise ConnectionError("Cannot deploy: Web3 is not connected to any EVM provider.")

        if not self.abi or not self.bytecode:
            raise ValueError(f"Contract artifact missing ABI or bytecode at {self.artifact_path}")

        deployer = sender or self.w3.eth.accounts[0]
        contract_factory = self.w3.eth.contract(abi=self.abi, bytecode=self.bytecode)

        t_start = time.perf_counter()
        tx_hash = contract_factory.constructor().transact({"from": deployer})
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        deploy_latency = time.perf_counter() - t_start

        self.contract_address = receipt.contractAddress
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)

        deployment_info = {
            "network": "local-evm",
            "contract_name": "ModelRegistry",
            "contract_address": self.contract_address,
            "deployer_address": deployer,
            "transaction_hash": receipt.transactionHash.hex(),
            "block_number": int(receipt.blockNumber),
            "gas_used": int(receipt.gasUsed),
            "deployment_latency_seconds": round(deploy_latency, 6),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        if deployment_file:
            dep_path = Path(deployment_file)
            dep_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dep_path, "w", encoding="utf-8") as f:
                json.dump(deployment_info, f, indent=2)

        return deployment_info

    def register_model(
        self,
        model_id: str,
        version: str,
        model_hash_hex: str,
        algorithm: str,
        sender: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Register a trusted model on-chain with its 32-byte SHA-256 digest."""
        if not self.contract:
            raise RuntimeError("ModelRegistry contract is not loaded or deployed.")

        clean_hash = model_hash_hex.strip().lower()
        if not is_valid_sha256(clean_hash):
            raise ValueError(f"Invalid SHA-256 hash string: {model_hash_hex}")

        caller = sender or self.w3.eth.accounts[0]
        hash_bytes32 = hex_to_bytes32(clean_hash)

        t_start = time.perf_counter()
        try:
            tx_hash = self.contract.functions.registerModel(
                model_id,
                version,
                hash_bytes32,
                algorithm,
            ).transact({"from": caller})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            tx_latency = time.perf_counter() - t_start
        except Exception as e:
            raise ValueError(f"Smart contract rejected registration: {e}")

        return {
            "model_id": model_id,
            "version": version,
            "registered_hash": clean_hash,
            "algorithm": algorithm,
            "registrant": caller,
            "transaction_hash": receipt.transactionHash.hex(),
            "block_number": int(receipt.blockNumber),
            "gas_used": int(receipt.gasUsed),
            "transaction_latency_seconds": round(tx_latency, 6),
            "status": "SUCCESS" if receipt.status == 1 else "FAILED",
        }

    def is_registered(self, model_id: str, version: str) -> bool:
        """Query contract to determine whether model_id:version exists."""
        if not self.contract:
            raise RuntimeError("ModelRegistry contract is not loaded or deployed.")
        return bool(self.contract.functions.isModelRegistered(model_id, version).call())

    def get_model(self, model_id: str, version: str) -> Dict[str, Any]:
        """Retrieve on-chain model provenance record."""
        if not self.contract:
            raise RuntimeError("ModelRegistry contract is not loaded or deployed.")

        t_start = time.perf_counter()
        record = self.contract.functions.getModelRecord(model_id, version).call()
        read_latency_ms = (time.perf_counter() - t_start) * 1000.0

        ret_id, ret_ver, ret_hash_b, ret_algo, ret_ts, ret_registrant = record
        ret_hash_hex = bytes32_to_hex(ret_hash_b)

        return {
            "model_id": ret_id,
            "version": ret_ver,
            "model_hash": ret_hash_hex,
            "algorithm": ret_algo,
            "registered_at": int(ret_ts),
            "registrant": ret_registrant,
            "read_latency_ms": round(read_latency_ms, 4),
        }

    def verify_model_against_blockchain(
        self,
        model_path: Union[str, Path],
        model_id: str,
        version: str,
    ) -> Dict[str, Any]:
        """Perform zero-trust verification of a local artifact against the on-chain registry.

        Returns structured verification outcome:
        - VERIFIED: Local hash matches on-chain registered hash
        - HASH_MISMATCH: Local hash does NOT match on-chain hash
        - NOT_REGISTERED: Model ID or version has not been registered on-chain
        - FILE_NOT_FOUND: Local model artifact file does not exist
        - BLOCKCHAIN_UNAVAILABLE: Connection to EVM failed
        """
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        path = Path(model_path)

        # 1. Connection check
        if not self.is_connected() or not self.contract:
            return {
                "verified": False,
                "status": "BLOCKCHAIN_UNAVAILABLE",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": None,
                "registered_hash": None,
                "contract_address": self.contract_address,
                "read_latency_ms": 0.0,
                "timestamp": timestamp,
                "message": "EVM node or ModelRegistry contract is currently unreachable.",
            }

        # 2. Local file existence check
        if not path.exists() or path.is_dir():
            return {
                "verified": False,
                "status": "FILE_NOT_FOUND",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": None,
                "registered_hash": None,
                "contract_address": self.contract_address,
                "read_latency_ms": 0.0,
                "timestamp": timestamp,
                "message": f"Local model artifact not found at {path.resolve()}",
            }

        # 3. Calculate local SHA-256
        local_hash = calculate_sha256(path)

        # 4. Check on-chain registration
        t_start = time.perf_counter()
        try:
            is_reg = self.is_registered(model_id, version)
        except Exception as e:
            return {
                "verified": False,
                "status": "BLOCKCHAIN_UNAVAILABLE",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": local_hash,
                "registered_hash": None,
                "contract_address": self.contract_address,
                "read_latency_ms": 0.0,
                "timestamp": timestamp,
                "message": f"Blockchain query failed: {e}",
            }

        if not is_reg:
            read_latency_ms = (time.perf_counter() - t_start) * 1000.0
            return {
                "verified": False,
                "status": "NOT_REGISTERED",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": local_hash,
                "registered_hash": None,
                "contract_address": self.contract_address,
                "read_latency_ms": round(read_latency_ms, 4),
                "timestamp": timestamp,
                "message": f"Model '{model_id}' version '{version}' is not registered on-chain.",
            }

        # 5. Retrieve registered hash
        on_chain_record = self.get_model(model_id, version)
        registered_hash = on_chain_record["model_hash"]
        read_latency_ms = (time.perf_counter() - t_start) * 1000.0

        # 6. Cryptographic comparison
        if local_hash.lower() == registered_hash.lower():
            return {
                "verified": True,
                "status": "VERIFIED",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": local_hash,
                "registered_hash": registered_hash,
                "contract_address": self.contract_address,
                "read_latency_ms": round(read_latency_ms, 4),
                "timestamp": timestamp,
                "message": "Local model artifact matches on-chain trusted provenance hash.",
            }
        else:
            return {
                "verified": False,
                "status": "HASH_MISMATCH",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": local_hash,
                "registered_hash": registered_hash,
                "contract_address": self.contract_address,
                "read_latency_ms": round(read_latency_ms, 4),
                "timestamp": timestamp,
                "message": (
                    "CRITICAL SECURITY ALERT: Local artifact SHA-256 differs from "
                    "blockchain-registered hash! Model is untrusted and rejected."
                ),
            }
