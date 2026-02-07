import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useAppStore } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Trip } from "@/data/types";

/**
 * TOPページ - 旅行一覧画面
 */
export default function HomeScreen() {
  const { state, setCurrentTrip } = useAppStore();
  const trips = state.trips;
  const currentTripId = state.currentTripId;
  const colors = useColors();

  const handleTripPress = (tripId: string) => {
    setCurrentTrip(tripId);
    router.push("/(tabs)/schedule");
  };

  const handleCreateTrip = () => {
    router.push("/trip-form");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScreenHeader
        title="旅行一覧"
        rightButton={{
          icon: "plus",
          onPress: handleCreateTrip,
        }}
      />

      {/* 旅行リスト */}
      <ScrollView className="flex-1 px-4 py-4">
        {trips.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-base text-muted text-center mb-4">
              旅行が登録されていません
            </Text>
            <Pressable
              onPress={handleCreateTrip}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="px-6 py-3 rounded-full"
            >
              <Text className="text-base font-semibold text-background">
                新しい旅行を作成
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {trips.map((trip: Trip) => {
              const isActive = trip.id === currentTripId;
              const startDate = new Date(trip.startDate);
              const endDate = new Date(trip.endDate);
              const dayCount = trip.days.length;

              return (
                <Pressable
                  key={trip.id}
                  onPress={() => handleTripPress(trip.id)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: isActive
                        ? colors.primary + "20"
                        : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  className="p-4 rounded-xl border-2"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground mb-1">
                        {trip.name}
                      </Text>
                      <Text className="text-sm text-muted mb-2">
                        {startDate.toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        〜{" "}
                        {endDate.toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                      <View className="flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1">
                          <IconSymbol
                            name="calendar"
                            size={16}
                            color={colors.muted}
                          />
                          <Text className="text-sm text-muted">
                            {dayCount}日間
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <IconSymbol
                            name="list.bullet"
                            size={16}
                            color={colors.muted}
                          />
                          <Text className="text-sm text-muted">
                            {trip.events.length}件
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isActive && (
                      <View
                        style={{ backgroundColor: colors.primary }}
                        className="px-2 py-1 rounded-full"
                      >
                        <Text className="text-xs font-semibold text-background">
                          選択中
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
