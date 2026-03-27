# Production Readiness Audit – EventFlow App

**Audit Date:** March 2025  
**Scope:** Full app review across all tabs, pages, and critical flows

---

## ✅ Fixes Applied

### 1. **SQL typo (critical)** – `utils/db/Requestes.ts`
- **Issue:** `SELECT * FORM join_requests` (typo: FORM instead of FROM)
- **Impact:** `getJoinRequest()` would fail with SQL error
- **Fix:** Corrected to `SELECT * FROM join_requests`

### 2. **Google sign-in flow** – `app/(auth)/index.tsx`
- **Issue:** Status 201 branch was empty – first-time Google users were not logged in
- **Issue:** Dead code path after success (signInWithCredential) could run and throw
- **Fix:** Handle both 200 and 201; save token/userId and redirect; remove dead code

### 3. **Google sign-in flow** – `app/(auth)/signup.tsx`
- **Issue:** Same as login – 201 branch empty, dead code after success
- **Fix:** Handle 200 and 201; save token, optionally fetch settings; redirect to loading

### 4. **Cancelled Google sign-in**
- **Issue:** No check when user cancels the Google popup
- **Fix:** Return early if `!signInResult?.data?.idToken`

---

## ✅ Verified

- **API base URL:** `https://xrzyqztlwkwsvudyqoql.supabase.co/functions/v1`
- **API paths:** `/requests/events`, `/requests/people` (correct spelling)
- **Auth headers:** All use `Bearer ${token}` consistently
- **Auth endpoints:** login, register, google, forget, validate-token, save-token exist in backend
- **Timezone:** `timeUtils.ts` uses Intl, no `timeZone` option (avoids Hermes quirks)

---

## ⚠️ Pre-Launch Checklist

### Environment
- [ ] `.env` or app config has correct Supabase project URL if needed
- [ ] Firebase / Google OAuth credentials configured for production builds
- [ ] `expo-secure-store` works on physical devices (test on real device)

### Testing Recommendations
1. **Auth:** Test email login, Google login, signup, forgot password
2. **Events:** Create, edit, delete events; test timezone display
3. **Teams:** Create team, add branches, invite members
4. **Notifications:** Confirm reminders fire at correct local time
5. **Offline:** App falls back to cached data when fetch fails (loading screen)
6. **Token expiry:** Tabs layout validates token; redirects to auth if invalid

### Edge Cases
- **Loading screen:** Waits 5 seconds before fetching; shows “Still loading...” after 10s
- **Dashboard/Requests:** Use cached data if fetch fails (no hard failure)
- **Settings failed:** Loading does not require settings to succeed (events/teams/requests required)

---

## 📁 App Structure Summary

| Tab | Screens | Notes |
|-----|---------|-------|
| **Home** | index | Dashboard, event cards, requests, chart |
| **Events** | index, [eventId], eventForm, expenses | CRUD, expenses, timezone display |
| **Requests** | notification | Event + team requests, TabSwitcher |
| **Teams** | teams, create_team, [team_id], [branchId], [member], [contact], create_contact, [contact_event], [team_event], [create_branch] | Full team hierarchy |
| **Settings** | settings, profile, privacy_policy, notifications, appearance, support, about_us | User settings |

---

## 🔗 No Linter Errors

Linter run completed with no errors.
