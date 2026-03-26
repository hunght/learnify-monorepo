import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import type { RemoteSubscription } from "../../types";
import { SubscriptionCard } from "./SubscriptionCard";

interface SubscriptionListProps {
  subscriptions: RemoteSubscription[];
  isLoading: boolean;
  error: string | null;
  onSubscriptionPress: (subscription: RemoteSubscription) => void;
  onRefresh: () => void;
}

export function SubscriptionList({
  subscriptions,
  isLoading,
  error,
  onSubscriptionPress,
  onRefresh,
}: SubscriptionListProps) {
  if (isLoading && subscriptions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load subscriptions</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No subscriptions yet</Text>
        <Text style={styles.emptySubtext}>
          Import your YouTube subscriptions in the desktop app
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={subscriptions}
      keyExtractor={(item) => item.channelId}
      renderItem={({ item }) => (
        <SubscriptionCard
          subscription={item}
          onPress={() => onSubscriptionPress(item)}
        />
      )}
      contentContainerStyle={styles.list}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: "#e94560",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorDetail: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    paddingVertical: 8,
  },
});
