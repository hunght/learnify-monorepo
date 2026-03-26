import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import type { RemoteVideoWithStatus } from "../../types";
import { DownloadStatusBadge } from "./DownloadStatusBadge";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Check, Film } from "../../theme/icons";

interface VideoListItemProps {
  video: RemoteVideoWithStatus;
  isSelected: boolean;
  isSyncedToMobile: boolean;
  onPress: () => void;
  onSyncPress?: () => void;
  onPlayPress?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoListItem({
  video,
  isSelected,
  isSyncedToMobile,
  onPress,
  onSyncPress,
  onPlayPress,
}: VideoListItemProps) {
  const canSync = video.downloadStatus === "completed" && !isSyncedToMobile;
  // Can play if downloaded on server OR synced to mobile
  const canPlay = video.downloadStatus === "completed" || isSyncedToMobile;

  return (
    <Pressable
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Film size={24} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(video.duration)}
          </Text>
        </View>
        {isSyncedToMobile && (
          <View style={styles.syncedBadge}>
            <Check size={10} color={colors.foreground} strokeWidth={3} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.channel} numberOfLines={1}>
          {video.channelTitle}
        </Text>
        <View style={styles.statusRow}>
          <DownloadStatusBadge
            status={video.downloadStatus}
            progress={video.downloadProgress}
          />
          {canPlay && onPlayPress && (
            <Pressable style={styles.playButton} onPress={onPlayPress}>
              <Text style={styles.playButtonText}>
                {isSyncedToMobile ? "Play" : "Stream"}
              </Text>
            </Pressable>
          )}
          {canSync && onSyncPress && (
            <Pressable style={styles.syncButton} onPress={onSyncPress}>
              <Text style={styles.syncButtonText}>Sync</Text>
            </Pressable>
          )}
        </View>
      </View>

      {isSelected && (
        <View style={styles.checkbox}>
          <Check size={14} color={colors.foreground} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: spacing.sm + 4,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginVertical: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.muted,
    borderColor: colors.primary,
  },
  thumbnailContainer: {
    width: 100,
    height: 56,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: colors.overlay,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  durationText: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  syncedBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  channel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  playButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.lg,
  },
  playButtonText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  syncButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.lg,
  },
  syncButtonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
});
