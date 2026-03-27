import { startOfWeek } from 'date-fns';
import { Dimensions, type ImageStyle } from 'react-native';

export const BACKGROUND_COLOR = 'rgba(250,250,250,1)';
export const PRIMARY_COLOR = "#090040";

/** Hero illustration: offset from top so login & signup match. */
export const AUTH_HERO_MARGIN_TOP = 100;

/** Space below paginator + next control (onboarding & signup wizard). */
export const AUTH_PAGINATOR_FOOTER_PADDING_BOTTOM = 50;

/** Extra top inset for auth form / wizard step scroll content. */
export const AUTH_FORM_CONTENT_PADDING_TOP = 24;

/** Same hero sizing on login and signup (avoids % height quirks inside ScrollView). */
export function getAuthHeroImageStyle(): ImageStyle {
  const { width, height } = Dimensions.get('window');
  return {
    width: width * 0.65,
    height: height * 0.2,
    marginTop: AUTH_HERO_MARGIN_TOP,
    marginBottom: 100,
  };
}

// Calculate the date of the Monday from three weeks ago
const mondayFromThreeWeeksAgo = startOfWeek(
  new Date().getTime() - 86400000 * 21, // Subtract 21 days (3 weeks) in milliseconds from the current date
  {
    weekStartsOn: 1, // Set the week to start on Monday (1)
  }
);

// Generate data for a 7x7 grid (7 weeks, 7 days each)
export const data = new Array(7).fill(null).map((_, weekIndex) => {
  return new Array(7).fill(null).map((__, dayIndex) => {
    // Calculate the date for each day in the grid
    const day = new Date(
      mondayFromThreeWeeksAgo.getTime() + 86400000 * (weekIndex * 7 + dayIndex) // Add the corresponding number of days in milliseconds
    );

    // Generate a random value for each day
    const value = Math.random(); // between 0 and 1

    // Return an object containing the date and random value
    return {
      day: day,
      value: value,
    };
  });
});
