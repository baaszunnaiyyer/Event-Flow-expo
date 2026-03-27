import { APP_FONT_FAMILY } from "@/utils/constants";
import React from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

/**
 * Changa One is a single face. On Android, `fontWeight` / `fontStyle` with a custom
 * `fontFamily` often resolves to the system font. We drop those so the loaded face always wins.
 */
function resolveAppFontStyle(
  style: StyleProp<TextStyle> | undefined
): TextStyle {
  const flat = StyleSheet.flatten(style) as (TextStyle & Record<string, unknown>) | undefined;
  if (!flat) {
    return { fontFamily: APP_FONT_FAMILY };
  }
  const {
    fontWeight: _w,
    fontStyle: _s,
    ...rest
  } = flat;
  return {
    ...(rest as TextStyle),
    fontFamily: APP_FONT_FAMILY,
  };
}

export const Text = React.forwardRef<RNText, TextProps>(function AppText(
  { style, ...props },
  ref
) {
  return <RNText ref={ref} style={resolveAppFontStyle(style)} {...props} />;
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function AppTextInput({ style, ...props }, ref) {
    return (
      <RNTextInput
        ref={ref}
        style={resolveAppFontStyle(style)}
        {...props}
      />
    );
  }
);
