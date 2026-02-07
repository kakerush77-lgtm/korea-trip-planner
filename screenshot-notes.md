# Screenshot Review - v6 (Photo Upload + File Import)

## Preview (2026-02-07 11:33 latest)
- 6タブ表示: スケジュール、リンク集、買いたい、持ち物、メンバー、管理
- 韓国旅行2026のヘッダー表示
- 日別タブ切り替え (1日目〜4日目)
- メンバーフィルタチップ (全員、翔平、かよこ、ななこ、ちふみ)
- タイムラインカード: 時間、タイトル、場所、メンバーバッジ、Naver Mapボタン
- 並べ替えボタン (↑↓) がヘッダーに表示
- +ボタンで予定追加
- 全11件の予定が1日目に表示
- TypeScript: 0 errors
- Tests: 56 passed (0 failed)

## New Features (v6)
- **買いたいものリストに写真アップロード機能**
  - カメラロール選択（expo-image-picker）
  - 写真プレビュー表示
  - ShoppingItemにimageUrlフィールド追加
- **設定画面にファイル選択インポート機能**
  - Web版: file input
  - ネイティブ版: DocumentPicker（expo-document-picker）
  - JSONファイル取り込み対応
  - 個別インポート（旅行全体・リンク集・買いたいもの・持ち物）

## Previous Features (v5)
- 行きたいところリスト削除 → リンク集機能に置き換え
- リンク集: タイトル・カテゴリ・URL管理
- 個別エクスポート/インポート機能（旅行全体・リンク集のみ・買いたいもののみ・持ち物のみ）

## Previous Features (v4)
- カレンダー日程選択UI
- スクロール式時間ピッカー
- 旅行データインポート/エクスポート
- メンバー別持ち物管理
- 買いたいものリスト

