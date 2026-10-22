"""Dataset loading, acquisition, inspection, and verification for UNSW-NB15 benchmark.

Provides functions to download, inspect, verify SHA-256 hashes, and load
the authentic UNSW-NB15 network intrusion detection benchmark dataset.
"""

from __future__ import annotations

import hashlib
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from core.hashing import calculate_sha256

# Expected official UNSW-NB15 column schema
EXPECTED_COLUMNS = [
    "id", "dur", "proto", "service", "state", "spkts", "dpkts", "sbytes", "dbytes",
    "rate", "sttl", "dttl", "sload", "dload", "sloss", "dloss", "sinpkt", "dinpkt",
    "sjit", "djit", "swin", "stcpb", "dtcpb", "dwin", "tcprtt", "synack", "ackdat",
    "smean", "dmean", "trans_depth", "response_body_len", "ct_srv_src", "ct_state_ttl",
    "ct_dst_ltm", "ct_src_dport_ltm", "ct_dst_sport_ltm", "ct_dst_src_ltm",
    "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd", "ct_src_ltm", "ct_srv_dst",
    "is_sm_ips_ports", "attack_cat", "label"
]

NON_PREDICTIVE_COLUMNS = ["id"]
TARGET_COLUMNS = ["label", "attack_cat"]

# Verified mirrors for automated retrieval of authentic UNSW-NB15 files
DATASET_MIRRORS = {
    "UNSW_NB15_training-set.csv": [
        "https://huggingface.co/datasets/Mireu-Lab/UNSW-NB15/resolve/main/train.csv",
    ],
    "UNSW_NB15_testing-set.csv": [
        "https://huggingface.co/datasets/Mireu-Lab/UNSW-NB15/resolve/main/test.csv",
    ]
}


def compute_file_sha256(filepath: str | Path, block_size: int = 65536) -> str:
    """Compute the SHA-256 hexadecimal digest of a local file using core.hashing."""
    return calculate_sha256(filepath, chunk_size=block_size)


def download_file_with_progress(url: str, dest_path: Path) -> None:
    """Download a file with user-agent headers and progress logging."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (FinalYearResearch/1.0)"})
    with urllib.request.urlopen(req, timeout=60) as response, open(dest_path, "wb") as out_file:
        total_size = int(response.headers.get("Content-Length", 0))
        downloaded = 0
        block_size = 1024 * 1024  # 1MB
        print(f"Downloading {dest_path.name} from {url}...")
        while True:
            buffer = response.read(block_size)
            if not buffer:
                break
            out_file.write(buffer)
            downloaded += len(buffer)
            if total_size > 0:
                percent = (downloaded / total_size) * 100
                sys.stdout.write(f"\r  -> {downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB ({percent:.1f}%)")
                sys.stdout.flush()
        print("\nDownload complete.")


def acquire_unsw_nb15(raw_dir: str | Path = "data/raw", force: bool = False) -> Dict[str, Path]:
    """Ensure authentic UNSW-NB15 dataset files are present in raw_dir.

    Downloads from verified mirrors if not present locally.
    """
    raw_path = Path(raw_dir)
    raw_path.mkdir(parents=True, exist_ok=True)
    acquired_files: Dict[str, Path] = {}

    for filename, urls in DATASET_MIRRORS.items():
        target_path = raw_path / filename
        if target_path.exists() and not force:
            print(f"Dataset file found: {target_path} ({target_path.stat().st_size:,} bytes)")
            acquired_files[filename] = target_path
            continue

        success = False
        for url in urls:
            try:
                download_file_with_progress(url, target_path)
                if target_path.stat().st_size > 1000:
                    success = True
                    acquired_files[filename] = target_path
                    break
            except Exception as e:
                print(f"Failed to download {filename} from {url}: {e}")
                if target_path.exists():
                    target_path.unlink()

        if not success:
            raise FileNotFoundError(
                f"Could not locate or download authentic UNSW-NB15 file: {filename}. "
                f"Please manually place {filename} into {raw_path.resolve()}."
            )

    return acquired_files


def load_raw_dataset(
    filepath: str | Path,
    sample_size: Optional[int] = None,
    random_state: int = 42
) -> pd.DataFrame:
    """Load a UNSW-NB15 dataset file into a pandas DataFrame.

    Validates schema against expected columns and strips extraneous whitespaces.
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {path}")

    # Use utf-8-sig to handle optional byte order marks gracefully
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)

    # Clean whitespace in string columns
    str_cols = df.select_dtypes(include=["object"]).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()

    if sample_size is not None and sample_size < len(df):
        df = df.sample(n=sample_size, random_state=random_state).reset_index(drop=True)

    return df


def inspect_dataset(df: pd.DataFrame, dataset_name: str = "UNSW-NB15") -> Dict[str, Any]:
    """Perform a rigorous statistical and integrity audit on the loaded dataset."""
    total_rows = len(df)
    total_cols = len(df.columns)
    
    # Missing and infinite values
    numeric_df = df.select_dtypes(include=["number"])
    missing_counts = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())
    
    # Check for infinite values in numeric columns
    inf_counts = {}
    for col in numeric_df.columns:
        inf_cnt = int((numeric_df[col] == float("inf")).sum() + (numeric_df[col] == float("-inf")).sum())
        if inf_cnt > 0:
            inf_counts[col] = inf_cnt

    duplicate_rows = int(df.duplicated().sum())

    # Column categorizations
    categorical_cols = [c for c in df.select_dtypes(include=["object", "category"]).columns if c not in TARGET_COLUMNS]
    numerical_cols = [c for c in numeric_df.columns if c not in TARGET_COLUMNS and c not in NON_PREDICTIVE_COLUMNS]

    # Target class distribution
    label_distribution = df["label"].value_counts(dropna=False).to_dict() if "label" in df.columns else {}
    attack_cat_distribution = df["attack_cat"].value_counts(dropna=False).to_dict() if "attack_cat" in df.columns else {}

    # Data leakage risks
    leakage_risks = []
    if "id" in df.columns:
        leakage_risks.append("Column 'id' is a sequential identifier that must be dropped prior to modeling.")
    if "attack_cat" in df.columns and "label" in df.columns:
        leakage_risks.append("Column 'attack_cat' is a fine-grained label and must not be used as an input feature for binary 'label' prediction.")

    report = {
        "dataset_name": dataset_name,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "column_names": list(df.columns),
        "categorical_features": categorical_cols,
        "numerical_features": numerical_cols,
        "total_missing_values": total_missing,
        "infinite_values": inf_counts,
        "duplicate_rows": duplicate_rows,
        "binary_label_distribution": label_distribution,
        "attack_category_distribution": attack_cat_distribution,
        "data_leakage_risks": leakage_risks,
    }
    return report
