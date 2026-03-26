import { useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";

interface TVTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  tvFocusedStyle?: StyleProp<TextStyle>;
  disableTVFocusStyle?: boolean;
}

export function TVTextInput({
  style,
  tvFocusedStyle,
  disableTVFocusStyle = false,
  onFocus,
  onBlur,
  ...props
}: TVTextInputProps) {
  const isTv = Platform.isTV;
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      onFocus={(event) => {
        if (isTv) {
          setFocused(true);
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (isTv) {
          setFocused(false);
        }
        onBlur?.(event);
      }}
      style={[
        style,
        !disableTVFocusStyle &&
          isTv &&
          focused &&
          (tvFocusedStyle ?? styles.defaultTvFocused),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  defaultTvFocused: {
    borderWidth: 2,
    borderColor: "#67e8f9",
  },
});
