import React from 'react';

export function StatusBadge({ status }) {
  const normStatus = (status || 'UNKNOWN').toUpperCase();

  let badgeClass = 'badge-unverified';
  let label = normStatus;

  switch (normStatus) {
    case 'VERIFIED':
      badgeClass = 'badge-verified';
      label = '✓ Verified (On-Chain Match)';
      break;
    case 'HASH_MISMATCH':
      badgeClass = 'badge-mismatch';
      label = '⚠ Hash Mismatch (Untrusted)';
      break;
    case 'NOT_REGISTERED':
      badgeClass = 'badge-unregistered';
      label = '⚠ Not Registered';
      break;
    case 'BLOCKCHAIN_UNAVAILABLE':
      badgeClass = 'badge-unavailable';
      label = '✕ Blockchain Unavailable';
      break;
    case 'FILE_NOT_FOUND':
      badgeClass = 'badge-missing';
      label = '✕ File Not Found';
      break;
    case 'UNVERIFIED':
      badgeClass = 'badge-unverified';
      label = '○ Unverified (Pending)';
      break;
    default:
      badgeClass = 'badge-unverified';
      label = normStatus;
  }

  return (
    <span className={`badge ${badgeClass}`} data-testid="status-badge">
      {label}
    </span>
  );
}
