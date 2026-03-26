import { View, Text, StyleSheet } from "react-native";
import { colors, radius, fontSize, fontWeight } from "../../theme";
import { Check, Download, Clock, Circle } from "../../theme/icons";

type DownloadStatus = "completed" | "downloading" | "queued" | "pending" | null;

interface DownloadStatusBadgeProps {
  status: DownloadStatus;
  progress?: number | null;
  showLabel?: boolean;
}

export function DownloadStatusBadge({
  status,
  progress,
  showLabel = true,
}: DownloadStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          backgroundColor: colors.success,
          textColor: colors.foreground,
          label: "On Server",
          Icon: Check,
        };
      case "downloading":
        return {
          backgroundColor: colors.warning,
          textColor: colors.warningForeground,
          label: progress != null ? `${progress}%` : "Downloading",
          Icon: Download,
        };
      case "queued":
        return {
          backgroundColor: colors.primary,
          textColor: colors.foreground,
          label: "Queued",
          Icon: Clock,
        };
      case "pending":
        return {
          backgroundColor: colors.pending,
          textColor: colors.foreground,
          label: "Pending",
          Icon: Circle,
        };
      default:
        return {
          backgroundColor: colors.muted,
          textColor: colors.mutedForeground,
          label: "Not Downloaded",
          Icon: Circle,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.Icon;

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <IconComponent size={10} color={config.textColor} strokeWidth={3} />
      {showLabel && (
        <Text style={[styles.label, { color: config.textColor }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.lg,
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
