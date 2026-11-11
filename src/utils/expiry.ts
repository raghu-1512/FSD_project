import { Batch, ExpiryStatus } from '../types';

/**
 * Calculates remaining days between a target date and the reference date (or current date).
 * Normalized to midnight to avoid time-of-day offsets.
 */
export function calculateDaysRemaining(expiryDateStr: string, referenceDate: Date = new Date()): number {
  if (!expiryDateStr) return 0;
  
  const expiry = new Date(expiryDateStr);
  // Reset time portions for pure calendar-day comparison
  const expDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();

  const diffTime = expDay - refDay;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns the expiry status based on days remaining:
 * > 90 days: Safe
 * 31 to 90 days: Expiring Later
 * 1 to 30 days: Expiring Soon
 * <= 0 days: Expired
 */
export function getExpiryStatus(daysRemaining: number): ExpiryStatus {
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring_soon';
  if (daysRemaining <= 90) return 'expiring_later';
  return 'safe';
}

export interface BatchCalculatedStatus {
  daysRemaining: number;
  expiryStatus: ExpiryStatus;
  isExpired: boolean;
  isRecalled: boolean;
  isAvailableForSale: boolean;
  statusLabel: string;
}

export function evaluateBatchStatus(batch: Batch, referenceDate: Date = new Date()): BatchCalculatedStatus {
  const daysRemaining = calculateDaysRemaining(batch.expiryDate, referenceDate);
  const expiryStatus = getExpiryStatus(daysRemaining);
  const isExpired = daysRemaining <= 0;
  const isRecalled = Boolean(batch.isRecalled);
  const isAvailableForSale = !isExpired && !isRecalled;

  let statusLabel = 'Safe';
  if (isRecalled) {
    statusLabel = 'Recalled';
  } else if (isExpired) {
    statusLabel = 'Expired';
  } else if (expiryStatus === 'expiring_soon') {
    statusLabel = 'Expiring Soon';
  } else if (expiryStatus === 'expiring_later') {
    statusLabel = 'Expiring Later';
  }

  return {
    daysRemaining,
    expiryStatus,
    isExpired,
    isRecalled,
    isAvailableForSale,
    statusLabel,
  };
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
