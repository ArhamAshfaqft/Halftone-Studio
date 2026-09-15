/**
 * Gumroad License Key Verification Engine for Halftone Studio.
 */

export const GUMROAD_PRODUCT_ID = 'DSmaPzQfRhVyw-LVGp2s8w==';
const STORAGE_KEY = 'halftone_studio_license';

export interface LicenseInfo {
  key: string;
  email: string;
  productName?: string;
  purchaseDate?: string;
  verifiedAt: number;
  uses?: number;
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  licenseInfo?: LicenseInfo;
}

/**
 * Verifies a license key against Gumroad API.
 */
export async function verifyGumroadLicense(
  licenseKey: string,
  incrementUses: boolean = true
): Promise<VerificationResult> {
  const cleanKey = licenseKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'Please enter a valid license key.' };
  }

  // Check if Electron native IPC is available as fallback/primary
  if (typeof window !== 'undefined' && (window as any).electronAPI?.verifyLicense) {
    try {
      const nativeRes = await (window as any).electronAPI.verifyLicense(cleanKey);
      if (nativeRes) return nativeRes;
    } catch (e) {
      console.warn('Native license IPC failed, falling back to direct fetch:', e);
    }
  }

  const params = new URLSearchParams();
  params.append('product_id', GUMROAD_PRODUCT_ID);
  params.append('license_key', cleanKey);
  if (incrementUses) {
    params.append('increment_uses_count', 'true');
  } else {
    params.append('increment_uses_count', 'false');
  }

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const msg = data.message || 'Invalid license key for this product.';
      return { success: false, message: msg };
    }

    const purchase = data.purchase || {};

    // Check for chargebacks, refunds, or disputes
    if (purchase.refunded) {
      return { success: false, message: 'This license has been refunded.' };
    }
    if (purchase.chargebacked || purchase.disputed) {
      return { success: false, message: 'This license is disputed or chargebacked.' };
    }
    if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
      return { success: false, message: 'The subscription for this license has expired.' };
    }

    const licenseInfo: LicenseInfo = {
      key: cleanKey,
      email: purchase.email || 'Verified Customer',
      productName: purchase.product_name || 'Halftone Studio',
      purchaseDate: purchase.created_at || new Date().toISOString(),
      verifiedAt: Date.now(),
      uses: data.uses || 1,
    };

    // Automatically store verified license
    saveStoredLicense(licenseInfo);

    return {
      success: true,
      licenseInfo,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while contacting Gumroad verification servers.',
    };
  }
}

/**
 * Retrieves cached license from localStorage.
 */
export function getStoredLicense(): LicenseInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.key) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored license:', e);
  }
  return null;
}

/**
 * Saves verified license to localStorage.
 */
export function saveStoredLicense(info: LicenseInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (e) {
    console.warn('Failed to save license to localStorage:', e);
  }
}

/**
 * Removes license from localStorage (deactivation).
 */
export function clearStoredLicense(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

/**
 * Quick synchronous check if software is currently activated.
 */
export function isLicenseActive(): boolean {
  return getStoredLicense() !== null;
}
