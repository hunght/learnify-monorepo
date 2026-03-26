import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import type { RemoteSubscription } from "../../types";
import {
  colors,
  radius,
  spacing,
  fontSize,
  fontWeight,
  getPlaceholderColor,
} from "../../theme";

interface SubscriptionCardProps {
  subscription: RemoteSubscription;
  onPress: () => void;
}

export function SubscriptionCard({
  subscription,
  onPress,
}: SubscriptionCardProps) {
  const placeholderColor = getPlaceholderColor(subscription.channelTitle);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.thumbnailContainer}>
        {subscription.thumbnailUrl ? (
          <Image
            source={{ uri: subscription.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbnail,
              styles.thumbnailPlaceholder,
              { backgroundColor: placeholderColor },
            ]}
          >
            <Text style={styles.placeholderText}>
              {subscription.channelTitle.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {subscription.channelTitle}
        </Text>
        <Text style={styles.subtitle}>
          {subscription.videoCount} video
          {subscription.videoCount !== 1 ? "s" : ""}
        </Text>
      </View>
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
    marginVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  placeholderText: {
    color: colors.foreground,
    fontSize: fontSize.xl + 4,
    fontWeight: fontWeight.bold,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
});
