import { View, Text, Image, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import type { RemoteVideoWithStatus } from "../../types";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Film } from "../../theme/icons";

interface SubscriptionVideoGridItemProps {
  video: RemoteVideoWithStatus;
  isPending?: boolean;
  onPress: () => void;
}

export function SubscriptionVideoGridItem({
  video,
  isPending = false,
  onPress,
}: SubscriptionVideoGridItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !isPending ? styles.cardPressed : null,
      ]}
      onPress={onPress}
      disabled={isPending}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Film size={22} color={colors.mutedForeground} />
          </View>
        )}
        {isPending && (
          <View style={styles.pendingOverlay}>
            <ActivityIndicator size="small" color={colors.foreground} />
            <Text style={styles.pendingText}>Preparing...</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={styles.channel} numberOfLines={1}>
        {video.channelTitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  pendingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingText: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 6,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  channel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
