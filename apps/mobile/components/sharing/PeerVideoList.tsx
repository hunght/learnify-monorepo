import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import type {
  PeerVideo,
  TransferProgress,
  DiscoveredPeer,
} from "../../types";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Check, ChevronLeft, Inbox } from "../../theme/icons";

interface PeerVideoListProps {
  peer: DiscoveredPeer;
  videos: PeerVideo[];
  isLoading: boolean;
  selectedIds: Set<string>;
  transfers: TransferProgress[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onDownload: () => void;
}

export function PeerVideoList({
  peer,
  videos,
  isLoading,
  selectedIds,
  transfers,
  onToggle,
  onBack,
  onDownload,
}: PeerVideoListProps) {
  const hasActiveTransfers = transfers.some(
    (t) => t.status === "pending" || t.status === "downloading"
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.peerName}>{peer.name}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyState}>
          <Inbox size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>
            No videos available from this device
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const transfer = transfers.find((t) => t.videoId === item.id);
              const isTransferring =
                transfer?.status === "pending" ||
                transfer?.status === "downloading";
              const isCompleted = transfer?.status === "completed";

              return (
                <Pressable
                  style={[
                    styles.videoItem,
                    selectedIds.has(item.id) && styles.videoItemSelected,
                    isCompleted && styles.videoItemCompleted,
                  ]}
                  onPress={() =>
                    !isTransferring && !isCompleted && onToggle(item.id)
                  }
                  disabled={isTransferring || isCompleted}
                >
                  <View style={styles.checkbox}>
                    {isCompleted ? (
                      <Check size={14} color={colors.success} strokeWidth={3} />
                    ) : selectedIds.has(item.id) ? (
                      <Check size={14} color={colors.primary} strokeWidth={3} />
                    ) : null}
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.videoChannel}>{item.channelTitle}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.videoDuration}>
                        {formatDuration(item.duration)}
                      </Text>
                      {item.hasTranscript && (
                        <Text style={styles.transcriptBadge}>Transcript</Text>
                      )}
                    </View>
                    {transfer && transfer.status !== "completed" && (
                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            { width: `${transfer.progress}%` },
                          ]}
                        />
                        <Text style={styles.progressText}>
                          {transfer.status === "pending"
                            ? "Waiting..."
                            : transfer.status === "failed"
                              ? "Failed"
                              : `${transfer.progress}%`}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />

          <View style={styles.footer}>
            <Text style={styles.selectedCount}>{selectedIds.size} selected</Text>
            <Pressable
              style={[
                styles.downloadButton,
                (selectedIds.size === 0 || hasActiveTransfers) &&
                  styles.downloadButtonDisabled,
              ]}
              onPress={onDownload}
              disabled={selectedIds.size === 0 || hasActiveTransfers}
            >
              {hasActiveTransfers ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <Text style={styles.downloadButtonText}>Download Selected</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
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
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm + 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  backText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  peerName: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm + 4,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
    textAlign: "center",
    marginTop: spacing.md,
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
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  videoItemCompleted: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: colors.success,
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
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  videoDuration: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  transcriptBadge: {
    color: colors.success,
    fontSize: 10,
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  progressContainer: {
    height: 18,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    zIndex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: colors.card,
  },
  selectedCount: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
  },
  downloadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: spacing.sm + 4,
    borderRadius: 10,
    minWidth: 140,
    alignItems: "center",
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  downloadButtonText: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.semibold,
  },
});
