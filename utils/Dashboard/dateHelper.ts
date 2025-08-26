// Helper to get Monday 3 weeks ago from today
  export function getMonday(date: Date) {
    const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

export  function happensToday(event: any): boolean {
    const today = startOfDay(new Date());
    const start = startOfDay(new Date(event.start_time));
    const end = event.end_time ? startOfDay(new Date(event.end_time)) : null;
    const until = event.until ? startOfDay(new Date(event.until)) : null;

    // Stop if it hasn't started yet or it's past 'until'
    if (today < start) return false;
    if (until && today > until) return false;

    // Non-recurring: happens if today is the start/end day or in-between
    if (!event.is_recurring) {
      if (!end) return isSameDay(today, start);
      return today >= start && today <= end;
    }

    // --- Recurring ---
    const frequency = String(event.frequency || "").toLowerCase(); // "daily", "weekly", ...
    const interval: number = Number(event.interval || 1);

    // Date-only day difference
    const diffDays = daysBetween(start, today);

    switch (frequency) {
      case "daily":
        return diffDays % interval === 0;

      case "weekly": {
        // Use by_day if provided, else use weekday of start
        const allowedDows: number[] = getAllowedWeekdays(event.by_day, start.getDay());
        if (!allowedDows.includes(today.getDay())) return false;

        const weeksSinceStart = Math.floor(diffDays / 7);
        return weeksSinceStart % interval === 0;
      }

      case "monthly": {
        // Occurs on the start's day-of-month
        if (today.getDate() !== clampDayToMonth(start.getDate(), today)) return false;
        const monthsSinceStart =
          (today.getFullYear() - start.getFullYear()) * 12 +
          (today.getMonth() - start.getMonth());
        return monthsSinceStart % interval === 0;
      }

      case "yearly": {
        const sameMonthDay =
          today.getMonth() === start.getMonth() && today.getDate() === start.getDate();
        if (!sameMonthDay) return false;
        const yearsSinceStart = today.getFullYear() - start.getFullYear();
        return yearsSinceStart % interval === 0;
      }

      default:
        return false;
    }
  }

  /* ----------------- helpers ----------------- */

export  function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

export  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

export  function daysBetween(a: Date, b: Date): number {
    // a and b should already be at start-of-day
    const MS = 24 * 60 * 60 * 1000;
    return Math.floor((b.getTime() - a.getTime()) / MS);
  }

export  function getAllowedWeekdays(by_day: any, fallbackDow: number): number[] {
    // Prisma enum Day = Monday..Sunday; JS getDay(): 0=Sun..6=Sat
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
  }

  /**
   * If start was the 31st, months with <31 days should run on the last day.
   * This clamps the desired day into this month's max days so a 31st-based rule
   * can still fire on 30-day/28-day months.
   */
export  function clampDayToMonth(desiredDay: number, dateInMonth: Date): number {
    const y = dateInMonth.getFullYear();
    const m = dateInMonth.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return Math.min(desiredDay, lastDay);
  }