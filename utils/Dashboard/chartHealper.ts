import { Event } from "@/types/model";

export function generateWeeklyChartData(events: Event[], startDate: Date) {
    const totalWeeks = 7;
    const daysInWeek = 7;

    const eventDateCounts: Record<string, number> = {};

    events.forEach(event => {
      const d = new Date(event.start_time);
      const key =
        d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
      eventDateCounts[key] = (eventDateCounts[key] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(eventDateCounts), 1);

    const data = new Array(totalWeeks).fill(null).map((_, weekIndex) => {
      return new Array(daysInWeek).fill(null).map((__, dayIndex) => {
        const currentDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + weekIndex * daysInWeek + dayIndex
        );
        const key =
          currentDate.getFullYear() + "-" +
          String(currentDate.getMonth() + 1).padStart(2, "0") + "-" +
          String(currentDate.getDate()).padStart(2, "0");

        const count = eventDateCounts[key] || 0;
        const value = count / maxCount;
        const minValue = 0.1;

        return { day: currentDate, value: value < minValue ? minValue : value };
      });
    });

    return data;
  }