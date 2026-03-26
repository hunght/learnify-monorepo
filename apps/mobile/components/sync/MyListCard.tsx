import { View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";
import type { RemoteMyList } from "../../types";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Plus } from "../../theme/icons";

interface MyListCardProps {
  myList: RemoteMyList;
  onPress: () => void;
}

export function MyListCard({
  myList,
  onPress,
}: MyListCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.thumbnailContainer}>
        {myList.thumbnailUrl ? (
          <Image
            source={{ uri: myList.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Plus size={24} color={colors.foreground} strokeWidth={2.5} />
          </View>
        )}
        {myList.itemCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{myList.itemCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {myList.name}
        </Text>
        <Text style={styles.subtitle}>
          {myList.itemCount} item{myList.itemCount !== 1 ? "s" : ""}
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
    width: 80,
    height: 45,
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
    backgroundColor: colors.primary,
  },
  countBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  countText: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
});
