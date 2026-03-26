import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";

interface ShareStatusProps {
  isSharing: boolean;
  videoCount: number;
  port: number | null;
  onStop: () => void;
}

export function ShareStatus({
  isSharing,
  videoCount,
  port,
  onStop,
}: ShareStatusProps) {
  if (!isSharing) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <ActivityIndicator color={colors.success} size="small" />
        <Text style={styles.statusText}>Sharing Active</Text>
      </View>

      <Text style={styles.infoText}>
        Sharing {videoCount} video{videoCount !== 1 ? "s" : ""} on port {port}
      </Text>

      <Text style={styles.helpText}>
        Other devices on this WiFi network can now discover and download your
        shared videos.
      </Text>

      <Pressable style={styles.stopButton} onPress={onStop}>
        <Text style={styles.stopButtonText}>Stop Sharing</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.success}15`,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  infoText: {
    color: colors.foreground,
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  helpText: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  stopButton: {
    backgroundColor: colors.destructive,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    alignItems: "center",
  },
  stopButtonText: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
