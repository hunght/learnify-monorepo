import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import type { Video } from "../../types";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Check } from "../../theme/icons";

interface VideoShareListProps {
  videos: Video[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function VideoShareList({
  videos,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: VideoShareListProps) {
  const allSelected = selectedIds.size === videos.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Videos to Share</Text>
        <Pressable
          onPress={allSelected ? onDeselectAll : onSelectAll}
          style={styles.selectAllButton}
        >
          <Text style={styles.selectAllText}>
            {allSelected ? "Deselect All" : "Select All"}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.videoItem,
              selectedIds.has(item.id) && styles.videoItemSelected,
            ]}
            onPress={() => onToggle(item.id)}
          >
            <View style={styles.checkbox}>
              {selectedIds.has(item.id) && (
                <Check size={14} color={colors.primary} strokeWidth={3} />
              )}
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.videoChannel}>{item.channelTitle}</Text>
              <Text style={styles.videoDuration}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedIds.size} of {videos.length} selected
        </Text>
      </View>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm + 4,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  selectAllButton: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
  },
  selectAllText: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  list: {
    flex: 1,
  },
  videoItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  videoChannel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  videoDuration: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  footer: {
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: colors.card,
  },
  selectedCount: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
    textAlign: "center",
  },
});
