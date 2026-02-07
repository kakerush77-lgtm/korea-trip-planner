import { StyleSheet } from "react-native";

/**
 * 全タブ画面で統一されたヘッダースタイル定義
 */
export const UNIFIED_HEADER_STYLES = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    height: 60,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  homeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * ヘッダーの統一定数
 */
export const HEADER_CONSTANTS = {
  HEIGHT: 60,
  PADDING_HORIZONTAL: 16,
  PADDING_VERTICAL: 12,
  BUTTON_SIZE: 38,
  ADD_BUTTON_SIZE: 38,
  TITLE_FONT_SIZE: 20,
  SUBTITLE_FONT_SIZE: 12,
  ICON_SIZE: 20,
  ADD_ICON_SIZE: 22,
} as const;
