"""Cryptographic hashing utilities for artifact provenance and integrity verification.

Implements streaming SHA-256 calculation to guarantee deterministic,
low-memory digests across artifacts of arbitrary size.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Union


def calculate_sha256(file_path: Union[str, Path], chunk_size: int = 65536) -> str:
    """Calculate the deterministic SHA-256 hexadecimal digest of a file.

    Args:
        file_path: Path to the target file.
        chunk_size: Size of memory buffer chunks in bytes (default 64 KB).

    Returns:
        A 64-character lowercase hexadecimal SHA-256 digest.

    Raises:
        FileNotFoundError: If the file does not exist on disk.
        IsADirectoryError: If the specified path is a directory.
        ValueError: If chunk_size is less than 1.
    """
    if chunk_size < 1:
        raise ValueError("chunk_size must be a positive integer greater than zero.")

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Target file for hashing does not exist: {path.resolve()}")

    if path.is_dir():
        raise IsADirectoryError(f"Target path is a directory, not a file: {path.resolve()}")

    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            hasher.update(chunk)

    digest = hasher.hexdigest().lower()
    return digest


def calculate_bytes_sha256(data: bytes) -> str:
    """Calculate the SHA-256 digest of raw byte content."""
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError(f"Expected bytes or bytearray, got {type(data).__name__}")
    return hashlib.sha256(data).hexdigest().lower()


def is_valid_sha256(digest: str) -> bool:
    """Check if a string is a valid 64-character hexadecimal SHA-256 digest."""
    if not isinstance(digest, str) or len(digest) != 64:
        return False
    return all(c in "0123456789abcdefABCDEF" for c in digest)
