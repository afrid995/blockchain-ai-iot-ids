"""Evaluation metrics computation for binary IoT network intrusion detection.

Calculates actual, un-fabricated metrics: Accuracy, Precision, Recall (TPR),
F1-Score, False Positive Rate (FPR), Specificity (TNR), ROC-AUC, and Confusion Matrix.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """Calculate comprehensive evaluation metrics from true and predicted binary labels.

    Label encoding convention:
      0 = Benign / Normal
      1 = Malicious / Attack
    """
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    total_samples = int(len(y_true))
    accuracy = float(accuracy_score(y_true, y_pred))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))  # True Positive Rate
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    # False Positive Rate = FP / (FP + TN)
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    # Specificity = TN / (TN + FP)
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

    roc_auc = None
    if y_prob is not None:
        try:
            roc_auc = float(roc_auc_score(y_true, y_prob))
        except Exception:
            roc_auc = None

    class_report = classification_report(
        y_true,
        y_pred,
        target_names=["Benign (0)", "Attack (1)"],
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "total_test_samples": total_samples,
        "true_negatives": tn,
        "false_positives": fp,
        "false_negatives": fn,
        "true_positives": tp,
        "confusion_matrix": [[tn, fp], [fn, tp]],
        "accuracy": round(accuracy, 6),
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1_score": round(f1, 6),
        "false_positive_rate": round(fpr, 6),
        "specificity": round(specificity, 6),
        "roc_auc": round(roc_auc, 6) if roc_auc is not None else None,
        "classification_report": class_report,
    }

    return metrics


def print_evaluation_summary(metrics: Dict[str, Any]) -> None:
    """Print a clean academic-style performance report."""
    print("=" * 65)
    print("        INTRUSION DETECTION SYSTEM — EVALUATION REPORT        ")
    print("=" * 65)
    print(f"Total Test Samples:      {metrics['total_test_samples']:,}")
    print(f"Accuracy:                {metrics['accuracy'] * 100:.2f}%")
    print(f"Precision:               {metrics['precision'] * 100:.2f}%")
    print(f"Recall (Detection Rate): {metrics['recall'] * 100:.2f}%")
    print(f"F1-Score:                {metrics['f1_score'] * 100:.2f}%")
    print(f"False Positive Rate:     {metrics['false_positive_rate'] * 100:.2f}%")
    print(f"Specificity (TNR):       {metrics['specificity'] * 100:.2f}%")
    if metrics["roc_auc"] is not None:
        print(f"ROC-AUC:                 {metrics['roc_auc']:.4f}")
    print("-" * 65)
    print("Confusion Matrix:")
    print(f"  [TN={metrics['true_negatives']:<7}  FP={metrics['false_positives']:<7}]")
    print(f"  [FN={metrics['false_negatives']:<7}  TP={metrics['true_positives']:<7}]")
    print("=" * 65)
