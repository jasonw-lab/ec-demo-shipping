# ADR-003: UI アプリアーキテクチャ (Feature-based)

**Status:** Accepted  
**Version:** 1.0.0
**Last Updated:** 2026-01-22  
**Date:** 2026-01-21  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service Admin UI (Next.js App Router + shadcn/ui)

---

## 1. 背景 / Context

Shipping Service の管理画面は、将来的に複数の業務ドメイン（出荷指示、在庫照会、マスタ管理など）を持つ可能性がある。  
初期実装（MVP）の段階から、**コードベースの肥大化に耐えうるディレクトリ構造**を定めておく必要がある。

Next.js App Router はディレクトリ構造の自由度が高いが、  
ルールを決めないと `components` や `hooks` がカオスになりやすい。

---

## 2. 検討した選択肢 / Options

### Option A: Layer-based (技術レイヤー単位)
従来の一般的な構成。
- `src/components/`
- `src/hooks/`
- `src/utils/`

**課題**
- 機能が増えると各フォルダが膨大になる
- ある機能に関連するコードが分散し、修正時のファイル移動が多い（Colocation が低い）

---

### Option B: **Feature-based / Vertical Slice (機能単位) [採用]**
ドメイン（機能）ごとにフォルダを切り、その中に必要な UI・ロジックを閉じる構成。
- `src/features/shipping/`
- `src/features/inventory/`

**メリット**
- 機能ごとの凝集度が高まる（High Cohesion）
- コードの配置場所（Colocation）が明確で、修正時の影響範囲がわかりやすい
- 複数人開発でのコンフリクトが減る

---

## 3. 決定 / Decision

**Feature-based Architecture (Bulletproof React スタイル)** を採用する。

### ディレクトリ構造の基本方針

**各UIベースの既存フォルダ構造を維持**し、以下の原則に従う：

```
apps/admin-{ui-base}/
├── app/                  # Next.js App Router (Routing, Layout, Page Shell)
│   └── (dashboard)/shipments/page.tsx  # Server Component entry
├── [features/components/...] # 各UIベース固有の構造に従う
│   └── shipping/         # ドメインごとに整理（Feature-based原則）
│       ├── components/   # UI コンポーネント
│       ├── api/          # Data Fetching
│       └── types/        # ドメイン固有型
├── components/ui/        # shadcn/ui（各UIベースのテーマ）
├── components/layouts/   # レイアウト（各UIベース固有）
└── lib/                  # ユーティリティ
```

**重要**: 具体的なフォルダ名は各UIベースに従う。Feature-based原則（ドメイン単位の整理）を維持すること。

---

## 4. 決定理由 / Rationale

### 4.1 業務ロジックの散逸防止
Shipping Service は「出荷」「在庫」「マスタ」など業務コンテキストが明確に分かれている。  
これらを `features/` 配下に集約することで、コードの見通しを良くする。

### 4.2 Feature の公開ルール (Encapsulation)
- 各ドメイン（shipping等）は明確な境界を持ち、export するものだけを外部から利用可能とする。
- ドメイン内部の詳細への直接アクセス（Deep Import）は原則禁止とする。
- 実装方法は各UIベースの既存パターンに従う（index.ts export、barrel exports等）。

### 4.3 App Router との責務分離
- **`app/`**: Routing, SEO (Metadata), Layout, Loading UI のみを担当。ロジックは持たない。
- **ドメイン実装領域**: 具体的な UI 実装、State 管理、API 通信を担当（配置場所は各UIベースに従う）。

---

## 5. 結果 / Consequences

### ポジティブ
- 関連コードが近くにあるため開発効率が良い（Colocation）
- 機能削除時はドメインフォルダを消すだけで済む
- `app/` が薄くなり、Next.js の破壊的変更の影響を受けにくくなる
- 各UIベースの既存構造を活かせる

### ネガティブ / トレードオフ
- 「共通化」の判断コストが発生する（後述の基準を適用）
- 初期のファイル数が若干増える（フォルダ階層が深くなる）

---

## 6. 補足ルール

### 6.1 共有コンポーネントの判断基準
1. **共有UI領域（各UIベースで異なる）**
   - **ドメイン知識を持たない**汎用的な UI 部品（Button, Card, Generic Table）。
   - 2つ以上のドメインで利用されるもの。

2. **ドメイン固有UI領域**
   - 特定のドメイン知識（ShippingStatus, OrderIdLink など）を持つ UI。
   - たとえ他ドメインから使いたくても、ドメイン知識がある場合は共有領域には移動しない。

### 6.2 Server / Client Component の配置
- `app/page.tsx` は原則 **Server Component** として振る舞う。
- ドメイン実装内のコンポーネントは、State (useState) や Effect (useEffect) が必要な場合にのみ `"use client"` を付与する。
- Data Fetching は各UIベースのパターンに従う（api/hooks/server actions等）。

### 6.3 テスト配置
- ドメイン単位でテストを配置（__tests__ 等、各UIベースのパターンに従う）。

---

## 7. 関連ドキュメント

- ADR-001: UI フレームワーク選定 (Next.js + shadcn/ui)  
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) (アーキテクチャの参考)
