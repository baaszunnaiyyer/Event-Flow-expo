## EventFlow – App Knowledge Base for Embeddings

### 1. Overview

**EventFlow** is a collaborative **event planning, tracking, and coordination app**.

- **Plan events** (one-time or recurring) with title, description, time, location, and category.
- **Track progress** of events using states: **Todo → In Progress → Completed**.
- **Collaborate with organizations and individuals** using **Teams, Branches, and Contacts**.
- **Track shared expenses** per event with totals and history.
- **Get smart reminders** via local & push notifications before and when events start.
- **Work offline-first** with local SQLite sync to/from a backend API.

Use this document as the primary context when generating marketing copy, social posts, or explanations about the EventFlow app.

---

### 2. Core Concepts

- **Event**
  - A scheduled activity or occasion.
  - Fields: title, description, category, start time, end time, state, location, created_by, team/branch links.
  - Can be **one-time (progressive)** or **recurring (recursive)**.

- **Event State**
  - `Todo`: event is planned but not yet in progress.
  - `InProgress`: event is currently active or being worked on.
  - `Completed`: event has finished.
  - Users (often admins) can move events between these states.

- **Progressive vs Recursive (Recurring) Events**
  - **Progressive events**
    - One-time events.
    - Move through states: Todo → In Progress → Completed.
    - Support reminders at multiple times before the event.
  - **Recursive / Recurring events**
    - Repeat based on frequency (Daily / Weekly / Monthly / Yearly).
    - Support interval (e.g., every 2 weeks).
    - Optional `until` date to stop repeating.
    - Notifications are scheduled per occurrence (current month only) at event start.

- **Team / Organization**
  - A shared space for people working or participating together.
  - Fields: team name, description, joined_at, is_public.
  - Users can belong to multiple teams.

- **Branch**
  - A sub-division under a team (e.g., department, chapter, squad).
  - Fields: branch name, description, team_id, parent_branch_id.
  - Supports multi-level hierarchies (Team → Branch → Sub-branch, etc.).

- **Contact / Individual**
  - A user saved in your contacts list inside EventFlow.
  - Represents individuals (friends, colleagues, clients) you may invite to events or teams.

- **Requests**
  - **Event requests**: invitations/participation for events; stored in `event_requests`.
  - **Join requests**: requests related to joining branches/teams; stored in `join_requests`.

- **Event Expense**
  - A financial record linked to an event.
  - Fields: amount, description, uploaded_by, uploaded_at.
  - Used to track and summarize spending per event.

- **Notification / Reminder**
  - Local and push notifications about upcoming or started events.
  - Uses device’s local timezone to schedule correctly.

---

### 3. Main User Flows & Screens

#### 3.1 Onboarding & Authentication

- **Onboarding**
  - First-time users go through an onboarding flow.
  - After onboarding, the app decides initial route based on:
    - `hasOnboarded` flag in AsyncStorage.
    - Presence of `userToken` in secure storage.

- **Authentication**
  - Login / Signup flows under the `(auth)` routes.
  - Secure token storage via `expo-secure-store` (`userToken`, `userId`).
  - If a valid token is present, user lands directly in the main tabbed interface.

#### 3.2 Dashboard (Home)

- Route: main `(tabs)/index` dashboard.
- **Features**
  - **Weekly Progress Chart**
    - Visual weekly summary of event-related progress.
    - Data-driven using dashboard hooks and chart components.
  - **Today’s Timeline**
    - Timeline of events scheduled for today.
  - **Events Carousel**
    - Horizontal cards for:
      - Upcoming events.
      - Previous events.
  - **Requests Section**
    - Horizontal cards for:
      - Event requests.
      - Team requests.
  - **Floating Action Button**
    - Quick-create entry point (e.g., for new events or other primary actions).

This screen is used for summaries like “See your week at a glance,” “Today’s timeline,” and “Pending requests.”

#### 3.3 Events List & Event Management

- Route: `(tabs)/(events)/events.tsx`

**Tabs & Filters**
- Top segment: **Progressive** vs **Recursive (recurring)**.
  - **Progressive tab**
    - Shows one-time events.
    - Includes state filter tabs: `Todo`, `InProgress`, `Completed`.
    - Shows event counts per state (e.g., “Todo (3)”).
  - **Recursive tab**
    - Shows recurring events only.
    - Filters out events whose `until` date is in the past.

**Search**
- Text search over event title and description.

**Data Loading**
- Loads from local SQLite first (fast UI).
- Then may sync with remote API (for fresh updates).

**Interactions**
- For **Progressive** events:
  - Swipe gestures (for admins):
    - Swipe left/right to cycle event state between Todo → InProgress → Completed.
  - Delete events (with server + local DB sync).
- For **Recursive** events:
  - Tapping an item opens detailed view for that recurring event.

**Create Event Entry**
- Floating action button at bottom right:
  - Opens the Event Form screen to create a new event.

#### 3.4 Event Creation & Recurrence (Event Form)

- Route: `(tabs)/(events)/eventForm.tsx`

**Event Creation Fields**
- Title.
- Description.
- Start time (date & time picker).
- End time (date & time picker).
- Category (e.g., “Work”, “Personal”).
- State (for non-recurring events): `Todo` or `InProgress`.
- Location.
- Recurring toggle:
  - **Off** → one-time progressive event.
  - **On** → recurring event.

**Recurring Event Options**
- Frequency: `Daily`, `Weekly`, `Monthly`, `Yearly`.
- Interval: e.g., every 1, 2, 3 units of the chosen frequency.
- For Weekly:
  - Choose specific weekdays (Mon–Sun) using chips.
- Optional “Ends on” (`until`) date:
  - Allows recurring events to stop after a certain date.

**Behavior on Submit**
- Validates required fields (title, description, start, end, category).
- Sends POST to `/events` API with proper payload (interval normalized as integer).
- Registers event notifications for the created event.
- Shows success toast and navigates back to the events list.

#### 3.5 Event Expenses

- Route: `(tabs)/(events)/expenses.tsx` (linked to specific `eventId`).

**Purpose**
- Track and summarize all expenses associated with a single event.

**Features**
- Loads existing expenses from:
  - Local SQLite first (fast view).
  - Then syncs with API (`/events/:eventId/expenses`).
- Displays:
  - List of expenses with:
    - Description (or “No description”).
    - Amount.
    - Uploader name.
    - Uploaded date.
  - Summary card:
    - **Total Expenses** amount (sum of all expense amounts).

**Actions**
- **Add Expense**
  - Opens modal.
  - Requires a positive amount.
  - Optional description.
  - Posts to API and inserts into local DB.
- **Edit Expense**
  - Opens modal with existing amount and description.
  - PUT request to API.
  - Updates local DB and UI.
- **Delete Expense**
  - Opens confirmation modal.
  - DELETE request to API.
  - Removes from local DB and UI.

Use-cases:
- Splitting costs for:
  - Movie nights, parties, trips, weddings, office events, etc.
- Keeping transparent budget history per event.

#### 3.6 Teams & Contacts (Organizations & Individuals)

- Route: `(tabs)/(teams)/teams.tsx`

**Tabs**
- **Organizations (Teams)**
  - List of teams the user belongs to.
  - Each team shows:
    - Name.
    - Description.
    - Joined date.
  - Tapping a team:
    - Opens team detail route `(team)/[team_id]` (hierarchy, branches, members, etc.).

- **Individuals (Contacts)**
  - List of user contacts.
  - Each contact shows:
    - Name.
    - Email (and possibly other profile info).
  - Tapping a contact:
    - Opens contact detail route `(contact)/[contact].tsx`.

**Search**
- Search bar filters:
  - Teams by team name.
  - Contacts by contact name.

**Data Loading & Sync**
- On focus:
  - Loads from local DB (teams & contacts).
  - Optionally fetches fresh data from API (`/teams`, `/contacts`) and syncs back to SQLite.

**Create Actions (FAB)**
- FAB is context-aware:
  - On Organizations tab:
    - Navigates to create a new team.
  - On Individuals tab:
    - Navigates to create a new contact.

Use-cases:
- Organizing:
  - Companies, clubs, communities, families, project groups.
- Quickly selecting people for events, tracking which organization an event belongs to.

#### 3.7 Branch & Team Hierarchy

- Under a team route: `(team)/(branch)/...`

**Branch Structure**
- Branches nested under teams for:
  - Departments.
  - Local chapters.
  - Sub-groups (e.g., “Design Squad”, “NYC Chapter”).

**Capabilities**
- Branch pages enable:
  - Viewing branch info and relationships.
  - Managing branch members.
  - Creating branch-specific events.

This supports hierarchical event planning (e.g., company-level events vs. branch-level events).

#### 3.8 Requests & Membership

- Represented at DB level with:
  - `event_requests` (event invites/requests).
  - `join_requests` (branch/team membership requests).
- Exposed in the UI mainly via:
  - Dashboard request cards.

Use-cases:
- Inviting people to events.
- Handling requests to join teams or branches.

#### 3.9 Notifications & Push

**Local Notifications**
- Uses Expo Notifications to:
  - Schedule reminders based on local device time.
  - Register notifications per event.
  - Cancel existing scheduled notifications when needed.

**One-time Events (Progressive)**
- Schedules up to 5 notification types for future events:
  - 1 month before.
  - 1 week before.
  - 1 day before.
  - 30 minutes before.
  - At event start (“Event Started!”).

**Recurring Events**
- Generates occurrences for current month only.
- For each occurrence:
  - Schedules “Event started” notification at start time.

**Push Notifications**
- Uses Firebase messaging to:
  - Listen to foreground messages.
  - Handle notifications opened from background or killed state.
  - Set background message handlers.

#### 3.10 Settings, Profile & Support

- Route: `(tabs)/(settings)/settings.tsx`

**Profile Section**
- Shows:
  - User name.
  - Email.
  - Phone number.

**Options**
- Privacy Policy.
- Profile.
- About Us.
- Support.
- Report User.
- Sign Out.

**Report User**
- Modal-based flow:
  - Input another user’s email.
  - Provide a reason.
  - POST to `/settings/report` with current user’s token.

**Sign Out**
- Invokes sign-out logic to clear session and return user to auth flow.

---

### 4. Technical Characteristics (For Reasoning)

- **Offline-first**
  - SQLite database (`EventFlowDB.db`) mirrors server data:
    - Users, teams, branches, team members, branch members.
    - Events, event members, event requests, join requests.
    - Contacts.
    - Event expenses and photos.
  - Many screens:
    - Load from SQLite first for instant UI.
    - Then sync with backend for fresh data.

- **Sync Helpers**
  - Uses functions like `syncTable`, `upsertTable`, and specialized helpers in `utils/db/*`.
  - Ensures local and remote data stay aligned.

- **Roles & Permissions**
  - `isAdmin` field on events:
    - Controls privileged actions like swiping to change state and deleting.

- **Security & Storage**
  - **SecureStore**:
    - Stores `userToken`, `userId`, and other sensitive info.
  - **AsyncStorage**:
    - Stores onboarding flags and cached events where needed.

---

### 5. Example Use-Cases (Mapping Real-World Scenarios to Features)

Use these mappings when generating social posts or explanations:

- **Movie Premiere or Release (e.g., Avengers on December 17)**
  - Create an event with:
    - Title: movie name.
    - Date: release/showtime.
    - Category: “Entertainment”.
    - Location: cinema name.
  - Invite friends via contacts or teams.
  - Let EventFlow:
    - Schedule reminders (1 day and 30 minutes before).
    - Track shared expenses (tickets, snacks, rides).

- **Birthday Party**
  - One-time progressive event:
    - Use state progression to track planning and completion.
  - Track party expenses (cake, decorations, venue).
  - Send reminders to guests.

- **Weekly Team Meeting**
  - Recurring event:
    - Weekly frequency.
    - Interval = 1.
    - Set day as Monday (or any weekday).
  - Attach it to a specific team/branch.
  - Let EventFlow send start-time notifications each week.

- **Club / Community Events**
  - Teams = clubs or organizations.
  - Branches = local chapters or specific groups.
  - Events = regular meetups, tournaments, workshops.
  - Event requests = attendance confirmations or invitations.

- **Trips / Outings**
  - Event = trip.
  - Expenses = all shared costs (fuel, hotels, food).
  - Contacts/teams = travel group.

---

### 6. Social Post Generation Guidance

When generating social posts about EventFlow:

- **Always try to:**
  - Mention **EventFlow** by name.
  - Tie the external topic (e.g., movie, birthday, launch, trip) back to:
    - Event creation.
    - Reminders/notifications.
    - Team/contacts coordination.
    - Expense tracking when relevant.

- **Tone**
  - Friendly, energetic, slightly playful, but still clear.
  - Example style:
    - “Mark your event with your friends…”
    - “Never miss a moment…”

#### 6.1 Example Social Post Templates

- **Movie Release Example**
  - Input idea: *“Avengers Release Date is 17 December”*
  - Possible output:
    - “Avengers hits the big screen on December 17!  
       Set up an event in **EventFlow**, invite your friends, and let automatic reminders ping everyone a day and 30 minutes before showtime so nobody misses the cinemas!”

- **Birthday Example**
  - “Got a birthday coming up this Saturday?  
     Create a party event in **EventFlow**, send invites to your close circle, track the cake and decor costs with built‑in expenses, and let the app handle all the reminders for you.”

- **Weekly Meeting Example**
  - “Your team’s weekly stand‑up doesn’t have to live in your head.  
     Set it as a recurring event in **EventFlow** (every Monday), link it to your organization, and get a clean reminder right when it’s time to meet.”

- **Trip Example**
  - “Planning a road trip?  
     Turn it into an event in **EventFlow**, add your travel buddies as contacts, and log every expense—fuel, snacks, stays—so it’s easy to settle up later.”

Use this file as a centralized knowledge base so the model can connect **any real-world event idea** (movie release, party, meeting, launch, trip, etc.) to the **specific EventFlow features** that make planning, reminders, collaboration, and expenses easier.

