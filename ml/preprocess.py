"""Research-safe preprocessing pipeline for UNSW-NB15 intrusion detection.

Ensures zero data leakage: transformations (scaling, encoding, imputation)
are strictly fit on training data and subsequently applied to test/inference data.
"""

from __future__ import annotations

from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Standard columns that should never be fed as predictive inputs
IDENTIFIER_COLUMNS = ["id"]
LABEL_COLUMNS = ["label", "attack_cat"]


class ReplaceInfTransformer(BaseEstimator, TransformerMixin):
    """Transformer that converts +/- infinity to NaN for downstream imputation."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            return X.replace([np.inf, -np.inf], np.nan)
        arr = np.asarray(X)
        if np.issubdtype(arr.dtype, np.number):
            return np.where(np.isinf(arr), np.nan, arr)
        return X


def extract_features_and_target(
    df: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.Series, List[str], List[str]]:
    """Separate input features and the binary classification target.

    Drops sequential IDs and target annotations to eliminate target leakage.
    Returns:
        (X, y, categorical_cols, numerical_cols)
    """
    if "label" not in df.columns:
        raise ValueError("Target column 'label' not found in DataFrame.")

    y = df["label"].astype(int)

    # Exclude non-predictive identifiers and ground truth label columns
    cols_to_drop = [c for c in IDENTIFIER_COLUMNS + LABEL_COLUMNS if c in df.columns]
    X = df.drop(columns=cols_to_drop).copy()

    # Identify column data types
    categorical_cols = list(X.select_dtypes(include=["object", "category"]).columns)
    numerical_cols = list(X.select_dtypes(include=["number"]).columns)

    return X, y, categorical_cols, numerical_cols


def build_preprocessor(
    categorical_cols: List[str],
    numerical_cols: List[str]
) -> ColumnTransformer:
    """Construct an unfitted ColumnTransformer for numerical and categorical features.

    Numerical pipeline:
      - ReplaceInfTransformer to map +/- inf to nan
      - SimpleImputer with median strategy
      - StandardScaler for unit variance and zero mean

    Categorical pipeline:
      - SimpleImputer with constant 'missing'
      - OneHotEncoder with handle_unknown='ignore' to gracefully handle novel protocol states
    """
    numeric_transformer = Pipeline(
        steps=[
            ("inf_handler", ReplaceInfTransformer()),
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numerical_cols),
            ("cat", categorical_transformer, categorical_cols),
        ],
        remainder="drop",
    )

    return preprocessor


def build_full_pipeline(
    categorical_cols: List[str],
    numerical_cols: List[str],
    classifier: object
) -> Pipeline:
    """Construct a complete, leak-free Scikit-Learn Pipeline combining preprocessing and classifier.

    Ensures single-artifact serialization and atomic train/inference execution.
    """
    preprocessor = build_preprocessor(categorical_cols, numerical_cols)
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )
    return pipeline
