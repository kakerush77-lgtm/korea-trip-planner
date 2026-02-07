import { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface CategoryScrollPickerProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

/**
 * カテゴリスクロールピッカー（ドラムロール型）
 */
export function CategoryScrollPicker({
  categories,
  selectedCategory,
  onSelect,
}: CategoryScrollPickerProps) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(
    categories.indexOf(selectedCategory) >= 0 ? categories.indexOf(selectedCategory) : 0
  );

  useEffect(() => {
    const index = categories.indexOf(selectedCategory);
    if (index >= 0 && index !== selectedIndex) {
      setSelectedIndex(index);
      scrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [selectedCategory, categories]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < categories.length && index !== selectedIndex) {
      setSelectedIndex(index);
      onSelect(categories[index]);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      {/* 選択ハイライト */}
      <View
        style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          backgroundColor: colors.primary + "20",
          borderRadius: 8,
          zIndex: 0,
        }}
      />

      {/* スクロールリスト */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {categories.map((category, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Pressable
              key={category}
              onPress={() => {
                setSelectedIndex(index);
                onSelect(category);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: isSelected ? 18 : 14,
                  fontWeight: isSelected ? "bold" : "normal",
                  color: isSelected ? colors.foreground : colors.muted,
                }}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
