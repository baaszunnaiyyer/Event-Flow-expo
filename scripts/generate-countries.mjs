/**
 * Run in Node (not on device): generates utils/allCountries.static.json
 * so React Native/Hermes does not need to load libphonenumber-js at startup.
 *
 * Usage: node scripts/generate-countries.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "utils", "allCountries.static.json");

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const rows = [];

for (const iso2 of getCountries()) {
  try {
    const dial = getCountryCallingCode(iso2);
    const name = regionNames.of(iso2);
    if (!name) continue;
    rows.push({ iso2, countryName: name, dialCode: dial });
  } catch {
    continue;
  }
}

rows.sort((a, b) => a.countryName.localeCompare(b.countryName));
writeFileSync(outPath, JSON.stringify(rows, null, 0), "utf8");
console.log(`Wrote ${rows.length} countries to ${outPath}`);
