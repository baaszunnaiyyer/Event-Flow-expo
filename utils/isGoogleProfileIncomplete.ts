/**
 * True when the user must complete the Google / OAuth profile form
 * (missing name, phone, or country from settings).
 */
export function isGoogleProfileIncomplete(profile: {
  name?: string | null;
  phone?: string | null;
  country?: string | null;
} | null): boolean {
  if (!profile) return true;
  const nameOk = !!(profile.name && String(profile.name).trim());
  const phoneOk = !!(profile.phone && String(profile.phone).trim());
  const countryOk = !!(profile.country && String(profile.country).trim());
  return !nameOk || !phoneOk || !countryOk;
}
