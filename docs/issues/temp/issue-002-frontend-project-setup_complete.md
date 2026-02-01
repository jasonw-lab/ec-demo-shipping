# issue-002: Frontend Project Setup

## 概要
Next.js Frontend の基盤構成が整い、ローカルで管理画面が表示できる状態になる

## 目的
全ての Frontend 実装の土台となるプロジェクト構成を確立する

## エピック
E5: 基盤セットアップ

## やること
- Next.js App Router 設定
- shadcn/ui インストール・設定
- Tailwind CSS 設定
- arhamkhnz テンプレートからレイアウト導入 (Sidebar, Header)
- Feature-based ディレクトリ構造作成（ADR-003 準拠）

## ディレクトリ構造（ADR-003 準拠）

```
src/
├── app/                  # Next.js App Router (Routing, Layout)
│   └── (dashboard)/
│       ├── page.tsx      # Dashboard
│       └── shipments/
│           └── page.tsx  # 発送一覧
├── features/             # ビジネスロジック & ドメインUI
│   └── shipping/
│       ├── components/
│       ├── api/
│       ├── types/
│       └── index.ts      # Public API
├── components/           # 共有コンポーネント
│   ├── ui/               # shadcn/ui
│   └── layouts/          # Sidebar, Header
└── lib/                  # ユーティリティ
```

## 受け入れ条件
- [ ] `npm run dev` で開発サーバーが起動する
- [ ] http://localhost:3000 でサイドバー付きレイアウトが表示される
- [ ] shadcn/ui の Button コンポーネントが動作する
- [ ] `src/features/shipping/` ディレクトリが存在する

## デモ / 確認方法
- ブラウザで http://localhost:3000 を開く
- サイドバーとヘッダーが表示される
- サイドバーの開閉が動作する

## 非スコープ
- API 連携
- 実際の発送データ表示
- 認証画面

## 依存関係
- issue-001 (Backend Setup) - 並行作業可能だが、API 連携前に Backend が必要

## 次の Issue
- issue-006 (List UI) - この Issue 完了後に着手可能

## 関連ドキュメント
- [ADR-001: UI フレームワーク選定](../adr/ADR-001-ui-framework.md)
- [ADR-003: UI アーキテクチャ (Feature-based)](../adr/ADR-003-ui-architecture.md)
- [ui-dashboard-design.md v0.2.2](../architecture/ui-dashboard-design.md)
