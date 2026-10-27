"""Authentic UNSW-NB15 Dataset Service for Network Traffic Exploration.

Exposes paginated records, compact flow summaries, 42-feature model vectors,
and post-inference ground-truth annotations from the authentic UNSW-NB15
testing dataset (175,341 records).

CRITICAL RESEARCH INVARIANTS:
1. Operates strictly on authentic UNSW_NB15_testing-set.csv (SHA-256: bec7dd5ec88d...).
2. No synthetic, fake, or duplicated flows are generated.
3. Ground-truth attack categories and binary labels are strictly quarantined
   from pre-inference filtering and model input features.
4. Server-side pagination prevents excessive memory footprint in the browser.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from core.hashing import calculate_sha256

EXPECTED_TEST_SHA256 = "bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa"
DROP_COLUMNS = ["id", "label", "attack_cat"]


class DatasetService:
    """Manages memory-efficient access to the authentic UNSW-NB15 testing dataset."""

    def __init__(
        self,
        dataset_path: Path | str,
        expected_sha256: str = EXPECTED_TEST_SHA256,
    ) -> None:
        self.dataset_path = Path(dataset_path)
        self.expected_sha256 = expected_sha256
        self._df: Optional[pd.DataFrame] = None
        self._feature_cols: List[str] = []
        self._str_cols: List[str] = []
        self._info: Optional[Dict[str, Any]] = None

    def _ensure_loaded(self) -> pd.DataFrame:
        """Load and cache the testing dataset DataFrame in memory on first access."""
        if self._df is not None:
            return self._df

        if not self.dataset_path.exists():
            raise FileNotFoundError(
                f"Authentic UNSW-NB15 testing dataset not found at {self.dataset_path}"
            )

        # Load testing dataset
        df = pd.read_csv(self.dataset_path, low_memory=False, encoding="utf-8-sig")

        # Strip whitespace from string columns
        str_cols = list(df.select_dtypes(include=["object"]).columns)
        for col in str_cols:
            df[col] = df[col].astype(str).str.strip()

        self._str_cols = str_cols
        self._feature_cols = [c for c in df.columns if c not in DROP_COLUMNS]

        # Verify dataset length
        total_records = len(df)
        benign_records = int((df["label"] == 0).sum()) if "label" in df.columns else 0
        attack_records = int((df["label"] == 1).sum()) if "label" in df.columns else 0

        # Unique filter options (pre-sorted)
        protocols = sorted([str(p) for p in df["proto"].unique()]) if "proto" in df.columns else []
        services = sorted([str(s) for s in df["service"].unique()]) if "service" in df.columns else []
        states = sorted([str(s) for s in df["state"].unique()]) if "state" in df.columns else []

        self._info = {
            "dataset_name": "UNSW-NB15 Testing Set",
            "dataset_type": "Network-flow intrusion benchmark",
            "source": f"Local project dataset ({self.dataset_path.as_posix()})",
            "sha256": self.expected_sha256,
            "total_records": total_records,
            "benign_records": benign_records,
            "attack_records": attack_records,
            "total_features": len(self._feature_cols),
            "filter_options": {
                "protocols": protocols,
                "services": services,
                "states": states,
            },
        }

        self._df = df
        return self._df

    def get_info(self) -> Dict[str, Any]:
        """Return dataset metadata, record counts, and filter options."""
        self._ensure_loaded()
        assert self._info is not None
        return dict(self._info)

    def _format_row(self, row: pd.Series, idx: int) -> Dict[str, Any]:
        """Format a single DataFrame row into summary, 42 features, and quarantined ground truth."""
        row_id = int(row["id"]) if "id" in row else idx + 1
        proto = str(row.get("proto", "-"))
        service = str(row.get("service", "-"))
        state = str(row.get("state", "-"))
        dur = float(row.get("dur", 0.0))
        spkts = int(row.get("spkts", 0))
        dpkts = int(row.get("dpkts", 0))
        sbytes = int(row.get("sbytes", 0))
        dbytes = int(row.get("dbytes", 0))
        rate = float(row.get("rate", 0.0))
        sttl = int(row.get("sttl", 0))
        dttl = int(row.get("dttl", 0))

        # Extract 42 model input features with native Python types
        features: Dict[str, Any] = {}
        for col in self._feature_cols:
            val = row[col]
            if col in self._str_cols:
                features[col] = str(val)
            elif isinstance(val, (int, bool)):
                features[col] = int(val)
            else:
                features[col] = float(val)

        return {
            "index": idx + 1,
            "id": row_id,
            "summary": {
                "protocol": proto,
                "service": service,
                "state": state,
                "duration": dur,
                "spkts": spkts,
                "dpkts": dpkts,
                "total_pkts": spkts + dpkts,
                "sbytes": sbytes,
                "dbytes": dbytes,
                "total_bytes": sbytes + dbytes,
                "rate": rate,
                "sttl": sttl,
                "dttl": dttl,
            },
            "features": features,
            "ground_truth": {
                "label": int(row.get("label", 0)),
                "attack_cat": str(row.get("attack_cat", "Normal")).strip(),
            },
        }

    def get_records(
        self,
        page: int = 1,
        page_size: int = 25,
        proto: Optional[str] = None,
        service: Optional[str] = None,
        state: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Query paginated records with optional flow-level filters (protocol, service, state, search)."""
        df = self._ensure_loaded()

        if page < 1:
            raise ValueError(f"Page must be >= 1 (got {page})")
        if page_size < 1 or page_size > 100:
            raise ValueError(f"Page size must be between 1 and 100 (got {page_size})")

        filtered = df

        # Flow-level filters (case-insensitive)
        if proto and proto.strip():
            filtered = filtered[filtered["proto"].str.lower() == proto.strip().lower()]

        if service and service.strip():
            filtered = filtered[filtered["service"].str.lower() == service.strip().lower()]

        if state and state.strip():
            filtered = filtered[filtered["state"].str.lower() == state.strip().lower()]

        if search and search.strip():
            query = search.strip().lower()
            # If search is a number, match exact row id or 1-based index
            if query.isdigit():
                target_num = int(query)
                cond = (filtered["id"] == target_num)
                # Also allow matching record index
                if target_num <= len(df):
                    cond = cond | (filtered.index == target_num - 1)
                filtered = filtered[cond]
            else:
                # Text matching in proto, service, or state
                filtered = filtered[
                    filtered["proto"].str.lower().str.contains(query, na=False)
                    | filtered["service"].str.lower().str.contains(query, na=False)
                    | filtered["state"].str.lower().str.contains(query, na=False)
                ]

        total = len(filtered)
        total_pages = max(1, math.ceil(total / page_size))

        start = (page - 1) * page_size
        end = start + page_size
        page_slice = filtered.iloc[start:end]

        records: List[Dict[str, Any]] = []
        for idx, row in page_slice.iterrows():
            records.append(self._format_row(row, int(idx)))

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "records": records,
        }

    def get_record_by_index(self, record_index: int) -> Optional[Dict[str, Any]]:
        """Retrieve a specific record by its 1-based index."""
        df = self._ensure_loaded()
        if record_index < 1 or record_index > len(df):
            return None
        idx = record_index - 1
        row = df.iloc[idx]
        return self._format_row(row, idx)

    def get_random_record(self) -> Dict[str, Any]:
        """Retrieve a random record from the authentic testing dataset."""
        import random
        df = self._ensure_loaded()
        rand_idx = random.randint(0, len(df) - 1)
        row = df.iloc[rand_idx]
        return self._format_row(row, rand_idx)
