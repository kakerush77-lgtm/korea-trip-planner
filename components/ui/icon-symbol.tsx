import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "calendar": "event",
  "person.2.fill": "group",
  "map.fill": "map",
  "clock.fill": "schedule",
  "location.fill": "location-on",
  "airplane": "flight",
  "fork.knife": "restaurant",
  "cart.fill": "shopping-cart",
  "heart.fill": "favorite",
  "star.fill": "star",
  "info.circle.fill": "info",
  "suitcase.fill": "luggage",
  "list.bullet": "format-list-bulleted",
  "square.and.arrow.up": "share",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "link": "link",
  "globe": "language",
  "mappin.and.ellipse": "place",
  "bag.fill": "shopping-bag",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
