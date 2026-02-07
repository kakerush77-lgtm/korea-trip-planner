import { View, Text, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export interface ScreenHeaderProps {
  title: string;
  rightButton?: {
    icon: string;
    onPress: () => void;
    label?: string;
  };
  leftButton?: {
    icon: string;
    onPress: () => void;
  };
}

/**
 * 統一ヘッダーコンポーネント
 * 高さ: 56px、タイトルサイズ: 20px（font-bold）
 */
export function ScreenHeader({ title, rightButton, leftButton }: ScreenHeaderProps) {
  const colors = useColors();

  return (
    <View
      style={{ borderBottomColor: colors.border }}
      className="h-14 px-4 flex-row items-center justify-between border-b"
    >
      {/* 左ボタン */}
      <View className="w-10">
        {leftButton && (
          <Pressable
            onPress={leftButton.onPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name={leftButton.icon as any} size={24} color={colors.foreground} />
          </Pressable>
        )}
      </View>

      {/* タイトル */}
      <Text className="text-xl font-bold text-foreground">{title}</Text>

      {/* 右ボタン */}
      <View className="w-10">
        {rightButton && (
          <Pressable
            onPress={rightButton.onPress}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <IconSymbol name={rightButton.icon as any} size={24} color={colors.background} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
