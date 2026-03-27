import type { TextStyle } from "react-native";
import { APP_FONT_FAMILY } from "@/utils/constants";

/** Changa One ships as one static face; use `fontWeight` for emphasis (synthetic bold on native). */
const font = (extra: TextStyle = {}): TextStyle => ({
  fontFamily: APP_FONT_FAMILY,
  ...extra,
});

export const typography = {
  /** Large screen titles */
  display: font({ fontSize: 28, fontWeight: "700" }),
  /** Section / page headings */
  heading: font({ fontSize: 22, fontWeight: "700" }),
  /** Subheadings */
  title: font({ fontSize: 18, fontWeight: "600" }),
  /** Body copy */
  body: font({ fontSize: 16, fontWeight: "400" }),
  bodyMedium: font({ fontSize: 16, fontWeight: "500" }),
  bodySemibold: font({ fontSize: 16, fontWeight: "600" }),
  /** Small labels, captions */
  caption: font({ fontSize: 13, fontWeight: "400" }),
  captionMedium: font({ fontSize: 13, fontWeight: "500" }),
  label: font({ fontSize: 14, fontWeight: "600" }),
} as const;
