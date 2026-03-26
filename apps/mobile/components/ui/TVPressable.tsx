import { useState } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type TVPressableStateCallbackType = PressableStateCallbackType & {
  focused: boolean;
};

type TVPressableStyle =
  | StyleProp<ViewStyle>
  | ((state: TVPressableStateCallbackType) => StyleProp<ViewStyle>);

interface TVPressableProps extends Omit<PressableProps, "style"> {
  style?: TVPressableStyle;
  tvFocusedStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disableTVFocusStyle?: boolean;
  disablePressedStyle?: boolean;
}

function resolveStyle(
  style: TVPressableStyle | undefined,
  state: TVPressableStateCallbackType
): StyleProp<ViewStyle> {
  if (typeof style === "function") {
    return style(state);
  }
  return style;
}

export function TVPressable({
  style,
  tvFocusedStyle,
  pressedStyle,
  disableTVFocusStyle = false,
  disablePressedStyle = false,
  onFocus,
  onBlur,
  ...props
}: TVPressableProps) {
  const isTv = Platform.isTV;
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
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
      style={(state) => {
        const stateWithFocus: TVPressableStateCallbackType = {
          ...state,
          focused,
        };

        return [
          resolveStyle(style, stateWithFocus),
          !disablePressedStyle &&
            state.pressed &&
            (pressedStyle ?? styles.defaultPressed),
          !disableTVFocusStyle &&
            isTv &&
            focused &&
            (tvFocusedStyle ?? styles.defaultTvFocused),
        ];
      }}
    />
  );
}

const styles = StyleSheet.create({
  defaultPressed: {
    opacity: 0.85,
  },
  defaultTvFocused: {
    borderWidth: 2,
    borderColor: "#67e8f9",
    shadowColor: "#67e8f9",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
