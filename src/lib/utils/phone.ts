export function normalizePhoneToE164Spain(input: string) {
  const raw = input.trim();
  const digits = raw.replace(/[\s()-]/g, "");

  if (!digits) return null;

  // Accept already E.164
  if (digits.startsWith("+")) {
    // Minimal sanity check: + followed by 8-15 digits
    if (!/^\+\d{8,15}$/.test(digits)) return null;
    return digits;
  }

  // Spain MVP: accept 9 digits and prefix +34
  if (/^\d{9}$/.test(digits)) {
    return `+34${digits}`;
  }

  // Spain often written as 0034...
  if (/^0034\d{9}$/.test(digits)) {
    return `+34${digits.slice(4)}`;
  }

  return null;
}
