import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import type { DiscoveredPeer } from "../../types";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";
import { Smartphone, Radio, ChevronRight } from "../../theme/icons";

interface PeerListProps {
  peers: DiscoveredPeer[];
  isScanning: boolean;
  selectedPeer: DiscoveredPeer | null;
  onSelectPeer: (peer: DiscoveredPeer) => void;
}

export function PeerList({
  peers,
  isScanning,
  selectedPeer,
  onSelectPeer,
}: PeerListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Devices</Text>
        {isScanning && (
          <View style={styles.scanningRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        )}
      </View>

      {peers.length === 0 ? (
        <View style={styles.emptyState}>
          <Radio size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>
            {isScanning
              ? "Looking for nearby devices sharing videos..."
              : "No devices found. Make sure another device is sharing videos on the same WiFi network."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.name}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.peerItem,
                selectedPeer?.name === item.name && styles.peerItemSelected,
              ]}
              onPress={() => onSelectPeer(item)}
            >
              <View style={styles.peerIcon}>
                <Smartphone size={24} color={colors.mutedForeground} />
              </View>
              <View style={styles.peerInfo}>
                <Text style={styles.peerName}>{item.name}</Text>
                <Text style={styles.peerMeta}>
                  {item.videoCount} video{item.videoCount !== 1 ? "s" : ""} •{" "}
                  {item.host}:{item.port}
                </Text>
              </View>
              <View style={styles.arrow}>
                <ChevronRight size={24} color={colors.textTertiary} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
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
  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scanningText: {
    color: colors.primary,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.md,
  },
  list: {
    flex: 1,
  },
  peerItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  peerItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  peerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm + 4,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  peerMeta: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  arrow: {
    paddingLeft: spacing.sm,
  },
});
