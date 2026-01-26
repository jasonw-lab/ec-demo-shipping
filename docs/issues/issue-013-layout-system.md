# Issue 013: レイアウトシステム統一（Horizon UI 移行）

**作成日**: 2026-01-26  
**優先度**: P0  
**工数見積**: 1日  
**ステータス**: ✅ 完了  
**関連 ADR**: [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)

---

## 📋 概要

Horizon UI の Layout System（Sidebar / Header / Theme）を基盤として整備し、すべての画面で共通使用する。

**重要**: このIssueはレイアウトシステムの「採用・検証・確定」であり、Horizon UI のテーマシステムを変更するものではありません。

---

## 🎯 対応内容

### 1. Horizon UI Layout System 整備
- `components/layouts/` に Horizon UI ベースのレイアウトを配置
- Sidebar / Header / DashboardLayout の実装
- next-themes による Light/Dark Mode 切り替え

### 2. テーマシステム検証・確定
- Horizon UI のテーマシステムをそのまま採用（変更なし）
- 既存の Tailwind CSS カスタムカラー設定（`tailwind.config.ts`）を確認・検証
- 既存の CSS Variables デザイントークン（`globals.css`）を確認・検証
- Light/Dark Mode 切り替えが正常に動作することを検証
- **注意**: テーマシステムの変更・カスタマイズは行わない

### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 ├─ 発送一覧 (/shipments)
 └─ AI Chat（保留）
```

**注意**: AI Chat 機能は将来の拡張機能として構造のみ定義し、実装は保留とします。

### 4. レスポンシブ対応
- Sidebar の折りたたみ機能
- Mobile 表示対応（ハンバーガーメニュー）

---

## 🛠️ 技術要件

### 使用コンポーネント
- Horizon UI: Layout System (Sidebar, Header, DashboardLayout)
- shadcn/ui: Button, Sheet (Mobile Menu)
- lucide-react: アイコン

### ディレクトリ構造
```
apps/admin-horizon-ui/
├── components/
│   └── layouts/
│       ├── sidebar.tsx           # Horizon UI ベースのサイドバー
│       ├── header.tsx            # Horizon UI ベースのヘッダー
│       ├── dashboard-layout.tsx  # メインレイアウト
│       └── index.ts
├── styles/
│   └── globals.css               # CSS Variables & Theme（検証のみ）
└── tailwind.config.ts            # デザイントークン設定（検証のみ）
```

---

## ✅ 受け入れ条件

- [x] Light/Dark Mode が正常に切り替わる
- [x] Sidebar が折りたたみ可能
- [x] Mobile 表示で正常に動作（ハンバーガーメニュー表示）
- [x] すべてのページで共通レイアウトが適用される
- [x] アクセシビリティ検証（キーボード操作可能）

---

## 🎨 カスタマイズ制約（重要）

### 🚫 変更禁止（Horizon UI をそのまま使用）
- Sidebar の構造・スタイル・幅
- Header の構造・スタイル・高さ
- テーマシステム（CSS Variables / デザイントークン）
- レイアウトグリッド・Spacing システム
- Light/Dark Mode 切り替え機構

### ✅ カスタマイズ可能
- ナビゲーション項目（日本語ラベル、リンク先）
- アイコンの選択（lucide-react 範囲内）
- ロゴ・ブランディング要素

### ⚠️ 変更が必要な場合
全体スタイル・レイアウトの変更が必要と判断した場合：
1. 変更理由を文書化
2. 代替案を検討（Horizon UI の枠内で解決できないか）
3. Tech Lead の承認を得る

---

## 🚫 非対応（本Issue外）

- ユーザープロファイル機能（ヘッダー右上）
- 多言語対応
- 通知機能

---

## 📚 参考資料

- [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)
- [Horizon UI Shadcn Boilerplate](https://horizon-ui.com/shadcn-ui)
- [Horizon UI Documentation](https://horizon-ui.com/docs-boilerplate/shadcn-components)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📝 実装ガイドライン（AI Agent 向け）

### 必須遵守事項

1. **Horizon UI のソースコードをそのまま使用**
   - Horizon UI の Layout System をベースに実装
   - 構造・スタイルは変更しない

2. **テーマシステムは検証のみ**
   - `tailwind.config.ts` の内容を確認し、Horizon UI のデフォルト設定を維持
   - `globals.css` の CSS Variables を確認し、変更しない
   - Light/Dark Mode の動作を検証

3. **ナビゲーション項目のカスタマイズのみ**
   - メニュー項目の日本語化
   - リンク先の設定
   - アイコンの選択（lucide-react から適切なものを選ぶ）

4. **レスポンシブ対応の検証**
   - Horizon UI が提供するレスポンシブ機能を検証
   - Mobile / Tablet / Desktop での表示確認

---

**このIssueは P0（最優先）です。他の画面移行Issueの基盤となります。**
