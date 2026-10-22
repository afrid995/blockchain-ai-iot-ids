from pathlib import Path
from ml.dataset import load_raw_dataset, inspect_dataset, compute_file_sha256

for fname in ['UNSW_NB15_training-set.csv', 'UNSW_NB15_testing-set.csv']:
    path = Path('data/raw') / fname
    sha = compute_file_sha256(path)
    df = load_raw_dataset(path)
    info = inspect_dataset(df, dataset_name=fname)
    print(f"=== INSPECTION FOR {fname} ===")
    print(f"File Size: {path.stat().st_size:,} bytes")
    print(f"SHA-256: {sha}")
    print(f"Rows: {info['total_rows']:,}, Columns: {info['total_columns']}")
    print(f"All Column Names ({len(info['column_names'])}): {info['column_names']}")
    print(f"Target Column: 'label' (Binary: 0=Benign, 1=Malicious) and 'attack_cat' (Subcategory)")
    print(f"Categorical Features ({len(info['categorical_features'])}): {info['categorical_features']}")
    print(f"Numerical Features ({len(info['numerical_features'])}): {info['numerical_features']}")
    print(f"Missing Values: {info['total_missing_values']}")
    print(f"Infinite Values: {info['infinite_values']}")
    print(f"Duplicates: {info['duplicate_rows']:,}")
    print(f"Binary Label Distribution: {info['binary_label_distribution']}")
    print(f"Attack Category Distribution: {info['attack_category_distribution']}")
    print(f"Data Leakage Risks: {info['data_leakage_risks']}")
    print("-" * 60)
