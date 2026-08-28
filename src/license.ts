const SLUG = 'home-care-evidence';
let storagePrefix = '';
const licenseKey = () => `${storagePrefix}sb_license:${SLUG}`;
const verdictKey = () => `${storagePrefix}sb_license_verdict:${SLUG}`;
const API_BASE = 'https://api.sociobot.in/api/v1';
export const CHECKOUT_URL = `${API_BASE}/products/${SLUG}/checkout`;

export function useDemoLicenseStorage(enabled: boolean): void {
  storagePrefix = enabled ? 'demo:' : '';
}

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export function captureReturnedLicense(): boolean {
  const url = new URL(location.href);
  const license = url.searchParams.get('license');
  if (!license) return false;
  localStorage.setItem(licenseKey(), license);
  localStorage.removeItem(verdictKey());
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function hasCachedUnlock(): boolean {
  if (!localStorage.getItem(licenseKey())) return false;
  try {
    return (JSON.parse(localStorage.getItem(verdictKey()) ?? '') as CachedVerdict).valid === true;
  } catch {
    return false;
  }
}

export function getStoredLicense(): string {
  return localStorage.getItem(licenseKey()) ?? '';
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; message: string }> {
  const license = getStoredLicense();
  if (!license) return { valid: false, message: 'No license is saved on this device.' };
  if (!force) {
    try {
      const cache = JSON.parse(localStorage.getItem(verdictKey()) ?? '') as CachedVerdict;
      if (Date.now() - cache.checkedAt < 86_400_000) {
        return { valid: cache.valid, message: cache.valid ? 'Unlimited is active.' : 'This license is no longer active.' };
      }
    } catch { /* verify below */ }
  }
  try {
    const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(license)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(verdictKey(), JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
    return { valid: result.valid, message: result.valid ? 'Unlimited is active.' : 'This license is no longer active.' };
  } catch {
    return { valid: hasCachedUnlock(), message: hasCachedUnlock() ? 'Offline — using the last valid license check.' : 'Could not verify right now. Check your connection and try again.' };
  }
}

export async function storeAndVerifyLicense(value: string): Promise<{ valid: boolean; message: string }> {
  localStorage.setItem(licenseKey(), value.trim());
  localStorage.removeItem(verdictKey());
  return verifyLicense(true);
}
