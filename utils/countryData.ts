import allCountriesJson from "./allCountries.static.json";

export type CountryDialRow = {
  countryName: string;
  iso2: string;
  dialCode: string;
};

/** Unicode regional indicator flag from ISO 3166-1 alpha-2 (e.g. US → 🇺🇸). */
export function flagEmoji(iso2: string): string {
  const u = iso2.toUpperCase();
  if (u.length !== 2 || !/^[A-Z]{2}$/.test(u)) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (u.charCodeAt(0) - 65),
    A + (u.charCodeAt(1) - 65)
  );
}

/** Pre-generated in Node (see scripts/generate-countries.mjs) — avoids libphonenumber-js on Hermes. */
export const ALL_COUNTRIES: CountryDialRow[] = allCountriesJson as CountryDialRow[];

export const UNIQUE_DIAL_CODES: string[] = Array.from(
  new Set(ALL_COUNTRIES.map((r) => r.dialCode))
).sort((a, b) => Number(a) - Number(b));
