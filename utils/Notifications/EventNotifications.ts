import { Event } from "@/types/model";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";


/**
 * Helper — converts UTC timestamp to local device time
 */
function toLocalDate(utcDateString: string): Date {
  // JS Date constructor automatically converts ISO UTC string to local time
  return new Date(utcDateString);
}

/**
 * Get device timezone name safely
 */
async function getDeviceTimezone(): Promise<string> {
  try {
    const calendars = Localization.getCalendars?.();
    return calendars?.[0]?.timeZone ?? "Unknown";
  } catch {
    return "Unknown";
  }
}

/**
 * Generate occurrences of a recurring event for the current month only
 * This prevents scheduling endless notifications for events without end dates
 */
function generateRecurringOccurrences(event: Event): Date[] {
  if (!event.is_recurring || !event.frequency) {
    return [];
  }

  const startDate = toLocalDate(event.start_time);
  const untilDate = event.until ? toLocalDate(event.until) : null;
  const now = new Date();
  
  // Calculate current month boundaries
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Use the earlier of untilDate or currentMonthEnd
  const endDate = untilDate && untilDate < currentMonthEnd ? untilDate : currentMonthEnd;

  // If start date is after current month, return empty
  if (startDate > endDate) {
    return [];
  }

  const occurrences: Date[] = [];
  const frequency = String(event.frequency).toLowerCase();
  const interval = event.interval || 1;

  // Helper to get allowed weekdays for weekly events
  const getAllowedWeekdays = (by_day: string[] | undefined, fallbackDow: number): number[] => {
    const map: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    if (Array.isArray(by_day) && by_day.length) {
      return by_day
        .map((d) => (typeof d === "string" ? map[d] : null))
        .filter((n): n is number => n !== null);
    }

    return [fallbackDow];
  };

  // Helper to clamp day to month (for monthly events)
  const clampDayToMonth = (desiredDay: number, dateInMonth: Date): number => {
    const y = dateInMonth.getFullYear();
    const m = dateInMonth.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return Math.min(desiredDay, lastDay);
  };

  // Determine the starting point for iteration
  // Start from the beginning of current month or event start date, whichever is later
  let currentDate = new Date(Math.max(startDate.getTime(), currentMonthStart.getTime()));
  
  // For weekly events, we need to check from the start of the month
  if (frequency === "weekly") {
    currentDate = new Date(currentMonthStart);
  }

  while (currentDate <= endDate) {
    switch (frequency) {
      case "daily": {
        // Check if current date is within current month and after start date
        if (currentDate >= startDate && currentDate >= now && currentDate <= endDate) {
          occurrences.push(new Date(currentDate));
        }
        // Move to next occurrence
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      }

      case "weekly": {
        const allowedDows = getAllowedWeekdays(event.by_day, startDate.getDay());
        
        // Check each day in the current month
        for (let i = 0; i <= endDate.getDate(); i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() + i);
          
          if (checkDate > endDate) break;
          if (checkDate < startDate) continue;
          
          const dayOfWeek = checkDate.getDay();
          const weeksSinceStart = Math.floor(
            (checkDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          
          if (allowedDows.includes(dayOfWeek) && weeksSinceStart >= 0 && weeksSinceStart % interval === 0) {
            if (checkDate >= now) {
              occurrences.push(new Date(checkDate));
            }
          }
        }
        // Break after checking the month
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      }

      case "monthly": {
        // Only add if it's in the current month
        if (currentDate.getMonth() === now.getMonth() && 
            currentDate.getFullYear() === now.getFullYear()) {
          const startDay = startDate.getDate();
          const clampedDay = clampDayToMonth(startDay, currentDate);
          currentDate.setDate(clampedDay);
          
          if (currentDate >= startDate && currentDate >= now && currentDate <= endDate) {
            occurrences.push(new Date(currentDate));
          }
        }
        // Break after checking current month
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      }

      case "yearly": {
        // Only add if it's in the current month
        if (currentDate.getMonth() === now.getMonth() && 
            currentDate.getFullYear() === now.getFullYear()) {
          // Check if current date matches the start date (month and day)
          if (
            currentDate.getMonth() === startDate.getMonth() &&
            currentDate.getDate() === startDate.getDate()
          ) {
            if (currentDate >= startDate && currentDate >= now && currentDate <= endDate) {
              occurrences.push(new Date(currentDate));
            }
          }
        }
        // Break after checking current month
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      }

      default:
        return occurrences;
    }

    // Safety check - if we've passed the end date, break
    if (currentDate > endDate) {
      break;
    }
  }

  return occurrences;
}

/**
 * Register notifications for all events
 */
export async function RegisterEventNotifications(events: Event[]) {
  // Check permissions first
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    console.warn("⚠️ Notification permissions not granted!");
    return;
  }
  
  await Notifications.cancelAllScheduledNotificationsAsync();

  const deviceTimeZone = await getDeviceTimezone();
  console.log("📅 Device Timezone:", deviceTimeZone);

  for (const ev of events) {
    await scheduleEventNotifications(ev);
  }
}

/**
 * Register notifications for a single event
 */
export async function RegisterEventNotification(ev: Event) {
  await scheduleEventNotifications(ev);
}

/**
 * Core logic — schedules reminders for an event (universal time-safe)
 * For recurring events: Only schedules "Event started" notification
 * For one-time events: Schedules all future reminders (1 month, 1 week, 1 day, 30 min, event started)
 */
async function scheduleEventNotifications(ev: Event) {
  try {
    if (!ev.start_time) return;

    const now = new Date();

    // Handle recurring events - ONLY "Event started" notification
    if (ev.is_recurring && ev.frequency) {
      // Only "Event started" reminder for recurring events
      const recurringReminders = [
        { label: "Event started", ms: 0 },
      ];

      const occurrences = generateRecurringOccurrences(ev);
      console.log(
        `🔄 Found ${occurrences.length} occurrences for recurring event "${ev.title}" (current month only)`
      );

      for (const occurrenceDate of occurrences) {
        for (const reminder of recurringReminders) {
          const triggerTime = occurrenceDate.getTime() - reminder.ms;
          const triggerDate = new Date(triggerTime);
          const inms = triggerDate.getTime() - now.getTime();
          const sec = Math.floor(inms / 1000);

          if (inms >= 0) {
            console.log(
              `📌 Scheduling "${ev.title}" - ${reminder.label} at ${triggerDate.toLocaleString()} (occurrence: ${occurrenceDate.toLocaleDateString()})`
            );

            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: "🎉 Event Started!",
                body: `${ev.title} has started!`,
                data: {
                  event_id: ev.event_id,
                  occurrence_date: occurrenceDate.toISOString(),
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: sec,
              },
            });

            console.log("✅ Scheduled notification ID:", notificationId);
          }
        }
      }
    } else {
      // Handle one-time events (progressive) - schedule all future reminders
      const progressiveReminders = [
        { label: "1 month before", ms: 30 * 24 * 60 * 60 * 1000 },
        { label: "1 week before", ms: 7 * 24 * 60 * 60 * 1000 },
        { label: "1 day before", ms: 24 * 60 * 60 * 1000 },
        { label: "30 minutes before", ms: 30 * 60 * 1000 },
        { label: "Event started", ms: 0 },
      ];

      const eventLocalDate = toLocalDate(ev.start_time);

      if (eventLocalDate <= now) {
        return;
      }

      for (const reminder of progressiveReminders) {
        const triggerTime = eventLocalDate.getTime() - reminder.ms;
        const triggerDate = new Date(triggerTime);
        const inms = triggerDate.getTime() - now.getTime();
        const sec = Math.floor(inms / 1000);

        if (inms >= 0) {
          // console.log(
          //   `📌 Scheduling "${ev.title}" - ${reminder.label} at ${triggerDate.toLocaleString()}`
          // );

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title:
                reminder.ms === 0 ? "🎉 Event Started!" : `Reminder: ${ev.title}`,
              body:
                reminder.ms === 0
                  ? `${ev.title} has started!`
                  : `${ev.title} is happening ${reminder.label}.`,
              data: { event_id: ev.event_id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: sec,
            },
          });

          // console.log("✅ Scheduled notification ID:", notificationId);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error scheduling notification:", error);
  }
}

export async function DeleteEventNotification(eventId: string) {
  // Get all scheduled notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  // Filter out all notifications linked to the given event_id
  const toDelete = scheduled.filter(
    (notif) => notif.content.data?.event_id === eventId
  );

  // If nothing found, just return
  if (toDelete.length === 0) {
    console.log(`No scheduled notifications found for event ${eventId}`);
    return;
  }

  // Cancel each matching notification
  for (const notif of toDelete) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    console.log(`Deleted notification ${notif.identifier} for event ${eventId}`);
  }

  console.log(`✅ All notifications for event ${eventId} have been deleted.`);
}